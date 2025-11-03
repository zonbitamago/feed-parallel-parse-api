# Data Model: フィード自動ポーリング機能

**Feature**: 016-feed-auto-polling
**Date**: 2025-11-03
**Status**: Final

## 概要

このドキュメントでは、フィード自動ポーリング機能で使用するデータモデルを定義する。既存のArticleContextを拡張し、ポーリング状態と新着記事を管理する。

## エンティティ定義

### 1. PollingState（ポーリング状態）

ポーリング機能の現在の状態を表すインターフェース。

```typescript
interface PollingState {
  /**
   * ポーリングで取得した新着記事（未反映）
   * ユーザーが「読み込む」ボタンをクリックするまで保持
   */
  pendingArticles: Article[]

  /**
   * 最終ポーリング時刻（UNIX timestamp）
   * null = まだポーリングが実行されていない
   */
  lastPolledAt: number | null

  /**
   * 新着記事の件数
   * pendingArticles.lengthと同じ値
   */
  newArticlesCount: number

  /**
   * 新着記事があるかどうかのフラグ
   * true = 新着通知を表示すべき
   * false = 通知を非表示
   */
  hasNewArticles: boolean
}
```

**制約**:
- `pendingArticles`は最大数千件（記事数の上限なし）
- `lastPolledAt`はlocalStorageに永続化される
- `hasNewArticles`は`pendingArticles.length > 0`と同じ値

**用途**:
- useFeedPollingフックの戻り値
- NewArticlesNotificationコンポーネントのProps

---

### 2. PollingConfig（ポーリング設定）

ポーリング機能の設定を表すインターフェース。

```typescript
interface PollingConfig {
  /**
   * ポーリング間隔（ミリ秒）
   * デフォルト: 600000 (10分)
   */
  interval: number

  /**
   * ポーリング有効化フラグ
   * true = ポーリング実行
   * false = ポーリング停止
   */
  enabled: boolean
}
```

**デフォルト値**:
```typescript
const DEFAULT_POLLING_CONFIG: PollingConfig = {
  interval: 600000, // 10分
  enabled: true,
}
```

**制約**:
- `interval`は正の整数（最小値: 60000 = 1分）
- `enabled`は将来的にユーザー設定可能にする予定

**用途**:
- useFeedPollingフックの引数
- localStorageに保存（永続化）

---

### 3. ArticleState（既存の拡張）

既存のArticleContextのStateを拡張し、ポーリング関連の状態を追加する。

```typescript
interface ArticleState {
  // ========================================
  // 既存フィールド（変更なし）
  // ========================================

  /**
   * 現在表示中の記事一覧
   */
  articles: Article[]

  /**
   * フィルタリング後の表示記事
   */
  displayedArticles: Article[]

  /**
   * 検索クエリ
   */
  searchQuery: string

  /**
   * 選択されたフィードID（null = 全フィード）
   */
  selectedFeedId: string | null

  /**
   * ローディング中フラグ
   */
  isLoading: boolean

  /**
   * エラー情報
   */
  errors: FeedError[]

  // ========================================
  // 新規追加フィールド
  // ========================================

  /**
   * ポーリングで取得した新着記事（未反映）
   */
  pendingArticles: Article[]

  /**
   * 新着記事があるかどうか
   */
  hasNewArticles: boolean

  /**
   * 新着記事の件数
   */
  newArticlesCount: number

  /**
   * 最終ポーリング時刻（UNIX timestamp）
   */
  lastPolledAt: number | null
}
```

**初期値**:
```typescript
const initialArticleState: ArticleState = {
  // 既存
  articles: [],
  displayedArticles: [],
  searchQuery: '',
  selectedFeedId: null,
  isLoading: false,
  errors: [],

  // 新規
  pendingArticles: [],
  hasNewArticles: false,
  newArticlesCount: 0,
  lastPolledAt: null,
}
```

---

### 4. ArticleAction（既存の拡張）

既存のArticleActionに、ポーリング関連のアクションを追加する。

```typescript
type ArticleAction =
  // ========================================
  // 既存アクション（変更なし）
  // ========================================
  | { type: 'SET_ARTICLES'; payload: Article[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_ERROR'; payload: FeedError }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_FEED'; payload: string | null }

  // ========================================
  // 新規追加アクション
  // ========================================

  /**
   * ポーリングで取得した新着記事を保存
   * pendingArticles, hasNewArticles, newArticlesCountを更新
   */
  | { type: 'SET_PENDING_ARTICLES'; payload: Article[] }

  /**
   * 新着記事を記事一覧に反映
   * pendingArticlesをarticlesにマージし、pendingArticlesをクリア
   */
  | { type: 'APPLY_PENDING_ARTICLES' }

  /**
   * 最終ポーリング時刻を保存
   */
  | { type: 'SET_LAST_POLLED_AT'; payload: number }
```

**アクションの詳細**:

#### SET_PENDING_ARTICLES

```typescript
case 'SET_PENDING_ARTICLES':
  return {
    ...state,
    pendingArticles: action.payload,
    hasNewArticles: action.payload.length > 0,
    newArticlesCount: action.payload.length,
  }
```

**使用タイミング**: useFeedPollingで新着記事を検出した時

#### APPLY_PENDING_ARTICLES

```typescript
case 'APPLY_PENDING_ARTICLES':
  const mergedArticles = mergeArticles(state.articles, state.pendingArticles)
  return {
    ...state,
    articles: mergedArticles,
    displayedArticles: applyFilters(mergedArticles, state.searchQuery, state.selectedFeedId),
    pendingArticles: [],
    hasNewArticles: false,
    newArticlesCount: 0,
  }
```

**使用タイミング**: ユーザーが「読み込む」ボタンをクリックした時

#### SET_LAST_POLLED_AT

```typescript
case 'SET_LAST_POLLED_AT':
  return {
    ...state,
    lastPolledAt: action.payload,
  }
```

**使用タイミング**: ポーリング完了時（成功・失敗問わず）

---

### 5. Article（既存、変更なし）

ポーリング機能で使用する記事データ。既存のArticle型をそのまま使用する。

```typescript
interface Article {
  /**
   * 記事の一意なID
   * 形式: `${feedId}-${link}`
   */
  id: string

  /**
   * 記事タイトル
   */
  title: string

  /**
   * 記事URL
   */
  link: string

  /**
   * 記事要約
   */
  summary: string

  /**
   * 公開日時（ISO 8601形式）
   */
  pubDate: string

  /**
   * フィード情報
   */
  feed: {
    id: string
    title: string
    url: string
  }
}
```

**重複判定**:
- `id`フィールドで重複を判定
- `id`は`${feedId}-${link}`の形式で一意

---

## データフロー

### 1. ポーリング実行フロー

```
useFeedPolling
  ↓ (10分ごと)
useFeedAPI.fetchFeeds(subscriptions)
  ↓
latestArticles: Article[]
  ↓
findNewArticles(latestArticles, currentArticles)
  ↓
newArticles: Article[]
  ↓ (dispatch)
ArticleContext.SET_PENDING_ARTICLES
  ↓
ArticleState.pendingArticles = newArticles
ArticleState.hasNewArticles = true
ArticleState.newArticlesCount = newArticles.length
```

### 2. 新着記事反映フロー

```
ユーザーが「読み込む」ボタンをクリック
  ↓
ArticleContext.APPLY_PENDING_ARTICLES
  ↓
mergedArticles = mergeArticles(articles, pendingArticles)
  ↓
ArticleState.articles = mergedArticles
ArticleState.displayedArticles = applyFilters(mergedArticles, ...)
ArticleState.pendingArticles = []
ArticleState.hasNewArticles = false
ArticleState.newArticlesCount = 0
```

### 3. localStorage永続化フロー

```
ポーリング完了
  ↓
savePollingConfig({ lastPolledAt, interval, enabled })
  ↓
localStorage.setItem('rss_reader_polling_config', JSON.stringify(...))
  ↓
ページリロード
  ↓
loadPollingConfig()
  ↓
localStorage.getItem('rss_reader_polling_config')
  ↓
ArticleContext.SET_LAST_POLLED_AT
```

---

## ユーティリティ関数

### findNewArticles

新着記事を検出する関数。

```typescript
/**
 * 最新の記事一覧から、現在の記事一覧に存在しない新着記事を抽出
 *
 * @param latestArticles ポーリングで取得した最新の記事一覧
 * @param currentArticles 現在表示中の記事一覧
 * @returns 新着記事のみの配列
 */
function findNewArticles(
  latestArticles: Article[],
  currentArticles: Article[]
): Article[] {
  const currentIds = new Set(currentArticles.map(a => a.id))
  return latestArticles.filter(article => !currentIds.has(article.id))
}
```

**計算量**: O(n + m)（n = latestArticles.length, m = currentArticles.length）

### mergeArticles

新着記事と既存記事をマージし、日付順にソートする関数。

```typescript
/**
 * 新着記事と既存記事をマージし、日付順（降順）にソート
 *
 * @param currentArticles 既存の記事一覧
 * @param newArticles 新着記事一覧
 * @returns マージ＆ソート済みの記事一覧
 */
function mergeArticles(
  currentArticles: Article[],
  newArticles: Article[]
): Article[] {
  const merged = [...newArticles, ...currentArticles]
  return sortArticlesByDate(merged) // 既存のソート関数を使用
}
```

**計算量**: O((n + m) log (n + m))（ソートのため）

---

## localStorage スキーマ

### rss_reader_polling_config

```typescript
interface PollingStorage {
  lastPolledAt: number | null
  pollingInterval: number
  enabled: boolean
}
```

**JSONフォーマット**:
```json
{
  "lastPolledAt": 1699000000000,
  "pollingInterval": 600000,
  "enabled": true
}
```

**保存タイミング**:
- ポーリング完了時（lastPolledAtを更新）
- ユーザーが設定を変更した時（将来的に実装）

**読み込みタイミング**:
- アプリ起動時（useFeedPollingの初期化時）
- ページリロード時

---

## バリデーション

### PollingConfigのバリデーション

```typescript
function validatePollingConfig(config: unknown): PollingConfig {
  if (typeof config !== 'object' || config === null) {
    return DEFAULT_POLLING_CONFIG
  }

  const { interval, enabled } = config as Partial<PollingConfig>

  return {
    interval: typeof interval === 'number' && interval >= 60000
      ? interval
      : DEFAULT_POLLING_CONFIG.interval,
    enabled: typeof enabled === 'boolean'
      ? enabled
      : DEFAULT_POLLING_CONFIG.enabled,
  }
}
```

**制約**:
- `interval`は60000以上（1分以上）
- `enabled`はboolean型
- 不正な値の場合はデフォルト値を使用

---

## エラーケース

### 1. localStorageが無効な場合

```typescript
try {
  localStorage.setItem('rss_reader_polling_config', JSON.stringify(config))
} catch (error) {
  console.error('Failed to save polling config:', error)
  // エラー通知は表示しない（非クリティカル）
}
```

### 2. ポーリング失敗時

```typescript
try {
  const latestArticles = await fetchFeeds(subscriptions)
  // 成功処理
} catch (error) {
  console.error('Polling failed:', error)
  // エラー通知は表示しない（バックグラウンド処理のため）
  // 次回ポーリングで自動リトライ
}
```

### 3. 記事ID重複時

```typescript
// findNewArticles内でSet.has()を使用し、重複を自動的に排除
const currentIds = new Set(currentArticles.map(a => a.id))
return latestArticles.filter(article => !currentIds.has(article.id))
```

---

## パフォーマンス考慮事項

### メモリ使用量

- **pendingArticles**: 最大数千件（1記事 ≈ 1KB、1000記事 ≈ 1MB）
- **localStorageデータ**: 数百バイト
- **合計**: 約1-2MB（許容範囲内）

### 計算量

- **findNewArticles**: O(n + m)（Set.has()がO(1））
- **mergeArticles**: O((n + m) log (n + m))（ソートのため）
- **全体**: 数百件の記事でもミリ秒単位で完了

---

## 次のステップ

データモデル定義完了。次は：

1. quickstart.mdを作成（開発者向けガイド）
2. `/speckit.tasks`でtasks.mdを生成
3. TDDで実装開始
