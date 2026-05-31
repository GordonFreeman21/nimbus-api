package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/gordonfreeman21/nimbus-api/internal/models"
)

// ErrMissingAPIKey is returned when the Unsplash access key is not configured.
var ErrMissingAPIKey = errors.New("image API key missing")

const (
	unsplashSearchURL = "https://api.unsplash.com/search/photos"
	cacheTTL          = 2 * time.Minute
)

type cacheEntry struct {
	response  models.ImageSearchResponse
	expiresAt time.Time
}

// ImageService searches for images via the Unsplash API with an in-memory cache.
type ImageService struct {
	httpClient *http.Client
	accessKey  string
	mu         sync.RWMutex
	cache      map[string]cacheEntry
}

// NewImageService creates a new ImageService.
func NewImageService(accessKey string) *ImageService {
	svc := &ImageService{
		httpClient: &http.Client{Timeout: 10 * time.Second},
		accessKey:  accessKey,
		cache:      make(map[string]cacheEntry),
	}
	go svc.cleanupLoop()
	return svc
}

func (s *ImageService) cacheKey(query string, page, perPage int) string {
	return fmt.Sprintf("%s|%d|%d", query, page, perPage)
}

func (s *ImageService) cleanupLoop() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		s.mu.Lock()
		now := time.Now()
		for k, v := range s.cache {
			if now.After(v.expiresAt) {
				delete(s.cache, k)
			}
		}
		s.mu.Unlock()
	}
}

// Search queries the Unsplash /search/photos endpoint and returns paginated results.
func (s *ImageService) Search(ctx context.Context, query string, page, perPage int) (*models.ImageSearchResponse, error) {
	if s.accessKey == "" {
		return nil, ErrMissingAPIKey
	}

	key := s.cacheKey(query, page, perPage)

	s.mu.RLock()
	if entry, ok := s.cache[key]; ok && time.Now().Before(entry.expiresAt) {
		s.mu.RUnlock()
		resp := entry.response
		return &resp, nil
	}
	s.mu.RUnlock()

	apiURL := fmt.Sprintf("%s?query=%s&page=%d&per_page=%d",
		unsplashSearchURL, url.QueryEscape(query), page, perPage)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("building search request: %w", err)
	}
	req.Header.Set("Authorization", "Client-ID "+s.accessKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("unsplash API call: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unsplash API returned status %d", resp.StatusCode)
	}

	var unsplash models.UnsplashSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&unsplash); err != nil {
		return nil, fmt.Errorf("decoding unsplash response: %w", err)
	}

	results := make([]models.ImageResult, 0, len(unsplash.Results))
	for _, r := range unsplash.Results {
		credit := "Photo by "
		if r.User.Name != "" {
			credit += r.User.Name
		} else {
			credit += "Unknown"
		}
		credit += " on Unsplash"

		results = append(results, models.ImageResult{
			URL:       r.URLs.Regular,
			Thumbnail: r.URLs.Thumb,
			Credit:    credit,
			Author:    r.User.Name,
			AuthorURL: r.User.Links.HTML,
		})
	}

	response := models.ImageSearchResponse{
		Total:   unsplash.Total,
		Page:    page,
		PerPage: perPage,
		Results: results,
	}

	s.mu.Lock()
	s.cache[key] = cacheEntry{
		response:  response,
		expiresAt: time.Now().Add(cacheTTL),
	}
	s.mu.Unlock()

	return &response, nil
}
