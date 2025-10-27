package integration

import (
	"context"
	"feed-parallel-parse-api/pkg/services"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// T014: 大量URL並列処理パフォーマンステスト
func Test大量URLでもタイムアウトしない(t *testing.T) {
	// モックサーバー作成
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/xml")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <link>https://example.com</link>
    <item>
      <title>Test Article</title>
      <link>https://example.com/article</link>
    </item>
  </channel>
</rss>`))
	}))
	defer server.Close()

	// 50個のURLを生成
	urls := make([]string, 50)
	for i := range urls {
		urls[i] = server.URL
	}

	svc := services.NewRSSService()
	start := time.Now()
	feeds, errors := svc.ParseFeeds(context.Background(), urls)
	duration := time.Since(start)

	// 並列処理により10秒以内で完了すること
	assert.LessOrEqual(t, duration.Seconds(), 10.0, "10秒以内で返却されること")
	assert.Equal(t, 50, len(feeds), "全件返却されること")
	assert.Equal(t, 0, len(errors), "エラーなし")
}
