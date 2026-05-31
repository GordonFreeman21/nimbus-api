package handlers

import (
	"io"
	"net/http"
)

const emailAPI = "https://nimbus-api-gxuc.onrender.com/api/v1/email"

func SendEmail(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	if q.Get("to") == "" {
		http.Error(w, `{"error":"missing 'to' query parameter"}`, http.StatusBadRequest)
		return
	}

	target := emailAPI + "?" + q.Encode()
	resp, err := http.Get(target)
	if err != nil {
		http.Error(w, `{"error":"failed to send email"}`, http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}
