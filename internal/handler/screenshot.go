package handlers

import (
	"context"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gordonfreeman21/nimbus-api/internal/services"
)

// ScreenshotHandler serves the /api/v1/screenshot endpoint.
type ScreenshotHandler struct {
	svc *services.ScreenshotService
}

// NewScreenshotHandler creates a new ScreenshotHandler.
func NewScreenshotHandler(svc *services.ScreenshotService) *ScreenshotHandler {
	return &ScreenshotHandler{svc: svc}
}

// CaptureScreenshot extracts ?url=, validates it, calls the service, and
// streams the PNG image back to the client.
func (h *ScreenshotHandler) CaptureScreenshot(w http.ResponseWriter, r *http.Request) {
	rawURL := r.URL.Query().Get("url")
	if rawURL == "" {
		http.Error(w, "missing 'url' query parameter", http.StatusBadRequest)
		return
	}

	if !strings.HasPrefix(rawURL, "http://") && !strings.HasPrefix(rawURL, "https://") {
		http.Error(w, "url must start with http:// or https://", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	png, err := h.svc.TakeScreenshot(ctx, rawURL)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			http.Error(w, "request timed out", http.StatusGatewayTimeout)
			return
		}
		log.Printf("screenshot error: %v", err)
		http.Error(w, "failed to capture screenshot", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "image/png")
	if _, err := w.Write(png); err != nil {
		log.Printf("failed to write screenshot response: %v", err)
	}
}
