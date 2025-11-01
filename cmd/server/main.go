package main

import (
	"log"
	"net/http"
	"os"

	handler "feed-parallel-parse-api/api"
)

var logger *log.Logger

func main() {
	// 構造化ログの設定
	logger = log.New(os.Stdout, "[HTTP-SERVER] ", log.LstdFlags|log.Lmsgprefix)

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
	// テスト環境でloggerが初期化されていない場合の対応
	if logger == nil {
		logger = log.New(os.Stdout, "[HTTP-SERVER] ", log.LstdFlags|log.Lmsgprefix)
	}

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

		// CORSヘッダー設定
		w.Header().Set("Access-Control-Allow-Origin", "*")
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
