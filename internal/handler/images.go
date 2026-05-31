package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gordonfreeman21/nimbus-api/internal/models"
	"github.com/gordonfreeman21/nimbus-api/internal/services"
)

// ImageHandler handles HTTP requests for the image search endpoint.
type ImageHandler struct {
	service *services.ImageService
}

// NewImageHandler creates a new ImageHandler.
func NewImageHandler(svc *services.ImageService) *ImageHandler {
	return &ImageHandler{service: svc}
}

// GetImages searches for images by keyword via the Unsplash API.
func (h *ImageHandler) GetImages(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	q := r.URL.Query().Get("q")
	if q == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(models.ErrorResponse{
			Error: "missing 'q' query parameter (e.g. ?q=mountains)",
		})
		return
	}

	page := 1
	if p := r.URL.Query().Get("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}

	perPage := 10
	if pp := r.URL.Query().Get("per_page"); pp != "" {
		if v, err := strconv.Atoi(pp); err == nil && v > 0 {
			if v > 30 {
				v = 30
			}
			perPage = v
		}
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	resp, err := h.service.Search(ctx, q, page, perPage)
	if err != nil {
		if errors.Is(err, services.ErrMissingAPIKey) {
			w.WriteHeader(http.StatusServiceUnavailable)
			json.NewEncoder(w).Encode(models.ErrorResponse{Error: "image API key missing"})
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(models.ErrorResponse{Error: "failed to fetch images"})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}
