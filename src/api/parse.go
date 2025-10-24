package api

import (
	"encoding/json"
	"feed-parallel-parse-api/src/models"
	"feed-parallel-parse-api/src/services"
	"net/http"
)

// ParseHandler handles POST /parse requests
func ParseHandler(w http.ResponseWriter, r *http.Request) {
	var req models.ParseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(models.ParseResponse{Feeds: nil, Errors: []models.ErrorInfo{{URL: "", Message: "invalid request"}}})
		return
	}

	svc := services.NewRSSService()
	feeds, errors := svc.ParseFeeds(r.Context(), req.URLs)
	resp := models.ParseResponse{Feeds: feeds, Errors: errors}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
