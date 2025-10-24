package integration

import (
	"context"
	"testing"
	"time"

	"feed-parallel-parse-api/src/services"

	"github.com/stretchr/testify/assert"
)

func Test大量URLでもタイムアウトしない(t *testing.T) {
	urls := make([]string, 50)
	for i := range urls {
		urls[i] = "https://example.com/rss" // ダミー
	}
	svc := services.NewRSSService()
	start := time.Now()
	feeds, errors := svc.ParseFeeds(context.Background(), urls)
	duration := time.Since(start)
	assert.LessOrEqual(t, duration.Seconds(), 10.0, "10秒以内で返却されること")
	assert.Equal(t, 50, len(feeds), "全件返却されること")
	assert.Equal(t, 0, len(errors), "エラーなし")
}
