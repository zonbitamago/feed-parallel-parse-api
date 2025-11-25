# Quickstart: 記事表示時のローディング表示抑制

**Feature Branch**: `018-fix-loading-display`
**Estimated Time**: 30分

## 概要

ポーリング（自動更新）時にローディングアイコンが表示されて記事が読めなくなる問題を修正します。

## 前提条件

- Node.js 20+
- npm 10+

## セットアップ

```bash
# ブランチに切り替え
git checkout 018-fix-loading-display

# 依存関係インストール
cd frontend
npm install
```

## 実装手順

### Step 1: テスト作成（Red）

`frontend/src/containers/ArticleContainer.test.tsx` にテストケースを追加:

```typescript
describe('ローディング表示', () => {
  it('記事が0件でローディング中の場合、ローディングアイコンを表示する', () => {
    // Arrange: 準備
    // 記事0件 + isLoading=true の状態をセットアップ

    // Act: 実行
    // ArticleContainerをレンダリング

    // Assert: 検証
    // LoadingIndicatorが表示されることを確認
  })

  it('記事があればローディング中でも記事一覧を表示する', () => {
    // Arrange: 準備
    // 記事N件 + isLoading=true の状態をセットアップ

    // Act: 実行
    // ArticleContainerをレンダリング

    // Assert: 検証
    // ArticleListが表示され、LoadingIndicatorは非表示
  })
})
```

### Step 2: テスト実行（Red確認）

```bash
npm test ArticleContainer.test.tsx
```

テストが失敗することを確認。

### Step 3: 実装（Green）

`frontend/src/containers/ArticleContainer.tsx` の34-36行目を修正:

```typescript
// 修正前
if (state.isLoading) {
  return <LoadingIndicator />
}

// 修正後
// 記事がない場合のみローディング表示（既存の記事があれば表示し続ける）
if (state.isLoading && state.articles.length === 0) {
  return <LoadingIndicator />
}
```

### Step 4: テスト実行（Green確認）

```bash
npm test ArticleContainer.test.tsx
```

全テストがパスすることを確認。

### Step 5: 全テスト実行

```bash
npm test
```

既存テストを含め、全テストがパスすることを確認。

## 動作確認

1. 開発サーバー起動
   ```bash
   npm run dev
   ```

2. ブラウザで http://localhost:5173 を開く

3. フィードを購読して記事を表示

4. 10分待つ（またはポーリング間隔を短縮してテスト）

5. ポーリング発生時も記事一覧が表示され続けることを確認

## トラブルシューティング

### テストが失敗する

```bash
# キャッシュクリア
npm test -- --clearCache
```

### 型エラーが発生する

```bash
# 型チェック
npx tsc --noEmit
```

## 完了条件

- [ ] 新規テストが全てパス
- [ ] 既存テストが全てパス
- [ ] 型チェックがパス
- [ ] 手動テストで動作確認
