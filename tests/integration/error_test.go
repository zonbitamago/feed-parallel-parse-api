package integration

import (
	"context"
	"testing"

	"feed-parallel-parse-api/src/services"

	"github.com/stretchr/testify/assert"
)

func Testエラー時はErrorInfoに格納される(t *testing.T) {
	urls := []string{"bad-url"}
	svc := services.NewRSSService()
	feeds, errors := svc.ParseFeeds(context.Background(), urls)
	assert.Equal(t, 0, len(feeds), "不正URLはfeedに含まれない")
	assert.Equal(t, 1, len(errors), "ErrorInfoが1件返る")
}
