# Data Model: フィード登録時のタイトル保存による過剰リクエスト削減

**Date**: 2025-10-29
**Feature**: 009-fix-excessive-requests

## Overview

この文書は、フィード登録時のタイトル保存機能で使用されるデータモデルを定義します。既存のSubscription型を拡張し、後方互換性を維持します。

## Entities

### Subscription（拡張）

フィード購読情報を表すエンティティ。今回の機能で`title`フィールドを追加します。

**TypeScript Definition**:
```typescript
interface Subscription {
  id: string                    // 既存: 一意識別子（UUID）
  feedUrl: string               // 既存: RSSフィードのURL
  title: string                 // 新規: APIから取得したフィードタイトル
  customTitle?: string          // 既存: ユーザーが設定したカスタムタイトル（オプション）
  addedAt: string               // 既存: 追加日時（ISO 8601形式）
  lastFetchedAt: string | null  // 既存: 最終取得日時（ISO 8601形式、null=未取得）
  status: 'active' | 'error'    // 既存: ステータス
}
```

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | string | Yes | 一意識別子 | UUID v4形式 |
| feedUrl | string | Yes | RSSフィードのURL | 有効なURL形式 |
| title | string | Yes | APIから取得したフィードタイトル | 1文字以上、500文字以下 |
| customTitle | string | No | ユーザー設定のカスタムタイトル | 1文字以上、100文字以下 |
| addedAt | string | Yes | 追加日時 | ISO 8601形式 |
| lastFetchedAt | string \| null | Yes | 最終取得日時 | ISO 8601形式またはnull |
| status | 'active' \| 'error' | Yes | ステータス | 'active' または 'error' |

**State Transitions**:
```text
[新規登録]
  ↓
status: 'active', title: (APIから取得 or feedUrl), lastFetchedAt: (現在時刻)
  ↓
[タイトル取得成功] → status: 'active', title: (取得したタイトル)
[タイトル取得失敗] → status: 'error', title: feedUrl
  ↓
[カスタムタイトル編集] → customTitle: (ユーザー入力)
[タイトル手動更新] → title: (最新タイトル), lastFetchedAt: (現在時刻)
```

**Business Rules**:

1. **title フィールドの設定**:
   - フィード登録時にAPIからタイトルを取得し設定
   - API失敗時は`feedUrl`をフォールバック値として設定
   - 既存データ（titleなし）のマイグレーション時も`feedUrl`を設定

2. **customTitle の優先度**:
   - `customTitle`が設定されている場合、UI表示では`customTitle`を優先
   - `customTitle`が未設定の場合、`title`を表示
   - 表示ロジック: `subscription.customTitle || subscription.title`

3. **一意性**:
   - `id`: 完全に一意（UUID）
   - `feedUrl`: 重複登録を防ぐため、登録前にチェック

4. **データ永続化**:
   - localStorage に JSON形式で保存
   - キー名: `rss-subscriptions`（既存と同じ）
   - 保存形式: `Subscription[]`

### FeedParseResult（APIレスポンス）

フィードパースAPIのレスポンスデータ。既存のAPI仕様に従います。

**TypeScript Definition**:
```typescript
interface FeedParseResult {
  url: string                   // リクエストしたフィードURL
  title: string                 // パースされたフィードタイトル
  items: FeedItem[]             // フィード記事のリスト
}

interface FeedItem {
  title: string                 // 記事タイトル
  link: string                  // 記事URL
  pubDate: string               // 公開日時（ISO 8601形式）
  description?: string          // 記事概要（オプション）
}
```

**Relationship**: `FeedParseResult.title` → `Subscription.title`

## Data Flow

### 1. フィード登録フロー

```text
[ユーザー入力]
  ↓ feedUrl
[重複チェック] → isDuplicate? → [エラー表示]
  ↓ No
[API呼び出し] /api/parse
  ↓ FeedParseResult
[Subscription作成]
  - id: UUID生成
  - feedUrl: (入力値)
  - title: result.title (成功時) or feedUrl (失敗時)
  - customTitle: undefined
  - addedAt: new Date().toISOString()
  - lastFetchedAt: new Date().toISOString()
  - status: 'active' (成功時) or 'error' (失敗時)
  ↓
[localStorage保存]
  ↓
[Context更新] → ADD_SUBSCRIPTION
  ↓
[UI更新]
```

### 2. アプリケーションロードフロー

```text
[App起動]
  ↓
[localStorage読み込み] → Subscription[]
  ↓
[データマイグレーション]
  - titleフィールドなし? → title = feedUrl
  ↓
[マイグレーション済みデータを保存]
  ↓
[Context初期化] → LOAD_SUBSCRIPTIONS
  ↓
[UI表示] (APIリクエストなし)
```

### 3. カスタムタイトル編集フロー

```text
[ユーザー入力]
  ↓ newCustomTitle
[Subscription更新]
  - customTitle: newCustomTitle
  ↓
[localStorage保存]
  ↓
[Context更新] → UPDATE_SUBSCRIPTION
  ↓
[UI更新]
```

## Storage Schema

### localStorage

**Key**: `rss-subscriptions`

**Value** (JSON):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "feedUrl": "https://example.com/feed.xml",
    "title": "Example Blog",
    "customTitle": "My Favorite Blog",
    "addedAt": "2025-10-29T10:00:00.000Z",
    "lastFetchedAt": "2025-10-29T10:00:05.123Z",
    "status": "active"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "feedUrl": "https://another.com/rss",
    "title": "https://another.com/rss",
    "addedAt": "2025-10-29T11:00:00.000Z",
    "lastFetchedAt": "2025-10-29T11:00:10.456Z",
    "status": "error"
  }
]
```

**Migration Strategy**:

既存データ（`title`フィールドなし）の取り扱い：

```typescript
// Before migration
{
  "id": "...",
  "feedUrl": "https://example.com/feed.xml",
  // title フィールドなし
  "addedAt": "...",
  ...
}

// After migration
{
  "id": "...",
  "feedUrl": "https://example.com/feed.xml",
  "title": "https://example.com/feed.xml",  // feedUrlをフォールバック
  "addedAt": "...",
  ...
}
```

## Validation Rules

### Subscription Validation

```typescript
function validateSubscription(sub: Partial<Subscription>): string[] {
  const errors: string[] = []

  if (!sub.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sub.id)) {
    errors.push('Invalid id: must be UUID v4')
  }

  if (!sub.feedUrl || !isValidUrl(sub.feedUrl)) {
    errors.push('Invalid feedUrl: must be a valid URL')
  }

  if (!sub.title || sub.title.length === 0 || sub.title.length > 500) {
    errors.push('Invalid title: must be 1-500 characters')
  }

  if (sub.customTitle && (sub.customTitle.length === 0 || sub.customTitle.length > 100)) {
    errors.push('Invalid customTitle: must be 1-100 characters')
  }

  if (!sub.addedAt || !isValidISO8601(sub.addedAt)) {
    errors.push('Invalid addedAt: must be ISO 8601 format')
  }

  if (sub.lastFetchedAt !== null && !isValidISO8601(sub.lastFetchedAt)) {
    errors.push('Invalid lastFetchedAt: must be ISO 8601 format or null')
  }

  if (!sub.status || !['active', 'error'].includes(sub.status)) {
    errors.push('Invalid status: must be "active" or "error"')
  }

  return errors
}
```

## Error Handling

### localStorage Quota Exceeded

```typescript
try {
  localStorage.setItem('rss-subscriptions', JSON.stringify(subscriptions))
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // ユーザーに通知: 「ストレージ容量が不足しています。古いデータを削除してください。」
    throw new Error('localStorage quota exceeded')
  }
  throw error
}
```

### Invalid JSON in localStorage

```typescript
try {
  const data = localStorage.getItem('rss-subscriptions')
  const subscriptions = data ? JSON.parse(data) : []
} catch (error) {
  if (error instanceof SyntaxError) {
    // 破損したデータをクリア
    localStorage.removeItem('rss-subscriptions')
    return []
  }
  throw error
}
```

## Summary

このデータモデルは以下の原則に従っています：

1. **後方互換性**: 既存のSubscription型を拡張、破壊的変更なし
2. **シンプルさ**: 最小限のフィールド追加（`title`のみ）
3. **バリデーション**: すべてのフィールドに明確なルール
4. **エラーハンドリング**: localStorage の例外を適切に処理
5. **マイグレーション**: 既存データを自動的に移行

このデータモデルは、Phase 1のcontracts生成とPhase 2のtasks.md生成の基礎となります。