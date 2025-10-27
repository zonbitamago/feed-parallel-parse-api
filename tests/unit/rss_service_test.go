package unit

import (
	"context"
	"feed-parallel-parse-api/pkg/services"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestParseFeeds_エラーケース(t *testing.T) {
	svc := services.NewRSSService()
	// 空URL
	feeds, errors := svc.ParseFeeds(context.Background(), []string{""})
	assert.Empty(t, feeds)
	assert.Equal(t, 1, len(errors))
	assert.Contains(t, errors[0].Message, "空")

	// 不正なURL（スキームなし）
	feeds, errors = svc.ParseFeeds(context.Background(), []string{"bad-url"})
	assert.Empty(t, feeds)
	assert.Equal(t, 1, len(errors))
	assert.Contains(t, errors[0].Message, "HTTP取得失敗")

	// 不正なURL（スキームなし）
	feeds, errors = svc.ParseFeeds(context.Background(), []string{"unsupported-format"})
	assert.Empty(t, feeds)
	assert.Equal(t, 1, len(errors))
	assert.Contains(t, errors[0].Message, "HTTP取得失敗")
}

func TestParseFeeds_仕様テスト(t *testing.T) {
	t.Run("URLリストが空ならnilを返す", func(t *testing.T) {
		svc := services.NewRSSService()
		feeds, errors := svc.ParseFeeds(context.Background(), []string{})
		assert.Nil(t, feeds)
		assert.Nil(t, errors)
	})
}

// T010: httptest.Server を使用した正常系テスト
func TestParseFeeds_RealHTTP_Success(t *testing.T) {
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
      <pubDate>Mon, 27 Oct 2025 10:00:00 GMT</pubDate>
      <description>Test description</description>
    </item>
  </channel>
</rss>`))
	}))
	defer server.Close()

	// テスト実行
	service := services.NewRSSService()
	feeds, errors := service.ParseFeeds(context.Background(), []string{server.URL})

	// 検証
	assert.Len(t, feeds, 1)
	assert.Equal(t, "Test Feed", feeds[0].Title)
	assert.Len(t, feeds[0].Articles, 1)
	assert.Equal(t, "Test Article", feeds[0].Articles[0].Title)
	assert.Len(t, errors, 0)
}

// T011: RSS2.0 フィード取得テスト
func TestParseFeeds_RSS20(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/xml")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>RSS2.0 Feed</title>
    <link>https://example.com</link>
    <description>RSS2.0 Test</description>
    <item>
      <title>RSS2.0 Item</title>
      <link>https://example.com/item</link>
      <description>RSS2.0 Description</description>
    </item>
  </channel>
</rss>`))
	}))
	defer server.Close()

	service := services.NewRSSService()
	feeds, errors := service.ParseFeeds(context.Background(), []string{server.URL})

	assert.Len(t, feeds, 1)
	assert.Equal(t, "RSS2.0 Feed", feeds[0].Title)
	assert.Len(t, feeds[0].Articles, 1)
	assert.Len(t, errors, 0)
}

// T012: Atom フィード取得テスト
func TestParseFeeds_Atom(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/xml")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Feed</title>
  <link href="https://example.com/"/>
  <entry>
    <title>Atom Entry</title>
    <link href="https://example.com/entry"/>
    <summary>Atom Summary</summary>
  </entry>
</feed>`))
	}))
	defer server.Close()

	service := services.NewRSSService()
	feeds, errors := service.ParseFeeds(context.Background(), []string{server.URL})

	assert.Len(t, feeds, 1)
	assert.Equal(t, "Atom Feed", feeds[0].Title)
	assert.Len(t, feeds[0].Articles, 1)
	assert.Len(t, errors, 0)
}

// T021: 404エラーテスト
func TestParseFeeds_HTTP404(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	service := services.NewRSSService()
	feeds, errors := service.ParseFeeds(context.Background(), []string{server.URL})

	assert.Len(t, feeds, 0)
	assert.Len(t, errors, 1)
	assert.Contains(t, errors[0].Message, "404")
	assert.Contains(t, errors[0].Message, "HTTPエラー")
}

// T022: 500エラーテスト
func TestParseFeeds_HTTP500(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()

	service := services.NewRSSService()
	feeds, errors := service.ParseFeeds(context.Background(), []string{server.URL})

	assert.Len(t, feeds, 0)
	assert.Len(t, errors, 1)
	assert.Contains(t, errors[0].Message, "500")
	assert.Contains(t, errors[0].Message, "HTTPエラー")
}

// T023: 無効なURLテスト
func TestParseFeeds_InvalidURL(t *testing.T) {
	service := services.NewRSSService()
	feeds, errors := service.ParseFeeds(context.Background(), []string{"http://invalid-domain-that-does-not-exist.example.com/feed"})

	assert.Len(t, feeds, 0)
	assert.Len(t, errors, 1)
	assert.Contains(t, errors[0].Message, "HTTP取得失敗")
}

// T024: パースエラーテスト
func TestParseFeeds_ParseError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`<html><body>This is not a valid RSS feed</body></html>`))
	}))
	defer server.Close()

	service := services.NewRSSService()
	feeds, errors := service.ParseFeeds(context.Background(), []string{server.URL})

	assert.Len(t, feeds, 0)
	assert.Len(t, errors, 1)
	assert.Contains(t, errors[0].Message, "パース失敗")
}

func TestFeedParser_Parse(t *testing.T) {
	cases := []struct {
		name      string
		parser    services.FeedParser
		data      string
		wantTitle string
		wantLen   int
	}{
		{
			name:      "RSS1.0",
			parser:    &services.RDFParser{},
			data:      `<?xml version="1.0"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/"><channel><title>RSS1 Title</title><link>http://example.com/</link><description>desc</description></channel><item><title>item1</title><link>http://example.com/1</link><description>desc1</description></item></rdf:RDF>`,
			wantTitle: "RSS1 Title",
			wantLen:   1,
		},
		{
			name:      "RSS2.0",
			parser:    &services.RSS2Parser{},
			data:      `<?xml version="1.0"?><rss version="2.0"><channel><title>RSS2 Title</title><link>http://example.com/</link><description>desc</description><item><title>item2</title><link>http://example.com/2</link><description>desc2</description></item></channel></rss>`,
			wantTitle: "RSS2 Title",
			wantLen:   1,
		},
		{
			name:      "Atom",
			parser:    &services.AtomParser{},
			data:      `<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>Atom Title</title><link href="http://example.com/"/><entry><title>item3</title><link href="http://example.com/3"/><summary>desc3</summary></entry></feed>`,
			wantTitle: "Atom Title",
			wantLen:   1,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			feed, err := tc.parser.Parse(context.Background(), []byte(tc.data))
			assert.NoError(t, err)
			assert.NotNil(t, feed)
			assert.Equal(t, tc.wantTitle, feed.Title)
			assert.Equal(t, tc.wantLen, len(feed.Articles))
		})
	}
}

// T027: タイムアウト設定のユニットテスト
func TestRSSService_HTTPClientTimeout(t *testing.T) {
	svc := services.NewRSSService()
	// HTTPクライアントがタイムアウト設定を持つことを確認
	// (リフレクションを使わずに動作確認するため、実際にタイムアウトするサーバーでテスト)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 15秒待機（タイムアウトは10秒なのでエラーになるはず）
		time.Sleep(15 * time.Second)
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	ctx := context.Background()
	feeds, errors := svc.ParseFeeds(ctx, []string{server.URL})

	assert.Len(t, feeds, 0, "タイムアウトによりフィードは取得できない")
	assert.Len(t, errors, 1, "タイムアウトエラーが返される")
	assert.Contains(t, errors[0].Message, "HTTP取得失敗", "HTTPエラーメッセージが含まれる")
}

// T028: タイムアウト発生時のエラーハンドリングテスト
func TestRSSService_TimeoutError(t *testing.T) {
	svc := services.NewRSSService()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(15 * time.Second)
	}))
	defer server.Close()

	ctx := context.Background()
	feeds, errors := svc.ParseFeeds(ctx, []string{server.URL})

	assert.Empty(t, feeds, "タイムアウト時はフィードが空")
	assert.NotEmpty(t, errors, "エラー情報が返される")
	assert.Equal(t, server.URL, errors[0].URL, "エラーURLが正しく記録される")
}

// T029: リダイレクト上限テスト
func TestRSSService_RedirectLimit(t *testing.T) {
	redirectCount := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		redirectCount++
		if redirectCount <= 11 { // 10回を超えるリダイレクト
			http.Redirect(w, r, "/redirect", http.StatusFound)
		} else {
			w.Header().Set("Content-Type", "application/xml")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`<?xml version="1.0"?><rss version="2.0"><channel><title>Test</title><link>http://example.com</link></channel></rss>`))
		}
	}))
	defer server.Close()

	svc := services.NewRSSService()
	feeds, errors := svc.ParseFeeds(context.Background(), []string{server.URL})

	assert.Empty(t, feeds, "リダイレクト上限超過によりフィードは取得できない")
	assert.NotEmpty(t, errors, "エラー情報が返される")
	assert.Contains(t, errors[0].Message, "HTTP取得失敗", "HTTPエラーメッセージが含まれる")
}
