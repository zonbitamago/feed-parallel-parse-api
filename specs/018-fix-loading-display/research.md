# Research: 記事表示時のローディング表示抑制

**Date**: 2025-11-25
**Status**: Complete

## 調査項目

### 1. 現在の実装状況

**調査結果**: `ArticleContainer.tsx`の34-36行目でローディング表示を制御

```typescript
// 現在の実装
if (state.isLoading) {
  return <LoadingIndicator />
}
```

**問題点**:
- `isLoading`のみで判定しているため、記事の有無に関係なくローディング表示
- ポーリング中も手動更新中も同じ挙動で、既存記事が一時的に非表示になる

### 2. ArticleContext の状態構造

**調査結果**: `ArticleContext.tsx`で管理されている状態

```typescript
interface ArticleState {
  articles: Article[]           // 全記事
  displayedArticles: Article[]  // 表示対象記事
  isLoading: boolean            // 読み込み中フラグ
  errors: FeedError[]           // エラー
  pendingArticles: Article[]    // ポーリングで取得した新着記事
  hasNewArticles: boolean       // 新着有無
  newArticlesCount: number      // 新着数
  lastPolledAt: number | null   // 最終ポーリング時刻
}
```

**決定**: `state.articles`の長さを使用して記事の有無を判定可能

### 3. ベストプラクティス: ローディング表示パターン

**調査結果**: スケルトンローディング vs スピナー

| パターン | 使用場面 | メリット |
|---------|---------|---------|
| スケルトン | 初回読み込み、レイアウトが予測可能 | UXが良い |
| スピナー | 短時間の更新、コンテンツ上書き | シンプル |
| 非表示 | バックグラウンド更新 | 中断なし |

**決定**: 今回は「記事があれば非表示」パターンを採用。既存のスピナーはそのまま使用。

### 4. テストアプローチ

**調査結果**: React Testing Libraryのベストプラクティス

- `screen.queryByText()`で要素の非存在を確認
- `screen.getByText()`で要素の存在を確認
- モックコンテキストで状態を制御

**決定**: 3Aパターン（Arrange-Act-Assert）に従い、以下のテストケースを作成
1. 記事0件 + isLoading=true → LoadingIndicator表示
2. 記事N件 + isLoading=true → ArticleList表示
3. 記事N件 + isLoading=false → ArticleList表示

## 解決策

### 技術的アプローチ

```typescript
// 修正後の実装
if (state.isLoading && state.articles.length === 0) {
  return <LoadingIndicator />
}
```

### 影響範囲

- **変更ファイル**: `frontend/src/containers/ArticleContainer.tsx`（1行）
- **テスト追加**: `frontend/src/containers/ArticleContainer.test.tsx`（3ケース）
- **既存機能への影響**: なし

## 未解決項目

なし。全ての調査項目が解決済み。
