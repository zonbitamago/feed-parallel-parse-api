package handler

import (
	"feed-parallel-parse-api/src/api"
	"net/http"
)

// Handler is the Vercel serverless function entry point
func Handler(w http.ResponseWriter, r *http.Request) {
	// Only allow POST method
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Delegate to the main parse handler
	api.ParseHandler(w, r)
}
