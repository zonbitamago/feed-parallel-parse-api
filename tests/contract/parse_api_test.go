package contract

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	handler "feed-parallel-parse-api/api"
	"feed-parallel-parse-api/pkg/models"

	"github.com/stretchr/testify/assert"
)

func TestParseHandler_仕様テスト(t *testing.T) {
	cases := []struct {
		name     string
		body     []byte
		wantCode int
	}{
		{"不正リクエストは400を返す", []byte("invalid"), http.StatusBadRequest},
		{"空リストは200を返す", []byte(`{"urls":[]}`), http.StatusOK},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest("POST", "/parse", bytes.NewBuffer(tc.body))
			w := httptest.NewRecorder()
			handler.Handler(w, req)
			assert.Equal(t, tc.wantCode, w.Code)
		})
	}
}

// 🔴 Red: User Story 1 - API契約テスト: feedUrlフィールドの存在を検証
func TestParseHandler_FeedURLフィールド存在確認(t *testing.T) {
	// Arrange: 実在するRSSフィードURLを使用（テストの安定性のため、実際のHTTPリクエストが発生）
	// Note: このテストは実際のネットワークアクセスを行うため、unit testではなくcontract testとして配置
	reqBody := []byte(`{"urls":["https://www.reddit.com/.rss"]}`)
	req := httptest.NewRequest("POST", "/parse", bytes.NewBuffer(reqBody))
	w := httptest.NewRecorder()

	// Act: APIハンドラを実行
	handler.Handler(w, req)

	// Assert: HTTPステータスコードが200 OK
	assert.Equal(t, http.StatusOK, w.Code, "API応答が200 OKであること")

	// Assert: レスポンスボディをパースし、feedUrlフィールドが存在することを確認
	var response models.ParseResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err, "レスポンスボディが正しいJSON形式であること")

	// Assert: フィード取得成功時、feedUrlフィールドが存在し空でないこと
	if len(response.Feeds) > 0 {
		feed := response.Feeds[0]
		assert.NotEmpty(t, feed.FeedURL, "feedUrlフィールドが空でないこと")
		assert.NotEqual(t, feed.FeedURL, "", "feedUrlフィールドが空文字列でないこと")

		// 既存フィールドも維持されていることを確認（後方互換性）
		assert.NotEmpty(t, feed.Title, "titleフィールドが維持されていること")
		assert.NotEmpty(t, feed.Link, "linkフィールドが維持されていること")
		assert.NotNil(t, feed.Articles, "articlesフィールドが維持されていること")

		t.Logf("✅ API契約確認: feedUrl=\"%s\", link=\"%s\"", feed.FeedURL, feed.Link)
	}

	// Assert: エラーが発生した場合でも、レスポンス形式は正しいこと
	if len(response.Errors) > 0 {
		t.Logf("⚠️ フィード取得エラー: %+v (テストは継続)", response.Errors)
	}
}
