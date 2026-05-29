package services

import (
	"context"
	"fmt"
	"log"
	"math/rand"
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

	// Create a new headless browser session with stealth options.
	opts := []chromedp.ContextOption{
		chromedp.NewContext(ctx),
		chromedp.WithLogf(log.Printf),
	}

	// Add browser options to evade detection.
	ctx, cancel = chromedp.NewExecAllocator(ctx,
		chromedp.Flag("headless", true),
		chromedp.Flag("disable-blink-features", "AutomationControlled"),
		chromedp.Flag("disable-features", "IsolateOrigins,site-per-process"),
		chromedp.Flag("disable-extensions", true),
		chromedp.Flag("disable-web-security", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("window-size", "1920,1080"),
	)
	defer cancel()

	// Create a new context for the page.
	ctx, cancel = chromedp.NewContext(ctx, opts...)
	defer cancel()

	// Navigate and capture the full page with stealth measures.
	var buf []byte
	err := chromedp.Run(ctx,
		// Set realistic viewport.
		chromedp.EmulateViewport(1920, 1080),
		// Set user agent to a common browser.
		chromedp.ActionFunc(func(ctx context.Context) error {
			return chromedp.EmulateUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36").Do(ctx)
		}),
		// Add random delay to mimic human behavior.
		chromedp.ActionFunc(func(ctx context.Context) error {
			time.Sleep(time.Duration(1000+rand.Intn(2000)) * time.Millisecond)
			return nil
		}),
		// Navigate to the target URL.
		chromedp.Navigate(targetURL),
		// Wait for the page to load.
		chromedp.WaitReady("body"),
		// Add delay after page load.
		chromedp.ActionFunc(func(ctx context.Context) error {
			time.Sleep(time.Duration(500+rand.Intn(1000)) * time.Millisecond)
			return nil
		}),
		// Capture full page screenshot.
		chromedp.FullScreenshot(&buf, 100),
	)
	if err != nil {
		return nil, fmt.Errorf("screenshot failed: %w", err)
	}

	return buf, nil
}
