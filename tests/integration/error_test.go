package integration

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"feed-parallel-parse-api/pkg/services"

	"github.com/stretchr/testify/assert"
)

// T025: エラー時のErrorInfo格納テスト
func Testエラー時はErrorInfoに格納される(t *testing.T) {
	urls := []string{"bad-url"}
	svc := services.NewRSSService()
	feeds, errors := svc.ParseFeeds(context.Background(), urls)
	assert.Equal(t, 0, len(feeds), "不正URLはfeedに含まれない")
	assert.Equal(t, 1, len(errors), "ErrorInfoが1件返る")
	assert.Contains(t, errors[0].Message, "HTTP取得失敗", "HTTPエラーメッセージが含まれる")
}

// T026: 混合URL（成功+エラー）テスト
func Test成功とエラーが混在する場合(t *testing.T) {
	// 成功用モックサーバー
	successServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/xml")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Success Feed</title>
    <link>https://example.com</link>
    <item>
      <title>Success Article</title>
      <link>https://example.com/article</link>
    </item>
  </channel>
</rss>`))
	}))
	defer successServer.Close()

	// エラー用モックサーバー（404）
	errorServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer errorServer.Close()

	// 成功URL、エラーURL、不正URLを混在させる
	urls := []string{
		successServer.URL,
		errorServer.URL,
		"invalid-url",
	}

	svc := services.NewRSSService()
	feeds, errors := svc.ParseFeeds(context.Background(), urls)

	// 検証
	assert.Equal(t, 1, len(feeds), "成功したフィードが1件返る")
	assert.Equal(t, "Success Feed", feeds[0].Title)
	assert.Equal(t, 2, len(errors), "エラーが2件返る")

	// エラーメッセージの検証
	errorMessages := []string{errors[0].Message, errors[1].Message}
	assert.Contains(t, errorMessages[0]+errorMessages[1], "404", "404エラーが含まれる")
	assert.Contains(t, errorMessages[0]+errorMessages[1], "HTTP取得失敗", "HTTP取得失敗が含まれる")
}
