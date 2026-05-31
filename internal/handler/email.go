package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gordonfreeman21/nimbus-api/internal/models"
	resend "github.com/resend/resend-go/v2"
)

func SendEmail(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	q := r.URL.Query()
	to := q.Get("to")
	if to == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(models.ErrorResponse{
			Error: "missing 'to' query parameter (e.g. ?to=user@example.com)",
		})
		return
	}

	subject := q.Get("subject")
	body := q.Get("body")

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	apiKey := os.Getenv("RESEND_API_KEY")
	sender := os.Getenv("RESEND_SENDER_EMAIL")
	if sender == "" {
		sender = "nimbus-api@resend.dev"
	}

	client := resend.NewClient(apiKey)

	params := &resend.SendEmailRequest{
		From:    sender,
		To:      []string{to},
		Subject: subject,
		Html:    body,
	}

	_, err := client.Emails.SendWithContext(ctx, params)
	if err != nil {
		log.Printf("Resend error: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(models.ErrorResponse{Error: "failed to send email"})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "email sent"})
}