package services

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/gordonfreeman21/nimbus-api/internal/models"
)

type EmailService struct {
	httpClient *http.Client
	apiURL     string
}

func NewEmailService(apiURL string) *EmailService {
	return &EmailService{
		httpClient: &http.Client{Timeout: 10 * time.Second},
		apiURL:     apiURL,
	}
}

func (s *EmailService) SendEmail(ctx context.Context, to, subject, body string) (*models.EmailResponse, error) {
	apiURL := fmt.Sprintf("%s?to=%s&subject=%s&body=%s",
		s.apiURL, url.QueryEscape(to), url.QueryEscape(subject), url.QueryEscape(body))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("building email request: %w", err)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("email API call: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("email API returned status %d", resp.StatusCode)
	}

	var emailResp models.EmailResponse
	if err := json.NewDecoder(resp.Body).Decode(&emailResp); err != nil {
		return nil, fmt.Errorf("decoding email response: %w", err)
	}

	return &emailResp, nil
}
