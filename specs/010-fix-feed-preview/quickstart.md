# Quickstart: フィードプレビュー取得時のAbortController処理修正

**Feature**: 010-fix-feed-preview
**Branch**: `010-fix-feed-preview`
**Date**: 2025-10-31

## Overview

このガイドでは、フィードプレビュー取得時のAbortController処理不具合を修正する手順を説明します。この修正により、2件目以降のフィード追加時でもプレビューが正しく表示されるようになります。

## Prerequisites

### 必須環境

- Node.js 18以上
- npm 9以上
- Git

### リポジトリのセットアップ

```bash
# リポジトリのクローン（既にクローン済みの場合はスキップ）
cd /Users/k-takiuchi/Documents/feed-parallel-parse-api

# ブランチの確認
git branch
# → 010-fix-feed-preview ブランチにいることを確認

# 依存関係のインストール
cd frontend
npm install
```

## Quick Test

修正前の動作を確認します：

```bash
# フロントエンドのテストを実行
cd frontend
npm test useFeedPreview.test.ts

# 期待結果: すべてのテストがパス
# ✓ 有効なURLを入力するとフィードタイトルのプレビューを取得する
# ✓ URL入力をデバウンスして不要なAPI呼び出しを削減する
# ✓ 無効なURLや存在しないフィードの場合はエラーを返す
# ✓ ネットワークエラーが発生した場合はエラーを返す
# ✓ clearPreview()を呼ぶとプレビュー状態がクリアされる
# ✓ 空文字を渡すとプレビュー取得を行わない
```

## Development Workflow

### 1. 問題の再現

現在の問題を確認します：

```bash
# 開発サーバーを起動
cd frontend
npm run dev

# ブラウザでhttp://localhost:5173を開く
# 1. 1件目のRSSフィードを追加（例: https://example.com/feed1）
#    → プレビューが表示される ✅
# 2. 2件目のRSSフィードURLを入力開始（例: https://example.com/feed2）
#    → プレビューが表示されない ❌（不具合）
```

### 2. コード修正

修正対象ファイル: `frontend/src/services/feedAPI.ts`

**修正内容**:
- 外部からのAbortSignalによるキャンセルを追跡するフラグを追加
- AbortErrorハンドリングで、外部キャンセルとタイムアウトを区別

**修正箇所**: `parseFeeds`関数（20-58行目）

### 3. テスト実行

修正後、テストを実行して動作を確認します：

```bash
# 関連テストのみ実行（開発中）
npm test useFeedPreview.test.ts

# すべてのテストを実行（修正完了後）
npm test

# カバレッジ確認
npm test -- --coverage
```

### 4. 手動テスト

開発サーバーで実際の動作を確認します：

```bash
npm run dev
```

**テストシナリオ**:

1. **1件目のフィード追加**
   - URL入力フィールドに有効なRSSフィードURLを入力
   - 500ms後にプレビューが表示されることを確認 ✅

2. **2件目のフィード追加**
   - 1件目を追加後、URL入力フィールドに2件目のURLを入力
   - 500ms後にプレビューが表示されることを確認 ✅（修正後）

3. **URL連続変更**
   - URL入力フィールドで短時間に複数回URLを変更
   - 最後のURLのプレビューのみが表示されることを確認 ✅

4. **エラーハンドリング**
   - 無効なURLを入力してエラーメッセージが表示されることを確認 ✅

## Common Issues

### Issue 1: テストがタイムアウトする

**症状**: テスト実行時に "Exceeded timeout" エラー

**解決策**:
```bash
# タイムアウト時間を延長
npm test -- --testTimeout=10000
```

### Issue 2: プレビューが表示されない

**症状**: 修正後もプレビューが表示されない

**チェックリスト**:
1. ブラウザのコンソールでエラーを確認
2. ネットワークタブでAPI呼び出しを確認
3. デバウンス遅延（500ms）を待っているか確認
4. URLが有効なRSSフィードか確認

### Issue 3: ESLintエラー

**症状**: `error 'externalAbort' is never reassigned`

**解決策**:
```typescript
// letを使用（フラグを更新するため）
let externalAbort = false;
```

## File Structure

この修正で変更されるファイル：

```text
frontend/
├── src/
│   └── services/
│       └── feedAPI.ts              # 修正対象（parseFeeds関数）
└── tests/
    └── hooks/
        └── useFeedPreview.test.ts  # 動作確認（変更不要）
```

## Next Steps

修正が完了したら：

1. **コミット**:
   ```bash
   git add frontend/src/services/feedAPI.ts
   git commit -m "fix(feedAPI): 外部AbortSignalとタイムアウトを区別してAbortErrorを処理"
   ```

2. **テスト確認**:
   ```bash
   npm test
   ```

3. **タスク実行**:
   ```bash
   # SpecKitのタスク生成コマンドを実行
   /speckit.tasks

   # タスクに従って実装
   /speckit.implement
   ```

4. **PR作成**:
   - GitHub上でプルリクエストを作成
   - テスト結果とスクリーンショットを添付

## Additional Resources

- [Feature Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Research Document](./research.md)
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [Project Constitution](../../.specify/memory/constitution.md)

## Support

問題が発生した場合は、以下を確認してください：

1. Node.jsとnpmのバージョン
2. 依存関係のインストール状況（`npm install`）
3. ブランチが`010-fix-feed-preview`であることを確認
4. ブラウザのコンソールエラー

それでも解決しない場合は、GitHubのIssueを作成してください。
