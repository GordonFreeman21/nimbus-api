package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/gordonfreeman21/nimbus-api/internal/models"
	"github.com/gordonfreeman21/nimbus-api/internal/services"
)

// SpeciesHandler handles HTTP requests for the species taxonomy endpoint.
type SpeciesHandler struct {
	service *services.SpeciesService
}

// NewSpeciesHandler creates a new SpeciesHandler.
func NewSpeciesHandler(svc *services.SpeciesService) *SpeciesHandler {
	return &SpeciesHandler{service: svc}
}

// GetSpeciesTaxonomy returns the full scientific hierarchy for a given common
// name by querying the GBIF Species API.
func (h *SpeciesHandler) GetSpeciesTaxonomy(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	name := r.URL.Query().Get("name")
	if name == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(models.ErrorResponse{
			Error: "missing 'name' query parameter (e.g. ?name=Blue+Whale)",
		})
		return
	}

	// Enforce a 5-second deadline so we never hang on the upstream API.
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	species, err := h.service.LookupSpecies(ctx, name)
	if err != nil {
		if errors.Is(err, services.ErrSpeciesNotFound) {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(models.ErrorResponse{Error: "species not found"})
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(models.ErrorResponse{Error: "failed to look up species taxonomy"})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(species)
}
