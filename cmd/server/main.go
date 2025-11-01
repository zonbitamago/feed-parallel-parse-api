package main

import (
	"log"
	"net/http"
	"os"

	handler "feed-parallel-parse-api/api"
)

var logger *log.Logger

// init はプログラム起動時に自動的に実行され、loggerを初期化する
func init() {
	logger = log.New(os.Stdout, "[HTTP-SERVER] ", log.LstdFlags|log.Lmsgprefix)
}

func main() {
	// ルートの設定
	mux := SetupRoutes()

	// サーバー起動
	port := ":8080"
	logger.Printf("Starting server on port %s", port)
	logger.Printf("Environment: development (Docker local)")
	logger.Printf("Endpoints: POST /api/parse, OPTIONS /api/parse")

	if err := http.ListenAndServe(port, mux); err != nil {
		logger.Fatalf("Server failed to start: %v", err)
	}
}

// SetupRoutes はCORS対応のHTTPマルチプレクサを作成・設定する
func SetupRoutes() *http.ServeMux {
	mux := http.NewServeMux()

	// /api/parse エンドポイントをCORSミドルウェア付きで登録
	mux.HandleFunc("/api/parse", corsMiddleware(handler.Handler))

	return mux
}

// corsMiddleware はHTTPハンドラーにCORSヘッダーとリクエストログを追加するミドルウェア
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// リクエストログ出力
		logger.Printf("Request: %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)

		// CORS Originを環境変数から取得
		allowedOrigin := os.Getenv("CORS_ALLOWED_ORIGINS")
		env := os.Getenv("GO_ENV")

		// 環境変数が未設定の場合の処理
		if allowedOrigin == "" {
			// 開発環境（Docker local）のみデフォルトで全許可
			if env == "" || env == "development" {
				allowedOrigin = "*"
				logger.Printf("CORS: Using default '*' for development environment")
			} else {
				// 本番環境では環境変数の設定を必須化
				logger.Fatalf("CORS_ALLOWED_ORIGINS is not set. Refusing to start in non-development environment (GO_ENV=%s)", env)
			}
		}

		// CORSヘッダー設定
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// プリフライトOPTIONSリクエストの処理
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			logger.Printf("Response: OPTIONS 200 OK")
			return
		}

		// 次のハンドラーを呼び出し
		next(w, r)
		logger.Printf("Response: %s completed", r.Method)
	}
}
