package models

// RSSFeed represents a single RSS feed and its articles
type RSSFeed struct {
	Title    string    `json:"title"`
	Link     string    `json:"link"`
	FeedURL  string    `json:"feedUrl"` // 実際のRSSフィードURL（v1.1.0で追加）
	Articles []Article `json:"articles"`
}

// Article represents a single article in an RSS feed
type Article struct {
	Title   string `json:"title"`
	Link    string `json:"link"`
	PubDate string `json:"pubDate"`
	Summary string `json:"summary"`
}

// ParseRequest is the request payload for parsing RSS feeds
type ParseRequest struct {
	URLs []string `json:"urls"`
}

// ParseResponse is the response payload after parsing RSS feeds
type ParseResponse struct {
	Feeds  []RSSFeed  `json:"feeds"`
	Errors []ErrorInfo `json:"errors"`
}

// ErrorInfo contains error details for a failed RSS fetch/parse
type ErrorInfo struct {
	URL     string `json:"url"`
	Message string `json:"message"`
}
