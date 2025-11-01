package unit

import (
	"feed-parallel-parse-api/pkg/models"
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

// 🔴 Red: User Story 1 - RSSFeedモデルにFeedURLフィールド追加のテスト
func TestRSSFeedModel_FeedURLフィールド存在確認(t *testing.T) {
	// Arrange: FeedURLフィールドを持つRSSFeedを作成
	feed := models.RSSFeed{
		Title:    "テストフィード",
		Link:     "https://example.com",
		FeedURL:  "https://example.com/rss", // ← まだ存在しないフィールド（これが失敗の原因）
		Articles: []models.Article{},
	}

	// Assert: FeedURLフィールドが期待値と一致する
	assert.Equal(t, "https://example.com/rss", feed.FeedURL)
}

// 🔴 Red: User Story 1 - FeedURLとLinkが異なる値を持てることを確認
func TestRSSFeedModel_FeedURLとLinkは異なる値(t *testing.T) {
	// Arrange: Rebuild.fmの実際のデータ構造をシミュレート
	feed := models.RSSFeed{
		Title:    "Rebuild",
		Link:     "https://rebuild.fm",                    // ホームページURL
		FeedURL:  "https://feeds.rebuild.fm/rebuildfm",  // 実際のRSSフィードURL
		Articles: []models.Article{},
	}

	// Assert: LinkとFeedURLが異なることを確認
	assert.NotEqual(t, feed.Link, feed.FeedURL, "LinkとFeedURLは異なる値を持つべき")
	assert.Equal(t, "https://rebuild.fm", feed.Link)
	assert.Equal(t, "https://feeds.rebuild.fm/rebuildfm", feed.FeedURL)
}
