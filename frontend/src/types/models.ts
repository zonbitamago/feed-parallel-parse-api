/**
 * フロントエンドデータモデル
 */

import { TITLE_ERROR_MESSAGES } from '../constants/errorMessages';

export interface Subscription {
  id: string;
  url: string;
  title: string | null;
  customTitle: string | null;
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

/**
 * フィード追加操作の結果
 */
export interface AddFeedResult {
  success: boolean;
  shouldClearInput: boolean;
}

/**
 * 表示用のタイトルを取得する
 * 優先順位: customTitle > title > url
 */
export function getDisplayTitle(subscription: Subscription): string {
  if (subscription.customTitle) {
    return subscription.customTitle;
  }
  if (subscription.title) {
    return subscription.title;
  }
  return subscription.url;
}

/**
 * カスタムタイトルが設定されているかチェック
 */
export function hasCustomTitle(subscription: Subscription): boolean {
  return subscription.customTitle !== null && subscription.customTitle.trim().length > 0;
}

/**
 * カスタムタイトルのバリデーション
 */
export function validateCustomTitle(title: string): { valid: boolean; error?: string; trimmed: string } {
  const trimmed = title.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: TITLE_ERROR_MESSAGES.EMPTY_TITLE, trimmed };
  }

  if (trimmed.length > 200) {
    return { valid: false, error: TITLE_ERROR_MESSAGES.TITLE_TOO_LONG, trimmed };
  }

  return { valid: true, trimmed };
}
