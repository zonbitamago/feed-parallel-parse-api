package handler

import (
	"encoding/json"
	"feed-parallel-parse-api/api/models"
	"feed-parallel-parse-api/api/services"
	"net/http"
)

// Handler is the Vercel serverless function entry point
func Handler(w http.ResponseWriter, r *http.Request) {
	// Only allow POST method
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Parse request
	var req models.ParseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(models.ParseResponse{Feeds: nil, Errors: []models.ErrorInfo{{URL: "", Message: "invalid request"}}})
		return
	}

	// Process feeds
	svc := services.NewRSSService()
	feeds, errors := svc.ParseFeeds(r.Context(), req.URLs)
	resp := models.ParseResponse{Feeds: feeds, Errors: errors}

	// Send response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
