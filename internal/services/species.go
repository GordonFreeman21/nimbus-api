package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/gordonfreeman21/nimbus-api/internal/models"
)

// ErrSpeciesNotFound is returned when GBIF cannot match the requested name.
var ErrSpeciesNotFound = errors.New("species not found")

// GBIF species/search API response.
type gbifSearchResponse struct {
	Results []struct {
		CanonicalName string `json:"canonicalName"`
		Species       string `json:"species"`
		Rank          string `json:"rank"`
	} `json:"results"`
}

// GBIF species/match API response — hierarchy fields we care about.
type gbifMatchResponse struct {
	CanonicalName string `json:"canonicalName"`
	Species       string `json:"species"`
	Kingdom       string `json:"kingdom"`
	Phylum        string `json:"phylum"`
	Class         string `json:"class"`
	Order         string `json:"order"`
	Family        string `json:"family"`
}

// SpeciesService queries the GBIF Species API for taxonomic data.
type SpeciesService struct {
	httpClient *http.Client
	searchURL  string
	matchURL   string
}

// NewSpeciesService creates a new SpeciesService with a sane default timeout.
func NewSpeciesService() *SpeciesService {
	return &SpeciesService{
		httpClient: &http.Client{Timeout: 10 * time.Second},
		searchURL:  "https://api.gbif.org/v1/species/search",
		matchURL:   "https://api.gbif.org/v1/species/match",
	}
}

// LookupSpecies searches GBIF for a species by common (or scientific) name and
// returns a flat taxonomic hierarchy. The provided context allows callers to
// enforce a deadline.
func (s *SpeciesService) LookupSpecies(ctx context.Context, name string) (*models.Species, error) {
	// Step 1 — search GBIF by any name (common or scientific) to resolve
	// the canonical scientific name.
	canonical, err := s.searchByName(ctx, name)
	if err != nil {
		return nil, err
	}

	// Step 2 — use the match endpoint to get the full accepted hierarchy
	// (kingdom, phylum, class, order, family) for that canonical name.
	return s.matchByName(ctx, name, canonical)
}

// searchByName queries the GBIF species search endpoint and returns the
// canonical scientific name of the best-matching species.
func (s *SpeciesService) searchByName(ctx context.Context, name string) (string, error) {
	apiURL := fmt.Sprintf("%s?q=%s&limit=1&rank=SPECIES",
		s.searchURL, url.QueryEscape(name))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return "", fmt.Errorf("building search request: %w", err)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("gbif search API call: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("gbif search API returned status %d", resp.StatusCode)
	}

	var search gbifSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&search); err != nil {
		return "", fmt.Errorf("decoding gbif search response: %w", err)
	}

	if len(search.Results) == 0 {
		return "", ErrSpeciesNotFound
	}

	// Prefer the full species name, falling back to canonicalName.
	r := search.Results[0]
	if r.Species != "" {
		return r.Species, nil
	}
	if r.CanonicalName != "" {
		return r.CanonicalName, nil
	}

	return "", ErrSpeciesNotFound
}

// matchByName calls GBIF species/match to retrieve the full taxonomic
// hierarchy for the resolved scientific name.
func (s *SpeciesService) matchByName(ctx context.Context, originalName, scientificName string) (*models.Species, error) {
	apiURL := fmt.Sprintf("%s?name=%s", s.matchURL, url.QueryEscape(scientificName))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("building match request: %w", err)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("gbif match API call: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("gbif match API returned status %d", resp.StatusCode)
	}

	var gbif gbifMatchResponse
	if err := json.NewDecoder(resp.Body).Decode(&gbif); err != nil {
		return nil, fmt.Errorf("decoding gbif match response: %w", err)
	}

	// Prefer the accepted species name over the matched canonical name
	// (the matched name may be a synonym).
	sciName := gbif.CanonicalName
	if gbif.Species != "" {
		sciName = gbif.Species
	}

	if sciName == "" {
		return nil, ErrSpeciesNotFound
	}

	return &models.Species{
		CommonName:     originalName,
		ScientificName: sciName,
		Kingdom:        gbif.Kingdom,
		Phylum:         gbif.Phylum,
		Class:          gbif.Class,
		Order:          gbif.Order,
		Family:         gbif.Family,
	}, nil
}
