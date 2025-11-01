# Data Model: 複数RSSフィード登録時のURL/タイトル不一致バグ修正

**Date**: 2025-11-01
**Feature**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

## 概要

このバグ修正では、既存のデータモデル（Subscription, RSSFeed）に変更を加えません。URL正規化とマッチングロジックのみを改善します。

## 既存のエンティティ

### 1. Subscription（購読情報）

**場所**: `frontend/src/types/models.ts`

**目的**: ユーザーが登録したRSSフィードの購読情報を表す

**フィールド**:

| フィールド名 | 型 | 必須 | 説明 |
|-------------|----|----|------|
| id | string | ✅ | 一意識別子（crypto.randomUUID()で生成） |
| url | string | ✅ | 登録したフィードURL |
| title | string \| null | ✅ | 取得したフィードタイトル（初回はnull、取得後に更新） |
| customTitle | string \| null | ✅ | ユーザーが設定したカスタムタイトル |
| subscribedAt | string | ✅ | 購読開始日時（ISO 8601形式） |
| lastFetchedAt | string \| null | ✅ | 最終取得日時（ISO 8601形式） |
| status | 'active' \| 'error' | ✅ | 購読ステータス |

**バリデーションルール**:

- `url`: 有効なURL形式（http/httpsのみ）
- `id`: UUID v4形式
- `subscribedAt`, `lastFetchedAt`: ISO 8601形式の日時文字列

**状態遷移**:

```text
[初期状態]
  url: ユーザー入力
  title: null
  status: 'active'
    ↓ フィード取得成功
  title: APIから取得したタイトル
  status: 'active'
    ↓ フィード取得失敗
  title: 前回のタイトル（または null）
  status: 'error'
```

**永続化**: localStorageに保存（キー: `subscriptions`）

### 2. RSSFeed（API応答フィード）

**場所**: `frontend/src/types/api.ts`

**目的**: バックエンドAPIから返されるフィードデータを表す

**フィールド**:

| フィールド名 | 型 | 必須 | 説明 |
|-------------|----|----|------|
| link | string | ✅ | フィードのURL（APIが返す値） |
| title | string | ✅ | フィードタイトル（APIが返す値） |
| articles | APIArticle[] | ✅ | 記事リスト |

**バリデーションルール**:

- `link`: 有効なURL形式
- `title`: 空文字列でない
- `articles`: 配列（空配列も許可）

**関係性**:

- `RSSFeed.link` と `Subscription.url` をURL正規化後にマッチング
- マッチング成功時、`RSSFeed.title` を `Subscription.title` に反映

### 3. APIArticle（記事データ）

**場所**: `frontend/src/types/api.ts`

**目的**: フィード内の個別記事を表す

**フィールド**:

| フィールド名 | 型 | 必須 | 説明 |
|-------------|----|----|------|
| title | string | ✅ | 記事タイトル |
| link | string | ✅ | 記事URL |
| pubDate | string \| null | ❌ | 公開日時（ISO 8601形式） |
| summary | string | ✅ | 記事サマリー |

**変更**: なし（このバグ修正では記事データに影響しない）

## 新規追加のユーティリティ型

### 4. NormalizedUrl（正規化URL）

**場所**: `frontend/src/utils/urlNormalizer.ts`

**目的**: URL正規化の結果を明示的に型付け

**定義**:

```typescript
/**
 * 正規化されたURL文字列
 *
 * 正規化ルール:
 * - プロトコル: https
 * - ドメイン: 小文字、www prefix除去
 * - パス: 末尾スラッシュ除去
 * - クエリパラメータ: 保持される
 * - ハッシュ: 除外される
 */
export type NormalizedUrl = string & { readonly __brand: unique symbol }
```

**使用例**:

```typescript
const normalized: NormalizedUrl = normalizeUrl('http://www.example.com/feed/')
// => 'https://example.com/feed'
```

## データフロー図

### フィード取得とマッチングのフロー

```text
[User]
  ↓ フィード登録
[FeedContainer]
  ↓ URL追加
[localStorage] ← Subscription保存
  ↓
[useFeedAPI.fetchFeeds()]
  ↓ API呼び出し
[Backend API]
  ↓ 応答
[RSSFeed[]] (順序不定)
  ↓
[findMatchingFeed()] ← **修正箇所**
  ├─ normalizeUrl(subscription.url)  ← **新規追加**
  ├─ normalizeUrl(feed.link)         ← **新規追加**
  └─ URLマッチング（正規化後の値で比較）
  ↓ マッチング成功
[Subscription.title更新]
  ↓
[localStorage] ← 更新されたSubscription保存
  ↓
[UI表示] ← 正しいURL/タイトル組み合わせ
```

### エラー時のフロー

```text
[findMatchingFeed()]
  ↓ マッチング失敗
console.warn() ← **ログ出力（新規追加）**
  ↓
[undefined返却]
  ↓
[Subscription.title保持] ← **既存のタイトルを維持（変更なし）**
  ↓
[UI表示] ← フォールバック値（URLまたは前回のタイトル）
```

## 制約と前提条件

### データ整合性の制約

1. **一意性**: `Subscription.id` は一意であること（UUID v4）
2. **URL形式**: `Subscription.url` と `RSSFeed.link` は有効なURL形式
3. **正規化の冪等性**: `normalizeUrl(normalizeUrl(url)) === normalizeUrl(url)`
4. **タイトル更新の安全性**: マッチング失敗時はタイトルを更新しない

### パフォーマンス制約

1. **URL正規化**: O(1) - 1ms以内
2. **フィードマッチング**: O(n*m) - n: 購読数、m: API応答フィード数
   - 最悪ケース: 10購読 × 10フィード = 100回の正規化+比較 ≈ 10ms
3. **localStorage容量**: 5-10MB（ブラウザ制限）

## マイグレーション

**不要**: 既存のデータモデルに変更がないため、マイグレーション不要

既存のlocalStorageデータ（Subscription[]）はそのまま使用可能。

## 今後の拡張案（YAGNI原則により現時点では実装しない）

1. **URL正規化のキャッシュ**: メモ化による高速化（現時点では不要）
2. **Subscription.normalizedUrl**: 正規化URLを永続化（現時点では不要）
3. **FeedMatchingResult型**: マッチング結果の詳細情報（現時点では不要）

## まとめ

**データモデル変更**: なし

**新規追加**: URL正規化ユーティリティ型のみ

**影響範囲**: マッチングロジックのみ（データ構造は不変）

**次のフェーズ**: Phase 1（Contracts）に進むことができます。
