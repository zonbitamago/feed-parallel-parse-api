# データモデル: RSSリーダーアプリケーション

**ブランチ**: `001-rss-reader` | **作成日**: 2025-10-27

## 概要

このドキュメントは、RSSリーダーアプリケーションのデータモデルを定義します。仕様書の「主要エンティティ」セクションから抽出され、TypeScriptの型定義として実装されます。

## エンティティ概要

RSSリーダーアプリケーションは、以下の3つの主要なエンティティで構成されます:

1. **Subscription（フィード購読）**: ユーザーが購読しているRSSフィード
2. **Article（記事）**: RSSフィードから解析された記事
3. **FeedError（フィードエラー）**: 失敗したフィード取得/解析操作

## エンティティ詳細

### 1. Subscription（フィード購読）

**目的**: ユーザーが保存したRSSフィードを表現し、localStorageに永続化される

**属性**:

| 属性名 | 型 | 必須 | 説明 |
|--------|------|------|------|
| `id` | `string` | ✓ | 一意の識別子（UUID v4） |
| `url` | `string` | ✓ | RSSフィードのURL（HTTP/HTTPS） |
| `title` | `string \| null` | - | フィードのタイトル（APIレスポンスから取得、初回はnull） |
| `subscribedAt` | `string` | ✓ | 購読タイムスタンプ（ISO 8601形式） |
| `lastFetchedAt` | `string \| null` | - | 最後に取得した日時（ISO 8601形式） |
| `status` | `'active' \| 'error'` | ✓ | フィードのステータス |

**TypeScript型定義**:

```typescript
interface Subscription {
  id: string;
  url: string;
  title: string | null;
  subscribedAt: string;
  lastFetchedAt: string | null;
  status: 'active' | 'error';
}
```

**制約**:
- `url`: RFC 3986準拠のURL形式、`http://` または `https://` プロトコルのみ
- `id`: UUID v4形式（例: "550e8400-e29b-41d4-a716-446655440000"）
- `subscribedAt`, `lastFetchedAt`: ISO 8601形式（例: "2025-10-27T10:30:00.000Z"）
- 最大購読数: 100件（FR-009）

**関連**:
- FR-007: localStorageに永続化
- FR-010: 購読からフィードを削除

**ストレージキー**: `rss_reader_subscriptions`

**ストレージフォーマット**:
```json
{
  "subscriptions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "url": "https://example.com/rss",
      "title": "Example Blog",
      "subscribedAt": "2025-10-27T10:30:00.000Z",
      "lastFetchedAt": "2025-10-27T11:00:00.000Z",
      "status": "active"
    }
  ]
}
```

---

### 2. Article（記事）

**目的**: RSSフィードから解析された記事を表現（APIレスポンスから取得）

**属性**:

| 属性名 | 型 | 必須 | 説明 |
|--------|------|------|------|
| `id` | `string` | ✓ | 一意の識別子（URL + タイトルのハッシュ） |
| `title` | `string` | ✓ | 記事のタイトル |
| `link` | `string` | ✓ | 記事の元リンク（外部URL） |
| `pubDate` | `string \| null` | - | 公開日（ISO 8601形式、取得できない場合はnull） |
| `summary` | `string` | ✓ | 記事の要約（300文字で切り詰め） |
| `feedId` | `string` | ✓ | 記事が属するフィード購読のID（Subscription.id） |
| `feedTitle` | `string` | ✓ | ソースフィードのタイトル |

**TypeScript型定義**:

```typescript
interface Article {
  id: string;
  title: string;
  link: string;
  pubDate: string | null;
  summary: string;
  feedId: string;
  feedTitle: string;
}
```

**制約**:
- `summary`: 最大300文字、超過時は切り詰めて「...」を追加（エッジケースの仕様による）
- `pubDate`: ISO 8601形式（例: "2025-10-27T10:30:00.000Z"）、取得できない場合はnull
- `id`: `link` + `title` から生成されるSHA-256ハッシュ（重複検出用）

**関連**:
- FR-003: 統一されたリストで記事を表示
- FR-004: タイトル、公開日、要約、ソースフィード名、リンクを表示
- FR-005: 公開日順（最新順）にソート、公開日なしは最後尾
- FR-013: 記事タイトルをクリック可能なリンクに

**ソート順**:
1. `pubDate` が存在する記事を `pubDate` の降順でソート（最新順）
2. `pubDate` が `null` の記事は元のフィード内順序を維持し、最後尾に配置

**APIマッピング**:

バックエンドAPIの `RSSFeed.articles[]` から変換:

```typescript
// APIレスポンス（src/models/rss.go）
interface APIArticle {
  title: string;
  link: string;
  pubDate: string; // 空文字列の場合もあり
  summary: string;
}

// フロントエンドのArticleに変換
function mapAPIArticle(apiArticle: APIArticle, feedId: string, feedTitle: string): Article {
  return {
    id: generateHash(apiArticle.link + apiArticle.title),
    title: apiArticle.title,
    link: apiArticle.link,
    pubDate: apiArticle.pubDate ? apiArticle.pubDate : null,
    summary: truncate(apiArticle.summary, 300),
    feedId,
    feedTitle,
  };
}
```

---

### 3. FeedError（フィードエラー）

**目的**: 失敗したフィード取得/解析操作を表現（APIエラーレスポンスから取得）

**属性**:

| 属性名 | 型 | 必須 | 説明 |
|--------|------|------|------|
| `url` | `string` | ✓ | エラーが発生したRSSフィードのURL |
| `message` | `string` | ✓ | エラーメッセージ |
| `timestamp` | `string` | ✓ | エラー発生日時（ISO 8601形式） |
| `type` | `'network' \| 'parse' \| 'timeout' \| 'validation'` | ✓ | エラーの分類 |

**TypeScript型定義**:

```typescript
interface FeedError {
  url: string;
  message: string;
  timestamp: string;
  type: 'network' | 'parse' | 'timeout' | 'validation';
}
```

**エラータイプ**:

| タイプ | 説明 | 例 |
|--------|------|------|
| `network` | ネットワーク接続エラー | "フィードに接続できませんでした" |
| `parse` | RSS/Atom解析エラー | "フィードの形式が不正です" |
| `timeout` | APIタイムアウト（10秒超過） | "フィードの取得がタイムアウトしました" |
| `validation` | URL検証エラー | "無効なURL形式です" |

**関連**:
- FR-006: APIエラーレスポンスをユーザーフレンドリーに表示
- FR-014: 各フィードのステータスを確認可能

**APIマッピング**:

バックエンドAPIの `ErrorInfo` から変換:

```typescript
// APIレスポンス（src/models/rss.go）
interface APIErrorInfo {
  url: string;
  message: string;
}

// フロントエンドのFeedErrorに変換
function mapAPIError(apiError: APIErrorInfo): FeedError {
  return {
    url: apiError.url,
    message: translateErrorMessage(apiError.message),
    timestamp: new Date().toISOString(),
    type: detectErrorType(apiError.message),
  };
}
```

---

## API契約との対応

### リクエスト

フロントエンドからバックエンドへのリクエスト:

```typescript
interface ParseRequest {
  urls: string[];
}
```

**例**:
```json
{
  "urls": [
    "https://example.com/rss",
    "https://another.com/feed.xml"
  ]
}
```

**制約**:
- `urls`: 最大100件（FR-009）
- 各URLは有効なHTTP/HTTPS URL

---

### レスポンス

バックエンドからフロントエンドへのレスポンス:

```typescript
interface ParseResponse {
  feeds: RSSFeed[];
  errors: ErrorInfo[];
}

interface RSSFeed {
  title: string;
  link: string;
  articles: APIArticle[];
}

interface APIArticle {
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

**例**:
```json
{
  "feeds": [
    {
      "title": "Example Blog",
      "link": "https://example.com",
      "articles": [
        {
          "title": "Article 1",
          "link": "https://example.com/article1",
          "pubDate": "2025-10-27T10:00:00Z",
          "summary": "This is a summary..."
        }
      ]
    }
  ],
  "errors": [
    {
      "url": "https://invalid.com/rss",
      "message": "Failed to fetch feed"
    }
  ]
}
```

---

## コンテキストAPI設計

### SubscriptionContext

**責務**: フィード購読の管理とlocalStorageとの同期

**状態**:
```typescript
interface SubscriptionState {
  subscriptions: Subscription[];
  isLoading: boolean;
  error: string | null;
}
```

**アクション**:
```typescript
type SubscriptionAction =
  | { type: 'ADD_SUBSCRIPTION'; payload: { url: string } }
  | { type: 'REMOVE_SUBSCRIPTION'; payload: { id: string } }
  | { type: 'UPDATE_SUBSCRIPTION'; payload: Subscription }
  | { type: 'LOAD_SUBSCRIPTIONS'; payload: Subscription[] }
  | { type: 'SET_ERROR'; payload: string };
```

---

### ArticleContext

**責務**: 記事データの管理、ソート、フィルタリング

**状態**:
```typescript
interface ArticleState {
  articles: Article[];
  displayedArticles: Article[]; // フィルタリング後
  searchQuery: string;
  selectedFeedId: string | null; // フィルタリング用
  isLoading: boolean;
  errors: FeedError[];
}
```

**アクション**:
```typescript
type ArticleAction =
  | { type: 'SET_ARTICLES'; payload: Article[] }
  | { type: 'ADD_ARTICLES'; payload: Article[] }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_FEED'; payload: string | null }
  | { type: 'ADD_ERROR'; payload: FeedError }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_LOADING'; payload: boolean };
```

---

### UIContext

**責務**: UIの状態管理（ローディング、モーダル、通知）

**状態**:
```typescript
interface UIState {
  isRefreshing: boolean;
  showWelcomeScreen: boolean;
  toast: {
    message: string;
    type: 'success' | 'error' | 'info';
  } | null;
}
```

**アクション**:
```typescript
type UIAction =
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_WELCOME_SCREEN'; payload: boolean }
  | { type: 'SHOW_TOAST'; payload: { message: string; type: 'success' | 'error' | 'info' } }
  | { type: 'HIDE_TOAST' };
```

---

## データフロー図

```
┌─────────────────────────────────────────────────────────┐
│                     localStorage                        │
│  Key: rss_reader_subscriptions                         │
│  Value: { subscriptions: Subscription[] }              │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              SubscriptionContext                        │
│  State: { subscriptions, isLoading, error }            │
│  Actions: ADD, REMOVE, UPDATE, LOAD                    │
└─────────────────────────────────────────────────────────┘
                          ↓
                     urls: string[]
                          ↓
┌─────────────────────────────────────────────────────────┐
│              feedAPI.parse(urls)                        │
│  POST /api/parse                                        │
│  Request: { urls }                                      │
│  Response: { feeds, errors }                            │
└─────────────────────────────────────────────────────────┘
                          ↓
              ┌───────────┴───────────┐
              ↓                       ↓
┌───────────────────────┐   ┌──────────────────┐
│   ArticleContext      │   │   UIContext      │
│   State:              │   │   State:         │
│   - articles[]        │   │   - isRefreshing │
│   - searchQuery       │   │   - toast        │
│   - errors[]          │   │                  │
└───────────────────────┘   └──────────────────┘
              ↓
        React Components
              ↓
         User Interface
```

---

## バリデーションルール

### URL検証（FR-008）

**クライアントサイド検証**:
```typescript
function isValidFeedURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
```

**エラーメッセージ**:
- 空文字列: "URLを入力してください"
- 無効な形式: "有効なURLを入力してください（http://またはhttps://から始まる必要があります）"
- 100件超過: "購読フィードは最大100件までです"

### 記事要約の切り詰め

**実装**:
```typescript
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
```

**適用**: FR-004、エッジケースの仕様（300文字）

---

## まとめ

本データモデルは、以下の3つのエンティティで構成されます:

1. **Subscription**: ユーザーの購読フィード（localStorage永続化）
2. **Article**: RSSフィードから取得された記事（APIレスポンスから生成）
3. **FeedError**: 失敗したフィード操作（APIエラーレスポンスから生成）

これらのエンティティは、3つのContextAPI（SubscriptionContext、ArticleContext、UIContext）を通じて管理され、すべての機能要件（FR-001〜FR-017）を実現します。
