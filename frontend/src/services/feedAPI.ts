/**
 * API service for feed-parallel-parse-api
 */

import type { ParseRequest, ParseResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://feed-parallel-parse-api.vercel.app';
const API_TIMEOUT = 10000; // 10 seconds

export class FeedAPIError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'FeedAPIError';
    this.cause = cause;
  }
}

export async function parseFeeds(urls: string[]): Promise<ParseResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

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
