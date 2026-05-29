package services

import (
	"context"
	"fmt"
	"time"

	"github.com/chromedp/chromedp"
)

// ScreenshotService captures website screenshots via the Chrome DevTools Protocol.
type ScreenshotService struct{}

// NewScreenshotService creates a new ScreenshotService.
func NewScreenshotService() *ScreenshotService {
	return &ScreenshotService{}
}

// TakeScreenshot navigates to targetURL, waits for the page to load, and returns a full-page PNG.
// The context must carry a deadline — the service enforces a 30-second timeout as a safety net.
func (s *ScreenshotService) TakeScreenshot(ctx context.Context, targetURL string) ([]byte, error) {
	// Wrap the caller's context with a hard 30‑second timeout so a misbehaving
	// page can never hang the server.
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	// Create a new headless browser session.
	ctx, cancel = chromedp.NewContext(ctx)
	defer cancel()

	// Navigate and capture the full page.
	var buf []byte
	err := chromedp.Run(ctx,
		chromedp.EmulateViewport(1920, 1080),
		chromedp.Navigate(targetURL),
		chromedp.WaitReady("body"),
		chromedp.FullScreenshot(&buf, 100),
	)
	if err != nil {
		return nil, fmt.Errorf("screenshot failed: %w", err)
	}

	return buf, nil
}
