package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestCORSHeaders はCORSヘッダーが正しく設定されることを検証する
func TestCORSHeaders(t *testing.T) {
	// 準備
	req := httptest.NewRequest(http.MethodPost, "/api/parse", strings.NewReader(`{"urls":[]}`))
	rec := httptest.NewRecorder()

	// 実行
	handler := SetupRoutes()
	handler.ServeHTTP(rec, req)

	// 検証
	assert.Equal(t, "*", rec.Header().Get("Access-Control-Allow-Origin"), "CORS Origin header should be *")
	assert.Contains(t, rec.Header().Get("Access-Control-Allow-Methods"), "POST", "CORS Methods should include POST")
	assert.Contains(t, rec.Header().Get("Access-Control-Allow-Headers"), "Content-Type", "CORS Headers should include Content-Type")
}

// TestOPTIONSRequest はOPTIONSプリフライトリクエストが正しく処理されることを検証する
func TestOPTIONSRequest(t *testing.T) {
	// 準備
	req := httptest.NewRequest(http.MethodOptions, "/api/parse", nil)
	rec := httptest.NewRecorder()

	// 実行
	handler := SetupRoutes()
	handler.ServeHTTP(rec, req)

	// 検証
	assert.Equal(t, http.StatusOK, rec.Code, "OPTIONS request should return 200 OK")
	assert.Equal(t, "*", rec.Header().Get("Access-Control-Allow-Origin"), "OPTIONS should set CORS Origin")
}
