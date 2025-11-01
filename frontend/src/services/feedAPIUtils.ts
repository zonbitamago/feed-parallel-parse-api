/**
 * feed-parallel-parse-api用の共通APIユーティリティ
 *
 * このファイルは、feedAPI.tsの重複コードを排除するために作成されました。
 * createFeedAPIRequest()関数は、タイムアウト処理、AbortController、エラーハンドリングを一箇所に集約します。
 */

import { FeedAPIError, FeedAPIErrorType } from './feedAPI';
import type { ParseRequest, ParseResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://feed-parallel-parse-api.vercel.app';
const API_TIMEOUT = 10000; // 10秒

/**
 * 共通のFeed APIリクエスト処理
 *
 * タイムアウト処理、AbortController、エラーハンドリングを統一的に処理します。
 *
 * @param urls - 取得するフィードのURL配列
 * @param options - オプション（外部からのAbortSignal）
 * @returns ParseResponse
 * @throws {FeedAPIError} APIリクエストに失敗した場合
 */
export async function createFeedAPIRequest(
  urls: string[],
  options?: { signal?: AbortSignal }
): Promise<ParseResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  // 外部からのAbortSignalでキャンセルされたかどうかを追跡
  let externalAbort = false;

  // 外部からのAbortSignalがあれば、それを監視する
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
      throw new FeedAPIError(
        `API request failed with status ${response.status}`,
        undefined,
        FeedAPIErrorType.NETWORK
      );
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
      throw new FeedAPIError(
        'APIリクエストがタイムアウトしました',
        error,
        FeedAPIErrorType.TIMEOUT
      );
    }
    if (error instanceof FeedAPIError) {
      throw error;
    }
    throw new FeedAPIError(
      'フィードの取得に失敗しました',
      error,
      FeedAPIErrorType.NETWORK
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
