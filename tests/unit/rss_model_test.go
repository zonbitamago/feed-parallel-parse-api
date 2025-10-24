package unit

import (
	"feed-parallel-parse-api/src/models"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRSSFeedModel_仕様テスト(t *testing.T) {
	cases := []struct {
		name        string
		feed        models.RSSFeed
		wantTitle   string
		wantArticles int
	}{
		{"タイトルが正しく保持される", models.RSSFeed{Title: "テストフィード", Link: "https://example.com/rss", Articles: []models.Article{{Title: "A", Link: "https://a", PubDate: "2025-10-24", Summary: "summary"}}}, "テストフィード", 1},
		{"記事リストが空の場合は0件", models.RSSFeed{Title: "空フィード", Link: "https://example.com/rss", Articles: []models.Article{}}, "空フィード", 0},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.wantTitle, tc.feed.Title)
			assert.Equal(t, tc.wantArticles, len(tc.feed.Articles))
		})
	}
}
