# API Contract: フィードパースAPI

**Feature**: 009-fix-excessive-requests
**Date**: 2025-10-29

## Overview

この機能では既存のフィードパースAPIを使用します。新しいエンドポイントの追加はなく、既存の`/api/parse`エンドポイントをフィード登録時に呼び出します。

## Endpoint

### POST /api/parse

フィードURLのリストを受け取り、各フィードをパースしてタイトルと記事を返します。

**Request**:

```typescript
interface ParseRequest {
  urls: string[]  // パースするフィードURLのリスト
}
```

**Request Example**:
```json
{
  "urls": ["https://example.com/feed.xml"]
}
```

**Response (Success - 200 OK)**:

```typescript
interface ParseResponse {
  results: FeedParseResult[]
}

interface FeedParseResult {
  url: string        // リクエストしたフィードURL
  title: string      // パースされたフィードタイトル
  items: FeedItem[]  // フィード記事のリスト
}

interface FeedItem {
  title: string        // 記事タイトル
  link: string         // 記事URL
  pubDate: string      // 公開日時（ISO 8601形式）
  description?: string // 記事概要（オプション）
}
```

**Response Example (Success)**:
```json
{
  "results": [
    {
      "url": "https://example.com/feed.xml",
      "title": "Example Blog",
      "items": [
        {
          "title": "First Post",
          "link": "https://example.com/first-post",
          "pubDate": "2025-10-29T10:00:00Z",
          "description": "This is the first post"
        },
        {
          "title": "Second Post",
          "link": "https://example.com/second-post",
          "pubDate": "2025-10-28T15:30:00Z"
        }
      ]
    }
  ]
}
```

**Response (Error - 4xx/5xx)**:

```typescript
interface ErrorResponse {
  error: string      // エラーメッセージ
  code?: string      // エラーコード（オプション）
}
```

**Response Example (Error)**:
```json
{
  "error": "Failed to parse feed",
  "code": "PARSE_ERROR"
}
```

**Error Cases**:
- `400 Bad Request`: 無効なリクエスト（urlsが空、URLフォーマットが不正など）
- `404 Not Found`: フィードURLが存在しない
- `500 Internal Server Error`: サーバー側のパースエラー
- `504 Gateway Timeout`: タイムアウト（10秒以上）

**Timeout**: 10秒（クライアント側で設定）

## Client-Side Usage

### フィード登録時のタイトル取得

```typescript
async function fetchFeedTitle(feedUrl: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒タイムアウト

  try {
    const response = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: [feedUrl] }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: ParseResponse = await response.json()

    if (data.results.length === 0) {
      throw new Error('No results returned')
    }

    return data.results[0].title

  } catch (error) {
    clearTimeout(timeoutId)

    if (error.name === 'AbortError') {
      throw new Error('Request timeout after 10 seconds')
    }

    throw error
  }
}
```

### エラーハンドリング

```typescript
try {
  const title = await fetchFeedTitle(feedUrl)
  // 成功: titleを使用してSubscriptionを作成
} catch (error) {
  // 失敗: feedUrlをtitleのフォールバック値として使用
  console.error('Failed to fetch feed title:', error)
  const title = feedUrl
  // エラーメッセージをユーザーに表示
  showErrorMessage('フィードのタイトルを取得できませんでした。URLをタイトルとして使用します。')
}
```

## Contract Testing

### テスト戦略

1. **Mock Service Worker (MSW)** を使用してAPIをモック
2. **成功シナリオ** と **失敗シナリオ** の両方をテスト
3. **タイムアウト** のテスト

### テスト例

```typescript
import { rest } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  // 成功レスポンス
  rest.post('/api/parse', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        results: [
          {
            url: 'https://example.com/feed.xml',
            title: 'Example Blog',
            items: [],
          },
        ],
      })
    )
  })
)

describe('fetchFeedTitle', () => {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  test('成功時にタイトルを返す', async () => {
    const title = await fetchFeedTitle('https://example.com/feed.xml')
    expect(title).toBe('Example Blog')
  })

  test('タイムアウト時にエラーをスローする', async () => {
    server.use(
      rest.post('/api/parse', (req, res, ctx) => {
        return res(ctx.delay(11000)) // 11秒遅延
      })
    )

    await expect(fetchFeedTitle('https://example.com/feed.xml'))
      .rejects.toThrow('Request timeout')
  })

  test('APIエラー時にエラーをスローする', async () => {
    server.use(
      rest.post('/api/parse', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal error' }))
      })
    )

    await expect(fetchFeedTitle('https://example.com/feed.xml'))
      .rejects.toThrow()
  })
})
```

## API Assumptions

このAPIは既存のバックエンド実装であり、以下を前提としています：

1. **エンドポイント**: `/api/parse` が既に実装されている
2. **レスポンス形式**: 上記のインターフェースに従う
3. **パフォーマンス**: 通常1-3秒でレスポンス
4. **安定性**: 高可用性（99%以上）

これらの前提が変更される場合は、このcontractを更新する必要があります。