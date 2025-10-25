package unit

import (
	"context"
	"feed-parallel-parse-api/src/services"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParseFeeds_エラーケース(t *testing.T) {
	svc := services.NewRSSService()
	// 空URL
	feeds, errors := svc.ParseFeeds(context.Background(), []string{""})
	assert.Empty(t, feeds)
	assert.Equal(t, 1, len(errors))
	assert.Contains(t, errors[0].Message, "空")

	// 不正なURL
	feeds, errors = svc.ParseFeeds(context.Background(), []string{"bad-url"})
	assert.Empty(t, feeds)
	assert.Equal(t, 1, len(errors))
	assert.Contains(t, errors[0].Message, "不正")

	// サポート外フォーマット
	feeds, errors = svc.ParseFeeds(context.Background(), []string{"unsupported-format"})
	assert.Empty(t, feeds)
	assert.Equal(t, 1, len(errors))
	assert.Contains(t, errors[0].Message, "サポート外")
}

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

func TestFeedParser_Parse_RSS1(t *testing.T) {
	data := `<?xml version="1.0"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/"><channel><title>RSS1 Title</title><link>http://example.com/</link><description>desc</description></channel><item><title>item1</title><link>http://example.com/1</link><description>desc1</description></item></rdf:RDF>`
	parser := &services.RDFParser{}
	feed, err := parser.Parse(context.Background(), []byte(data))
	assert.NoError(t, err)
	assert.NotNil(t, feed)
	assert.Equal(t, "RSS1 Title", feed.Title)
	assert.Equal(t, 1, len(feed.Articles))
}

func TestFeedParser_Parse_RSS2(t *testing.T) {
	data := `<?xml version="1.0"?><rss version="2.0"><channel><title>RSS2 Title</title><link>http://example.com/</link><description>desc</description><item><title>item2</title><link>http://example.com/2</link><description>desc2</description></item></channel></rss>`
	parser := &services.RSS2Parser{}
	feed, err := parser.Parse(context.Background(), []byte(data))
	assert.NoError(t, err)
	assert.NotNil(t, feed)
	assert.Equal(t, "RSS2 Title", feed.Title)
	assert.Equal(t, 1, len(feed.Articles))
}

func TestFeedParser_Parse_Atom(t *testing.T) {
	data := `<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>Atom Title</title><link href="http://example.com/"/><entry><title>item3</title><link href="http://example.com/3"/><summary>desc3</summary></entry></feed>`
	parser := &services.AtomParser{}
	feed, err := parser.Parse(context.Background(), []byte(data))
	assert.NoError(t, err)
	assert.NotNil(t, feed)
	assert.Equal(t, "Atom Title", feed.Title)
	assert.Equal(t, 1, len(feed.Articles))
}
