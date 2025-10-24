package contract

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"feed-parallel-parse-api/src/api"

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
			api.ParseHandler(w, req)
			assert.Equal(t, tc.wantCode, w.Code)
		})
	}
}
