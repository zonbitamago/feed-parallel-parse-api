/**
 * Frontend data models
 */

export interface Subscription {
  id: string;
  url: string;
  title: string | null;
  subscribedAt: string;
  lastFetchedAt: string | null;
  status: 'active' | 'error';
}

export interface Article {
  id: string;
  title: string;
  link: string;
  pubDate: string | null;
  summary: string;
  feedId: string;
  feedTitle: string;
  feedOrder: number;
}

export interface FeedError {
  url: string;
  message: string;
  timestamp: string;
}
