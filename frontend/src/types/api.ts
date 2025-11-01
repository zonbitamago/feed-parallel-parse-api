/**
 * feed-parallel-parse-api バックエンドのAPI型定義
 */

export interface ParseRequest {
  urls: string[];
}

export interface ParseResponse {
  feeds: RSSFeed[];
  errors: ErrorInfo[];
}

export interface RSSFeed {
  title: string;
  link: string; // ホームページURL（既存）
  feedUrl: string; // 実際のRSSフィードURL（v1.1.0で追加）
  articles: APIArticle[];
}

export interface APIArticle {
  title: string;
  link: string;
  pubDate: string;
  summary: string;
}

export interface ErrorInfo {
  url: string;
  message: string;
}
