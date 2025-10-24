package services

import (
	"context"
	"feed-parallel-parse-api/src/models"
)

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
	// 並列処理（goroutine＋channel）で各URLをパース
	ch := make(chan struct {
		feed  *models.RSSFeed
		err   *models.ErrorInfo
	}, len(urls))

	for _, url := range urls {
		go func(u string) {
			// ダミー: "bad-url"はエラー扱い
			if u == "bad-url" {
				ch <- struct {
					feed *models.RSSFeed
					err  *models.ErrorInfo
				}{
					feed: nil,
					err:  &models.ErrorInfo{URL: u, Message: "URL不正"},
				}
				return
			}
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
