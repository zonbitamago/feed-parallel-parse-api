/**
 * API types for feed-parallel-parse-api backend
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
  link: string;
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
