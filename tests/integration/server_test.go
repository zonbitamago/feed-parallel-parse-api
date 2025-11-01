package integration

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	handler "feed-parallel-parse-api/api"
	"feed-parallel-parse-api/pkg/models"

	"github.com/stretchr/testify/assert"
)

var testLogger *log.Logger

// setupTestRoutes はテスト用のCORS対応HTTPマルチプレクサを作成（cmd/server/main.goのSetupRoutes()と同じロジック）
func setupTestRoutes() *http.ServeMux {
	// テスト環境でloggerが初期化されていない場合の対応
	if testLogger == nil {
		testLogger = log.New(os.Stdout, "[HTTP-SERVER-TEST] ", log.LstdFlags|log.Lmsgprefix)
	}

	mux := http.NewServeMux()

	// /api/parse エンドポイントをCORSミドルウェア付きで登録
	mux.HandleFunc("/api/parse", corsMiddleware(handler.Handler))

	return mux
}

// corsMiddleware はHTTPハンドラーにCORSヘッダーとリクエストログを追加するミドルウェア（cmd/server/main.goと同じロジック）
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// リクエストログ出力
		testLogger.Printf("Request: %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)

		// CORSヘッダー設定
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// プリフライトOPTIONSリクエストの処理
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			testLogger.Printf("Response: OPTIONS 200 OK")
			return
		}

		// 次のハンドラーを呼び出し
		next(w, r)
		testLogger.Printf("Response: %s completed", r.Method)
	}
}

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

	// 実際のサーバー設定を使用（CORS対応含む）
	mux := setupTestRoutes()

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

			// 実際のサーバー設定を使用（CORS対応含む）
			mux := setupTestRoutes()

			// 実行
			mux.ServeHTTP(rec, req)

			// 検証
			assert.Equal(t, http.StatusMethodNotAllowed, rec.Code, method+" should return 405 Method Not Allowed")
		})
	}
}
