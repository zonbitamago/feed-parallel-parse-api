package services

import (
	"context"
	"errors"
	"feed-parallel-parse-api/pkg/models"
	"fmt"
	"io"
	"net/http"
	"time"

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
type RSSService struct {
	httpClient *http.Client
}

func NewRSSService() *RSSService {
	return &RSSService{
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				if len(via) >= 10 {
					return errors.New("リダイレクトが10回を超えました")
				}
				return nil
			},
		},
	}
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

			// HTTP GETリクエスト作成
			req, err := http.NewRequestWithContext(ctx, "GET", u, nil)
			if err != nil {
				ch <- struct {
					feed *models.RSSFeed
					err  *models.ErrorInfo
				}{
					feed: nil,
					err:  &models.ErrorInfo{URL: u, Message: fmt.Sprintf("リクエスト作成失敗: %v", err)},
				}
				return
			}

			// User-Agentヘッダー設定
			req.Header.Set("User-Agent", "feed-parallel-parse-api/1.0 (RSS Reader)")

			// HTTP GETリクエスト実行
			resp, err := s.httpClient.Do(req)
			if err != nil {
				ch <- struct {
					feed *models.RSSFeed
					err  *models.ErrorInfo
				}{
					feed: nil,
					err:  &models.ErrorInfo{URL: u, Message: fmt.Sprintf("HTTP取得失敗: %v", err)},
				}
				return
			}
			defer resp.Body.Close()

			// HTTPステータスコードチェック
			if resp.StatusCode != http.StatusOK {
				ch <- struct {
					feed *models.RSSFeed
					err  *models.ErrorInfo
				}{
					feed: nil,
					err:  &models.ErrorInfo{URL: u, Message: fmt.Sprintf("HTTPエラー: %d %s", resp.StatusCode, resp.Status)},
				}
				return
			}

			// レスポンスボディ読み取り
			body, err := io.ReadAll(resp.Body)
			if err != nil {
				ch <- struct {
					feed *models.RSSFeed
					err  *models.ErrorInfo
				}{
					feed: nil,
					err:  &models.ErrorInfo{URL: u, Message: fmt.Sprintf("ボディ読み取り失敗: %v", err)},
				}
				return
			}

			// RSSパース（既存のパーサーを使用）
			parser := gofeed.NewParser()
			feed, err := parser.ParseString(string(body))
			if err != nil {
				ch <- struct {
					feed *models.RSSFeed
					err  *models.ErrorInfo
				}{
					feed: nil,
					err:  &models.ErrorInfo{URL: u, Message: fmt.Sprintf("パース失敗: %v", err)},
				}
				return
			}

			// RSSFeed変換（既存のロジック）
			rssFeed := feedToRSSFeed(feed)
			ch <- struct {
				feed *models.RSSFeed
				err  *models.ErrorInfo
			}{
				feed: rssFeed,
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
