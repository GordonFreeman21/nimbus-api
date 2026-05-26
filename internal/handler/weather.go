package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gordonfreeman21/nimbus-api/internal/models"
	"github.com/gordonfreeman21/nimbus-api/internal/services"
)

type WeatherHandler struct {
	service *services.WeatherService
}

func NewWeatherHandler(service *services.WeatherService) *WeatherHandler {
	return &WeatherHandler{service: service}
}

func (h *WeatherHandler) GetCurrentWeather(w http.ResponseWriter, r *http.Request) {
	city := r.URL.Query().Get("city")
	if city == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(models.ErrorResponse{Error: "missing 'city' query parameter"})
		return
	}

	weather, err := h.service.GetWeatherByCity(city)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		if err.Error() == "city not found" {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(models.ErrorResponse{Error: "city not found"})
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(models.ErrorResponse{Error: "failed to fetch weather data"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(weather)
}
