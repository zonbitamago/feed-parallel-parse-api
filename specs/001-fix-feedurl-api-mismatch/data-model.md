# Data Model: API応答にfeedUrlフィールド追加

**Feature**: 001-fix-feedurl-api-mismatch
**Phase**: 1 (Design)
**Date**: 2025-11-01

## エンティティ定義

### 1. RSSFeed（Backend: Go）

**責務**: パースされたRSSフィードのメタデータと記事リストを表現

**フィールド**:

| フィールド名 | 型 | 必須 | 説明 | データソース |
|------------|------|------|------|-------------|
| `Title` | `string` | ✅ | フィードのタイトル | `feed.Title` |
| `Link` | `string` | ✅ | ホームページURL（既存） | `feed.Link` |
| `FeedURL` | `string` | ✅ | **新規**: 実際のRSSフィードURL | `feed.FeedLink` または リクエストURL |
| `Articles` | `[]Article` | ✅ | 記事のリスト | `feed.Items` |

**バリデーションルール**:
- `Title`: 空文字列でも可（一部のフィードはタイトルがない）
- `Link`: 有効なURL形式（RFC 3986準拠）
- `FeedURL`: 有効なURL形式、空文字列でも可（フォールバック時）
- `Articles`: 空配列でも可（記事がないフィード）

**状態遷移**: なし（ステートレスエンティティ）

**ビジネスロジック**:
```go
// FeedURL の設定優先順位:
// 1. feed.FeedLink が空でない場合 → feed.FeedLink を使用
// 2. feed.FeedLink が空の場合 → 元々リクエストされた URL を使用
```

**Goコード例**:
```go
package models

// RSSFeed represents a single RSS feed and its articles
type RSSFeed struct {
	Title    string    `json:"title"`
	Link     string    `json:"link"`     // ホームページURL
	FeedURL  string    `json:"feedUrl"`  // 実際のRSSフィードURL（新規）
	Articles []Article `json:"articles"`
}
```

---

### 2. Article（Backend: Go）

**責務**: RSSフィード内の個別記事を表現

**フィールド**: 変更なし（既存仕様を維持）

| フィールド名 | 型 | 必須 | 説明 |
|------------|------|------|------|
| `Title` | `string` | ✅ | 記事タイトル |
| `Link` | `string` | ✅ | 記事URL |
| `PubDate` | `string` | ⚠️ | 公開日時（ISO 8601形式） |
| `Summary` | `string` | ⚠️ | 記事要約 |

**変更**: なし

---

### 3. ParseRequest（Backend: Go）

**責務**: RSSフィードパースのリクエストペイロード

**フィールド**: 変更なし

| フィールド名 | 型 | 必須 | 説明 |
|------------|------|------|------|
| `URLs` | `[]string` | ✅ | パース対象のRSSフィードURLリスト |

**変更**: なし

---

### 4. ParseResponse（Backend: Go）

**責務**: RSSフィードパース結果のレスポンスペイロード

**フィールド**: 変更なし（内部の`RSSFeed`が変更）

| フィールド名 | 型 | 必須 | 説明 |
|------------|------|------|------|
| `Feeds` | `[]RSSFeed` | ✅ | パース成功したフィードリスト |
| `Errors` | `[]ErrorInfo` | ✅ | パース失敗したフィードのエラー情報 |

**影響**: `Feeds`配列内の各`RSSFeed`に`feedUrl`フィールドが追加される

---

### 5. RSSFeed（Frontend: TypeScript）

**責務**: バックエンドAPI応答の型定義

**フィールド**:

| フィールド名 | 型 | 必須 | 説明 |
|------------|------|------|------|
| `title` | `string` | ✅ | フィードのタイトル |
| `link` | `string` | ✅ | ホームページURL（既存） |
| `feedUrl` | `string` | ✅ | **新規**: 実際のRSSフィードURL |
| `articles` | `APIArticle[]` | ✅ | 記事のリスト |

**TypeScriptコード例**:
```typescript
export interface RSSFeed {
  title: string;
  link: string;       // ホームページURL
  feedUrl: string;    // 実際のRSSフィードURL（新規）
  articles: APIArticle[];
}
```

**既存コードとの互換性**:
- `link`フィールドは維持（後方互換性）
- `feedUrl`フィールドを追加（新規）
- 既存の型チェックは継続して動作

---

### 6. Subscription（Frontend: TypeScript）

**責務**: ユーザーが登録したフィード購読情報

**フィールド**: 変更なし（既存仕様を維持）

| フィールド名 | 型 | 必須 | 説明 |
|------------|------|------|------|
| `id` | `string` | ✅ | 一意識別子 |
| `url` | `string` | ✅ | ユーザーが入力したRSSフィードURL |
| `title` | `string` | ✅ | フィードタイトル（API応答から更新） |
| `subscribedAt` | `string` | ✅ | 購読日時（ISO 8601） |
| `lastFetchedAt` | `string \| null` | ⚠️ | 最終取得日時 |
| `status` | `'active' \| 'error'` | ✅ | 購読ステータス |

**変更**: なし

**マッチングロジックの変更**:
```typescript
// 変更前（問題あり）
const matchedFeed = feeds.find(f => normalizeUrl(f.link) === normalizedSubscriptionUrl)

// 変更後（修正）
const matchedFeed = feeds.find(f => normalizeUrl(f.feedUrl) === normalizedSubscriptionUrl)
```

---

## エンティティ関係図

```text
ParseRequest
    │
    └── URLs: string[]
         │
         ▼
    [RSSService.ParseFeeds]
         │
         ▼
ParseResponse
    ├── Feeds: RSSFeed[]
    │     ├── Title: string
    │     ├── Link: string（ホームページURL）
    │     ├── FeedURL: string（実際のRSSフィードURL）← 新規
    │     └── Articles: Article[]
    │           ├── Title: string
    │           ├── Link: string
    │           ├── PubDate: string
    │           └── Summary: string
    │
    └── Errors: ErrorInfo[]
          ├── URL: string
          └── Message: string

【フロントエンド】
Subscription（localStorage）
    ↓
    url: "https://feeds.rebuild.fm/rebuildfm"
    ↓
[useFeedAPI.findMatchingFeed]
    ↓
normalizeUrl(subscription.url) === normalizeUrl(feed.feedUrl)  ← 変更箇所
    ↓
マッチング成功 → 記事表示
```

---

## データフロー

### 1. バックエンド（Go）

```text
1. HTTP POST /api/parse
   ↓
2. ParseRequest { urls: [...] }
   ↓
3. For each URL:
   ├─ gofeed.ParseURL(url)
   │   ↓
   │   feed.Title, feed.Link, feed.FeedLink, feed.Items
   │
   ├─ FeedURL の設定:
   │   if feed.FeedLink != "" {
   │       FeedURL = feed.FeedLink  ← 優先
   │   } else {
   │       FeedURL = url  ← フォールバック
   │   }
   │
   └─ RSSFeed { Title, Link, FeedURL, Articles }
   ↓
4. ParseResponse { Feeds: [...], Errors: [...] }
   ↓
5. JSON応答
```

### 2. フロントエンド（TypeScript）

```text
1. parseFeeds(urls) → API Call
   ↓
2. ParseResponse { feeds: RSSFeed[], errors: ErrorInfo[] }
   ↓
3. For each Subscription:
   ├─ normalizedSubscriptionUrl = normalizeUrl(subscription.url)
   │
   ├─ findMatchingFeed:
   │   feeds.find(f => normalizeUrl(f.feedUrl) === normalizedSubscriptionUrl)
   │   ↓
   │   マッチング成功 → feed
   │
   ├─ updateSubscriptionWithTitle(subscription, feed.title)
   │
   └─ transformArticles(feed, subscription)
   ↓
4. setArticles(allArticles)
5. 記事リスト表示
```

---

## バリデーション戦略

### Backend（Go）

**RSSFeedモデルのバリデーション**:
```go
func (f *RSSFeed) Validate() error {
    if f.Title == "" {
        // 警告のみ（一部フィードはタイトルがない）
        log.Warn("RSSFeed.Title is empty")
    }

    if f.Link == "" {
        return errors.New("RSSFeed.Link is required")
    }

    if f.FeedURL == "" {
        // 警告のみ（フォールバック失敗時）
        log.Warn("RSSFeed.FeedURL is empty")
    }

    return nil
}
```

**注意**: 現在の実装ではバリデーションロジックは存在しないため、追加は不要（YAGNI原則）。ログ出力のみで十分。

### Frontend（TypeScript）

**型安全性**:
- TypeScriptの型システムによるコンパイル時チェック
- `strict: true`により、`feedUrl`フィールドが存在しない場合はビルドエラー

**ランタイムバリデーション**:
- 不要（APIレスポンスが正しい形式であることを前提）
- エラーハンドリングは既存の`try-catch`で対応

---

## マイグレーション戦略

### Backend

**ステップ1**: モデル定義更新
```go
// pkg/models/rss.go
type RSSFeed struct {
    Title    string    `json:"title"`
    Link     string    `json:"link"`
    FeedURL  string    `json:"feedUrl"`  // 追加
    Articles []Article `json:"articles"`
}
```

**ステップ2**: サービス層更新
```go
// pkg/services/rss_service.go
func feedToRSSFeed(feed *gofeed.Feed, requestedURL string) *models.RSSFeed {
    feedURL := feed.FeedLink
    if feedURL == "" {
        feedURL = requestedURL  // フォールバック
    }

    return &models.RSSFeed{
        Title:    feed.Title,
        Link:     feed.Link,
        FeedURL:  feedURL,  // 追加
        Articles: articles,
    }
}
```

### Frontend

**ステップ1**: 型定義更新
```typescript
// frontend/src/types/api.ts
export interface RSSFeed {
  title: string;
  link: string;
  feedUrl: string;  // 追加
  articles: APIArticle[];
}
```

**ステップ2**: マッチングロジック更新
```typescript
// frontend/src/hooks/useFeedAPI.ts
const matchedFeed = feeds.find(f => normalizeUrl(f.feedUrl) === normalizedSubscriptionUrl)
// 変更: f.link → f.feedUrl
```

**ステップ3**: テストモックデータ更新
```typescript
// 全てのMSWモックに feedUrl フィールド追加
{
  title: 'Tech Blog',
  link: 'https://example.com',
  feedUrl: 'https://example.com/rss',  // 追加
  articles: [...]
}
```

---

## テスト戦略

### Backend

**Unit Tests** (`tests/unit/rss_model_test.go`):
```go
func TestRSSFeedModel_FeedURL追加(t *testing.T) {
    feed := models.RSSFeed{
        Title:   "Test",
        Link:    "https://example.com",
        FeedURL: "https://example.com/rss",  // 新規フィールド
        Articles: []models.Article{},
    }

    assert.Equal(t, "https://example.com/rss", feed.FeedURL)
}
```

**Service Tests** (`tests/unit/rss_service_test.go`):
```go
func TestRSSService_FeedLinkマッピング(t *testing.T) {
    // feed.FeedLink が設定されている場合
    // feed.FeedLink が空の場合のフォールバック
}
```

### Frontend

**Type Tests** (`frontend/src/types/api.test.ts`):
```typescript
it('RSSFeedにfeedUrlフィールドが存在する', () => {
  const feed: RSSFeed = {
    title: 'Test',
    link: 'https://example.com',
    feedUrl: 'https://example.com/rss',  // 新規フィールド
    articles: [],
  };
  expect(feed.feedUrl).toBeDefined();
});
```

**Hook Tests** (`frontend/src/hooks/useFeedAPI.test.ts`):
```typescript
it('feedUrlを使用してマッチングする', async () => {
  const feeds = [
    { title: 'A', link: 'https://example.com', feedUrl: 'https://example.com/rss', articles: [] }
  ];
  // normalizeUrl(f.feedUrl) でマッチング成功を確認
});
```

---

## 次のステップ（contracts/とquickstart.md）

1. **contracts/api-schema.json**: OpenAPI 3.0形式のAPI契約書作成
2. **quickstart.md**: 開発者向けクイックスタートガイド作成
