package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gordonfreeman21/nimbus-api/internal/models"
	"github.com/gordonfreeman21/nimbus-api/internal/services"
)

type EmailHandler struct {
	service *services.EmailService
}

func NewEmailHandler(svc *services.EmailService) *EmailHandler {
	return &EmailHandler{service: svc}
}

func (h *EmailHandler) SendEmail(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	to := r.URL.Query().Get("to")
	subject := r.URL.Query().Get("subject")
	body := r.URL.Query().Get("body")

	if to == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(models.ErrorResponse{
			Error: "missing 'to' query parameter (e.g. ?to=user@example.com)",
		})
		return
	}

	resp, err := h.service.SendEmail(r.Context(), to, subject, body)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(models.ErrorResponse{Error: "failed to send email"})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}
