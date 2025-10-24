package unit

import (
	"encoding/json"
	"testing"

	"feed-parallel-parse-api/src/models"

	"github.com/stretchr/testify/assert"
)

func Testレスポンスが仕様通りのJSON形式(t *testing.T) {
	resp := models.ParseResponse{
		Feeds:  []models.RSSFeed{{Title: "テスト", Link: "https://example.com/rss", Articles: []models.Article{}}},
		Errors: []models.ErrorInfo{},
	}
	data, err := json.Marshal(resp)
	assert.NoError(t, err)
	assert.Contains(t, string(data), "feeds")
	assert.Contains(t, string(data), "errors")
}
