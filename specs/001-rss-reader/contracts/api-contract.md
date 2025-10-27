# API契約: RSSリーダーアプリケーション

**ブランチ**: `001-rss-reader` | **作成日**: 2025-10-27

## 概要

このドキュメントは、RSSリーダーフロントエンドと既存のfeed-parallel-parse-api（バックエンド）間のAPI契約を定義します。

## バックエンドAPI仕様

### エンドポイント

**URL**: `https://feed-parallel-parse-api.vercel.app/api/parse`
**メソッド**: `POST`
**Content-Type**: `application/json`

---

## リクエスト仕様

### リクエストボディ

**TypeScript型定義**:
```typescript
interface ParseRequest {
  urls: string[];
}
```

**JSONスキーマ**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["urls"],
  "properties": {
    "urls": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "uri"
      },
      "minItems": 1,
      "maxItems": 100
    }
  }
}
```

**制約**:
- `urls`: 必須フィールド
- 最小1件、最大100件のURL
- 各URLは有効なHTTP/HTTPS URI形式

**リクエスト例**:
```bash
curl -X POST https://feed-parallel-parse-api.vercel.app/api/parse \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example.com/rss",
      "https://another.com/feed.xml"
    ]
  }'
```

---

## レスポンス仕様

### 成功レスポンス（200 OK）

**TypeScript型定義**:
```typescript
interface ParseResponse {
  feeds: RSSFeed[];
  errors: ErrorInfo[];
}

interface RSSFeed {
  title: string;
  link: string;
  articles: Article[];
}

interface Article {
  title: string;
  link: string;
  pubDate: string;
  summary: string;
}

interface ErrorInfo {
  url: string;
  message: string;
}
```

**JSONスキーマ**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["feeds", "errors"],
  "properties": {
    "feeds": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["title", "link", "articles"],
        "properties": {
          "title": { "type": "string" },
          "link": { "type": "string", "format": "uri" },
          "articles": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["title", "link", "pubDate", "summary"],
              "properties": {
                "title": { "type": "string" },
                "link": { "type": "string", "format": "uri" },
                "pubDate": { "type": "string" },
                "summary": { "type": "string" }
              }
            }
          }
        }
      }
    },
    "errors": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["url", "message"],
        "properties": {
          "url": { "type": "string", "format": "uri" },
          "message": { "type": "string" }
        }
      }
    }
  }
}
```

**成功レスポンス例**:
```json
{
  "feeds": [
    {
      "title": "Example Blog",
      "link": "https://example.com",
      "articles": [
        {
          "title": "First Article",
          "link": "https://example.com/article1",
          "pubDate": "2025-10-27T10:00:00Z",
          "summary": "This is a summary of the first article..."
        },
        {
          "title": "Second Article",
          "link": "https://example.com/article2",
          "pubDate": "2025-10-26T15:30:00Z",
          "summary": "This is a summary of the second article..."
        }
      ]
    },
    {
      "title": "Another Blog",
      "link": "https://another.com",
      "articles": [
        {
          "title": "Latest News",
          "link": "https://another.com/news1",
          "pubDate": "",
          "summary": "Breaking news article..."
        }
      ]
    }
  ],
  "errors": [
    {
      "url": "https://invalid.com/rss",
      "message": "Failed to fetch feed: connection timeout"
    }
  ]
}
```

**フィールド詳細**:

| フィールド | 型 | 説明 |
|-----------|------|------|
| `feeds` | `RSSFeed[]` | 正常に解析されたRSSフィードの配列 |
| `feeds[].title` | `string` | フィードのタイトル |
| `feeds[].link` | `string` | フィードのウェブサイトURL |
| `feeds[].articles` | `Article[]` | フィード内の記事の配列 |
| `articles[].title` | `string` | 記事のタイトル |
| `articles[].link` | `string` | 記事の元リンク（外部URL） |
| `articles[].pubDate` | `string` | 公開日（ISO 8601形式、取得できない場合は空文字列 `""`） |
| `articles[].summary` | `string` | 記事の要約 |
| `errors` | `ErrorInfo[]` | 失敗したフィード取得/解析のエラー情報 |
| `errors[].url` | `string` | エラーが発生したフィードのURL |
| `errors[].message` | `string` | エラーメッセージ |

**重要な注意事項**:
- `pubDate`は空文字列 `""` の場合があります（公開日が取得できない場合）
- `feeds`と`errors`は両方とも空の配列 `[]` の可能性があります
- 一部のフィードが成功し、一部が失敗した場合、両方のフィールドにデータが含まれます

---

### エラーレスポンス

#### 400 Bad Request

**発生条件**:
- リクエストボディが不正なJSON
- `urls`フィールドが存在しない
- `urls`が空の配列
- `urls`が101件以上

**レスポンス例**:
```json
{
  "error": "Invalid request: urls field is required"
}
```

#### 500 Internal Server Error

**発生条件**:
- サーバー内部エラー
- 予期しない例外

**レスポンス例**:
```json
{
  "error": "Internal server error"
}
```

---

## フロントエンド実装ガイド

### API呼び出し関数

**TypeScript実装例**:

```typescript
// src/services/feedAPI.ts

const API_BASE_URL = 'https://feed-parallel-parse-api.vercel.app';
const API_TIMEOUT = 10000; // 10秒

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
  articles: Article[];
}

export interface Article {
  title: string;
  link: string;
  pubDate: string;
  summary: string;
}

export interface ErrorInfo {
  url: string;
  message: string;
}

export class FeedAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'FeedAPIError';
  }
}

/**
 * 複数のRSSフィードを並列で取得・解析する
 * @param urls - RSSフィードのURL配列（最大100件）
 * @returns ParseResponse - 解析されたフィードとエラー情報
 * @throws FeedAPIError - ネットワークエラーまたはタイムアウト
 */
export async function parseFeeds(urls: string[]): Promise<ParseResponse> {
  if (urls.length === 0) {
    throw new FeedAPIError('URLs array cannot be empty');
  }

  if (urls.length > 100) {
    throw new FeedAPIError('Maximum 100 URLs allowed');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}/api/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls } as ParseRequest),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new FeedAPIError(
        errorData.error || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }

    const data: ParseResponse = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof FeedAPIError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new FeedAPIError('Request timed out after 10 seconds');
      }
      throw new FeedAPIError(`Network error: ${error.message}`);
    }

    throw new FeedAPIError('Unknown error occurred');
  }
}
```

---

### 使用例

```typescript
import { parseFeeds } from './services/feedAPI';

async function fetchUserFeeds() {
  const urls = [
    'https://example.com/rss',
    'https://another.com/feed.xml',
  ];

  try {
    const response = await parseFeeds(urls);

    // 成功したフィードを処理
    response.feeds.forEach((feed) => {
      console.log(`Feed: ${feed.title}`);
      feed.articles.forEach((article) => {
        console.log(`  - ${article.title} (${article.pubDate || 'No date'})`);
      });
    });

    // エラーを処理
    response.errors.forEach((error) => {
      console.error(`Failed to fetch ${error.url}: ${error.message}`);
    });
  } catch (error) {
    if (error instanceof FeedAPIError) {
      console.error(`API Error: ${error.message}`);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}
```

---

## エラーハンドリング

### エラー分類とユーザーメッセージ

**ネットワークエラー**:
```typescript
function getErrorMessage(error: FeedAPIError): string {
  if (error.message.includes('timeout')) {
    return 'フィードの取得がタイムアウトしました。しばらくしてからもう一度お試しください。';
  }

  if (error.message.includes('Network error')) {
    return 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
  }

  if (error.statusCode === 400) {
    return 'リクエストが不正です。URLを確認してください。';
  }

  if (error.statusCode === 500) {
    return 'サーバーエラーが発生しました。しばらくしてからもう一度お試しください。';
  }

  return 'フィードの取得に失敗しました。';
}
```

**個別フィードエラー**:
```typescript
function translateFeedError(errorInfo: ErrorInfo): string {
  const message = errorInfo.message.toLowerCase();

  if (message.includes('timeout')) {
    return `${errorInfo.url} の取得がタイムアウトしました`;
  }

  if (message.includes('parse') || message.includes('xml')) {
    return `${errorInfo.url} の形式が不正です`;
  }

  if (message.includes('fetch') || message.includes('connection')) {
    return `${errorInfo.url} に接続できませんでした`;
  }

  return `${errorInfo.url}: ${errorInfo.message}`;
}
```

---

## パフォーマンス仕様

### タイムアウト

- **APIタイムアウト**: 10秒（API保証）
- **クライアントタイムアウト**: 10秒（Fetch APIの`AbortController`で実装）

### 並列処理

- バックエンドAPIは内部でgoroutineを使用して複数のフィードを並列で取得
- クライアント側では単一のPOSTリクエストで複数のURLを送信

### リトライ戦略

**推奨しない**: APIは既に10秒のタイムアウト内で最大限の処理を行うため、クライアント側でのリトライは不要

**例外**: ネットワーク接続エラー（`Network error`）の場合のみ、ユーザーアクションで再試行を許可

---

## テスト戦略

### 単体テスト（Vitest）

**モックAPIレスポンス**:
```typescript
// src/services/__tests__/feedAPI.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseFeeds, FeedAPIError } from '../feedAPI';

describe('parseFeeds', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常なレスポンスを解析する', async () => {
    const mockResponse: ParseResponse = {
      feeds: [
        {
          title: 'Test Feed',
          link: 'https://example.com',
          articles: [
            {
              title: 'Article 1',
              link: 'https://example.com/article1',
              pubDate: '2025-10-27T10:00:00Z',
              summary: 'Summary...',
            },
          ],
        },
      ],
      errors: [],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await parseFeeds(['https://example.com/rss']);
    expect(result).toEqual(mockResponse);
  });

  it('タイムアウトエラーをスローする', async () => {
    (global.fetch as any).mockImplementationOnce(() =>
      new Promise((resolve) => setTimeout(resolve, 11000))
    );

    await expect(parseFeeds(['https://slow.com/rss'])).rejects.toThrow(
      'Request timed out after 10 seconds'
    );
  }, 12000); // テストタイムアウトを12秒に設定

  it('100件超過時にエラーをスローする', async () => {
    const urls = Array(101).fill('https://example.com/rss');
    await expect(parseFeeds(urls)).rejects.toThrow('Maximum 100 URLs allowed');
  });
});
```

### 統合テスト（MSW）

**Mock Service Worker設定**:
```typescript
// src/mocks/handlers.ts

import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('https://feed-parallel-parse-api.vercel.app/api/parse', async ({ request }) => {
    const body = await request.json() as ParseRequest;

    // 成功ケース
    if (body.urls.includes('https://success.com/rss')) {
      return HttpResponse.json({
        feeds: [
          {
            title: 'Success Feed',
            link: 'https://success.com',
            articles: [
              {
                title: 'Article',
                link: 'https://success.com/article',
                pubDate: '2025-10-27T10:00:00Z',
                summary: 'Summary',
              },
            ],
          },
        ],
        errors: [],
      });
    }

    // エラーケース
    return HttpResponse.json({
      feeds: [],
      errors: [
        {
          url: body.urls[0],
          message: 'Failed to fetch feed',
        },
      ],
    });
  }),
];
```

---

## まとめ

本API契約は、以下を保証します:

1. **リクエスト**: 最大100件のRSSフィードURLを単一のPOSTリクエストで送信
2. **レスポンス**: 成功したフィードと失敗したフィードを両方とも含む統一されたレスポンス
3. **タイムアウト**: 10秒以内にレスポンスを返却（API保証）
4. **エラーハンドリング**: 個別フィードのエラーは`errors`配列に含まれ、全体的なエラーはHTTPステータスコードで表現

この契約により、フロントエンドはすべての機能要件（FR-001〜FR-017）を実装し、成功基準（SC-001〜SC-008）を達成できます。