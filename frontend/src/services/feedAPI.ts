/**
 * feed-parallel-parse-api用のAPIサービス
 */

import type { ParseRequest, ParseResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://feed-parallel-parse-api.vercel.app';
const API_TIMEOUT = 10000; // 10秒

export class FeedAPIError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'FeedAPIError';
    this.cause = cause;
  }
}

export async function parseFeeds(urls: string[], options?: { signal?: AbortSignal }): Promise<ParseResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  // 外部からのAbortSignalでキャンセルされたかどうかを追跡
  let externalAbort = false;

  // 外部からのAbortSignalがあれば、それをリスンする
  if (options?.signal) {
    options.signal.addEventListener('abort', () => {
      externalAbort = true;
      controller.abort();
    });
  }

  try {
    const request: ParseRequest = { urls };

    const response = await fetch(`${API_BASE_URL}/api/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new FeedAPIError(`API request failed with status ${response.status}`);
    }

    const data: ParseResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // 外部からのキャンセルの場合はAbortErrorをそのまま再スロー
      // （useFeedPreviewでの意図的なキャンセル処理のため）
      if (externalAbort) {
        throw error;
      }
      // タイムアウトの場合はFeedAPIErrorでラップ
      throw new FeedAPIError('APIリクエストがタイムアウトしました', error);
    }
    if (error instanceof FeedAPIError) {
      throw error;
    }
    throw new FeedAPIError('フィードの取得に失敗しました', error);
  } finally {
    clearTimeout(timeoutId);
  }
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const request: ParseRequest = { urls: [url] };

    const response = await fetch(`${API_BASE_URL}/api/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new FeedAPIError(`API request failed with status ${response.status}`);
    }

    const data: ParseResponse = await response.json();

    // 結果が空の場合はエラー
    if (data.feeds.length === 0) {
      throw new FeedAPIError('フィードのタイトルを取得できませんでした');
    }

    return data.feeds[0].title;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new FeedAPIError('APIリクエストがタイムアウトしました', error);
    }
    if (error instanceof FeedAPIError) {
      throw error;
    }
    throw new FeedAPIError('フィードのタイトルを取得に失敗しました', error);
  } finally {
    clearTimeout(timeoutId);
  }
}
