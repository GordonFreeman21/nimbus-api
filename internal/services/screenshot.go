package services

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/chromedp/cdproto/emulation"
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

	// Create a headless browser allocator with stealth flags.
	allocCtx, allocCancel := chromedp.NewExecAllocator(ctx,
		chromedp.ExecPath("C:/Program Files/Google/Chrome/Application/chrome.exe"),
		chromedp.Flag("headless", true),
		chromedp.Flag("disable-blink-features", "AutomationControlled"),
		chromedp.Flag("disable-features", "IsolateOrigins,site-per-process"),
		chromedp.Flag("disable-extensions", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("window-size", "1920,1080"),
	)
	defer allocCancel()

	// Create a new browser context from the allocator.
	browserCtx, browserCancel := chromedp.NewContext(allocCtx)
	defer browserCancel()

	// Random delay before starting to mimic a human.
	time.Sleep(time.Duration(500+rand.Intn(1500)) * time.Millisecond)

	var buf []byte
	err := chromedp.Run(browserCtx,
		// Set a realistic user agent via CDP.
		chromedp.ActionFunc(func(ctx context.Context) error {
			return emulation.SetUserAgentOverride(
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			).Do(ctx)
		}),
		// Navigate to the URL.
		chromedp.Navigate(targetURL),
		// Wait for the body to be ready.
		chromedp.WaitReady("body"),
		// Brief pause for JS-rendered content.
		chromedp.ActionFunc(func(ctx context.Context) error {
			time.Sleep(time.Duration(1000+rand.Intn(2000)) * time.Millisecond)
			return nil
		}),
		// Capture full-page screenshot.
		chromedp.FullScreenshot(&buf, 100),
	)
	if err != nil {
		return nil, fmt.Errorf("screenshot failed: %w", err)
	}

	return buf, nil
}
