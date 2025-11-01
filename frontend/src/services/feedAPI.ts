/**
 * feed-parallel-parse-api用のAPIサービス
 */

import type { ParseResponse } from '../types/api';
import { createFeedAPIRequest } from './feedAPIUtils';

/**
 * FeedAPIエラーの種別
 */
export const FeedAPIErrorType = {
  TIMEOUT: 'timeout',
  NETWORK: 'network',
  PARSE: 'parse',
  ABORT: 'abort'
} as const;

export type FeedAPIErrorType = typeof FeedAPIErrorType[keyof typeof FeedAPIErrorType];

export class FeedAPIError extends Error {
  public readonly cause?: unknown;
  public readonly type?: FeedAPIErrorType;

  constructor(message: string, cause?: unknown, type?: FeedAPIErrorType) {
    super(message);
    this.name = 'FeedAPIError';
    this.cause = cause;
    this.type = type;
  }
}

export async function parseFeeds(urls: string[], options?: { signal?: AbortSignal }): Promise<ParseResponse> {
  return createFeedAPIRequest(urls, options);
}

/**
 * 単一フィードのタイトルを取得する
 *
 * フィード登録時に使用し、タイトルをlocalStorageに保存するために使用します。
 * 10秒のタイムアウトが設定されています。
 *
 * @param url - フィードURL
 * @returns フィードタイトル
 * @throws {FeedAPIError} タイトル取得に失敗した場合
 */
export async function fetchFeedTitle(url: string): Promise<string> {
  const data = await createFeedAPIRequest([url]);

  // 結果が空の場合はエラー
  if (data.feeds.length === 0) {
    throw new FeedAPIError('フィードのタイトルを取得できませんでした', undefined, FeedAPIErrorType.PARSE);
  }

  return data.feeds[0].title;
}
