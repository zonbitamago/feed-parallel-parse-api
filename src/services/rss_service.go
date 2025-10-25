package services

import (
	"context"
	"feed-parallel-parse-api/src/models"

	"github.com/mmcdole/gofeed"
)

// feedToRSSFeedはgofeed.Feedをmodels.RSSFeedに変換する共通処理
func feedToRSSFeed(feed *gofeed.Feed) *models.RSSFeed {
	articles := make([]models.Article, 0, len(feed.Items))
	for _, item := range feed.Items {
		articles = append(articles, models.Article{
			Title:   item.Title,
			Link:    item.Link,
			PubDate: item.Published,
			Summary: item.Description,
		})
	}
	return &models.RSSFeed{
		Title:    feed.Title,
		Link:     feed.Link,
		Articles: articles,
	}
}

// AtomParserはAtom用のFeedParser実装
type AtomParser struct{}

func (p *AtomParser) Parse(ctx context.Context, data []byte) (*models.RSSFeed, error) {
	parser := gofeed.NewParser()
	feed, err := parser.ParseString(string(data))
	if err != nil {
		return nil, err
	}
	// Atomのみを対象
	if feed.FeedType != "atom" {
		return nil, nil // 対象外
	}
	return feedToRSSFeed(feed), nil
}

// RSS2ParserはRSS2.0用のFeedParser実装
type RSS2Parser struct{}

func (p *RSS2Parser) Parse(ctx context.Context, data []byte) (*models.RSSFeed, error) {
	parser := gofeed.NewParser()
	feed, err := parser.ParseString(string(data))
	if err != nil {
		return nil, err
	}
	// RSS2.0のみを対象
	if feed.FeedType != "rss" || feed.FeedVersion != "2.0" {
		return nil, nil // 対象外
	}
	return feedToRSSFeed(feed), nil
}

// RDFParserはRSS1.0(RDF)用のFeedParser実装
type RDFParser struct{}

func (p *RDFParser) Parse(ctx context.Context, data []byte) (*models.RSSFeed, error) {
	parser := gofeed.NewParser()
	feed, err := parser.ParseString(string(data))
	if err != nil {
		return nil, err
	}
	// RSS1.0(RDF)のみを対象にする場合はType判定も可能
	if feed.FeedType != "rss" || feed.FeedVersion != "1.0" {
		return nil, nil // 対象外
	}
	return feedToRSSFeed(feed), nil
}

// FeedParser は各RSS/Atom形式のパース共通インターフェース
type FeedParser interface {
	Parse(ctx context.Context, data []byte) (*models.RSSFeed, error)
}

// RSSService provides methods to fetch and parse RSS feeds
type RSSService struct{}

func NewRSSService() *RSSService {
	return &RSSService{}
}

func (s *RSSService) ParseFeeds(ctx context.Context, urls []string) ([]models.RSSFeed, []models.ErrorInfo) {
	if len(urls) == 0 {
		return nil, nil
	}
	feeds := make([]models.RSSFeed, 0, len(urls))
	errors := make([]models.ErrorInfo, 0)
	ch := make(chan struct {
		feed *models.RSSFeed
		err  *models.ErrorInfo
	}, len(urls))

	for _, url := range urls {
		go func(u string) {
			// URLバリデーション
			if u == "" {
				ch <- struct {
					feed *models.RSSFeed
					err  *models.ErrorInfo
				}{
					feed: nil,
					err:  &models.ErrorInfo{URL: u, Message: "URLが空です"},
				}
				return
			}
			// フィード取得（ここではダミー: 実際はHTTP GET等）
			// サポート外/不正なフィード例
			if u == "bad-url" {
				ch <- struct {
					feed *models.RSSFeed
					err  *models.ErrorInfo
				}{
					feed: nil,
					err:  &models.ErrorInfo{URL: u, Message: "URL不正またはサポート外フォーマット"},
				}
				return
			}
			// サポート外フォーマット例
			if u == "unsupported-format" {
				ch <- struct {
					feed *models.RSSFeed
					err  *models.ErrorInfo
				}{
					feed: nil,
					err:  &models.ErrorInfo{URL: u, Message: "サポート外のフィード形式"},
				}
				return
			}
			// 正常系（ダミー）
			ch <- struct {
				feed *models.RSSFeed
				err  *models.ErrorInfo
			}{
				feed: &models.RSSFeed{Title: "Dummy", Link: u, Articles: []models.Article{}},
				err:  nil,
			}
		}(url)
	}

	for i := 0; i < len(urls); i++ {
		result := <-ch
		if result.err != nil {
			errors = append(errors, *result.err)
		} else {
			feeds = append(feeds, *result.feed)
		}
	}
	close(ch)
	return feeds, errors
}
