package integration

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

// TestAPIEndpointRouting は /api/parse エンドポイントが正しいハンドラーにルーティングされることを検証する
func TestAPIEndpointRouting(t *testing.T) {
	// 準備
	reqBody := models.ParseRequest{
		URLs: []string{}, // ルーティングテスト用の空URL配列
	}
	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest(http.MethodPost, "/api/parse", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	// 統合テスト用のシンプルなHTTPマルチプレクサを作成
	mux := http.NewServeMux()
	mux.HandleFunc("/api/parse", func(w http.ResponseWriter, r *http.Request) {
		// CORSヘッダーはラッパーによって設定される
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// 実際のハンドラーに委譲
		handler.Handler(w, r)
	})

	// 実行
	mux.ServeHTTP(rec, req)

	// 検証
	assert.Equal(t, http.StatusOK, rec.Code, "API endpoint should return 200 OK")
	assert.Equal(t, "application/json", rec.Header().Get("Content-Type"), "Response should be JSON")

	// レスポンス構造の検証
	var resp models.ParseResponse
	err := json.Unmarshal(rec.Body.Bytes(), &resp)
	assert.NoError(t, err, "Response should be valid JSON ParseResponse")
}

// TestAPIEndpointMethodNotAllowed はPOST以外のHTTPメソッドが拒否されることを検証する
func TestAPIEndpointMethodNotAllowed(t *testing.T) {
	// 準備
	methods := []string{http.MethodGet, http.MethodPut, http.MethodDelete}

	for _, method := range methods {
		t.Run(method, func(t *testing.T) {
			req := httptest.NewRequest(method, "/api/parse", nil)
			rec := httptest.NewRecorder()

			// ハンドラー作成
			mux := http.NewServeMux()
			mux.HandleFunc("/api/parse", func(w http.ResponseWriter, r *http.Request) {
				// CORSヘッダー
				w.Header().Set("Access-Control-Allow-Origin", "*")
				w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

				if r.Method == "OPTIONS" {
					w.WriteHeader(http.StatusOK)
					return
				}

				handler.Handler(w, r)
			})

			// 実行
			mux.ServeHTTP(rec, req)

			// 検証
			assert.Equal(t, http.StatusMethodNotAllowed, rec.Code, method+" should return 405 Method Not Allowed")
		})
	}
}
