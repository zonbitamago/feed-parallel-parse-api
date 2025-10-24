package unit

import (
	"context"
	"testing"

	"feed-parallel-parse-api/src/services"

	"github.com/stretchr/testify/assert"
)

func TestParseFeeds_仕様テスト(t *testing.T) {
	cases := []struct {
		name    string
		urls    []string
		wantNil bool
	}{
		{"URLリストが空ならnilを返す", []string{}, true},
		{"URLが1件ならfeeds1件・errors0件", []string{"https://example.com/rss"}, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			svc := services.NewRSSService()
			feeds, errors := svc.ParseFeeds(context.Background(), tc.urls)
			if tc.wantNil {
				assert.Nil(t, feeds)
				assert.Nil(t, errors)
			} else {
				assert.Equal(t, 1, len(feeds))
				assert.Equal(t, 0, len(errors))
			}
		})
	}
}
