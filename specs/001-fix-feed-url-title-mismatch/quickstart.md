# Quickstart: 複数RSSフィード登録時のURL/タイトル不一致バグ修正

**Date**: 2025-11-01
**Feature**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

## 概要

このガイドでは、URL/タイトル不一致バグ修正の実装を5-10分で開始できるように、開発環境のセットアップから最初のテスト実行までの手順を説明します。

## 前提条件

- Node.js 18+ がインストールされていること
- プロジェクトのリポジトリがクローンされていること
- `001-fix-feed-url-title-mismatch` ブランチにチェックアウト済みであること

## クイックスタート（5分）

### 1. 依存関係のインストール

```bash
cd frontend
npm install
```

### 2. 既存テストの実行（動作確認）

```bash
# 全テストを実行
npm test

# 特定のテストのみ実行
npm test useFeedAPI
```

**期待される結果**: 既存のテストがすべてパスすること

### 3. 開発サーバーの起動（オプション）

```bash
# 開発サーバーを起動
npm run dev
```

**アクセス**: http://localhost:5173

### 4. 最初のテストを書く（TDDの開始）

```bash
# URL正規化関数のテストファイルを作成
touch src/utils/urlNormalizer.test.ts
```

**テストの例**（コピー&ペースト可能）:

```typescript
import { describe, it, expect } from 'vitest'
import { normalizeUrl } from './urlNormalizer'

describe('normalizeUrl', () => {
  it('should normalize http to https', () => {
    const input = 'http://example.com'
    const expected = 'https://example.com'
    expect(normalizeUrl(input)).toBe(expected)
  })
})
```

### 5. テストを実行（Red）

```bash
npm test urlNormalizer
```

**期待される結果**: テストが失敗すること（Red）

```
FAIL  src/utils/urlNormalizer.test.ts
  normalizeUrl
    ✕ should normalize http to https
```

## 次のステップ

### Phase 1: URL正規化関数の実装

1. **Red**: テストを書く（上記の手順4-5）
2. **Green**: 実装を追加（`src/utils/urlNormalizer.ts`）
3. **Refactor**: コードの品質を向上

**実装の開始**:

```bash
# URL正規化関数のファイルを作成
touch src/utils/urlNormalizer.ts
```

### Phase 2: findMatchingFeed関数の修正

1. **Red**: テストを書く（`src/hooks/useFeedAPI.test.ts`に追加）
2. **Green**: インデックスフォールバックを削除
3. **Refactor**: 正規化URLを使用

### Phase 3: 統合テストの追加

1. **Red**: 統合テストを書く
2. **Green**: 全体の動作確認
3. **Refactor**: 最終調整

## ディレクトリ構造

```text
frontend/
├── src/
│   ├── utils/
│   │   ├── urlNormalizer.ts          # 👈 新規追加
│   │   └── urlNormalizer.test.ts     # 👈 新規追加
│   ├── hooks/
│   │   ├── useFeedAPI.ts             # 👈 修正対象
│   │   └── useFeedAPI.test.ts        # 👈 テスト追加
│   └── ...
└── tests/
    └── integration/
        └── FeedManager.integration.test.tsx  # 👈 新規追加（オプション）
```

## TDDサイクルの実践

### Red-Green-Refactor サイクル

```bash
# 1. Red: テストを書く
vim src/utils/urlNormalizer.test.ts
npm test urlNormalizer
# => テストが失敗することを確認

# 2. Green: 最小限の実装
vim src/utils/urlNormalizer.ts
npm test urlNormalizer
# => テストがパスすることを確認

# 3. Refactor: コードの品質向上
vim src/utils/urlNormalizer.ts
npm test urlNormalizer
# => テストがパスし続けることを確認

# 4. Commit: 各フェーズでコミット
git add .
git commit -m "test: URL正規化のテストを追加（Red）"
git commit -m "feat: URL正規化を実装（Green）"
git commit -m "refactor: URL正規化をリファクタリング（Refactor）"
```

## テスト実行のベストプラクティス

### 推奨コマンド

```bash
# ✅ 推奨: 1回限りの実行（CPU負荷低）
npm test

# ✅ 推奨: 特定のファイルのみ実行
npm test urlNormalizer

# ✅ 推奨: カバレッジ付き実行
npm test -- --coverage

# ⚠️ 注意: watchモードは使用しない（CPU負荷高）
# npm run test:watch  # 使わない
```

### 並列実行の制御（オプション）

```bash
# CPU負荷が高い場合は並列数を制限
npm test -- --maxWorkers=2
```

## トラブルシューティング

### テストが実行されない

```bash
# Node modulesを再インストール
rm -rf node_modules package-lock.json
npm install
```

### TypeScriptの型エラー

```bash
# 型チェックを実行
npm run build
```

### ESLintエラー

```bash
# Lintを実行
npm run lint
```

## 開発ツール

### VSCode推奨拡張機能

- **ESLint**: dbaeumer.vscode-eslint
- **Prettier**: esbenp.prettier-vscode
- **Vitest**: ZixuanChen.vitest-explorer
- **TypeScript**: vscode.typescript-language-features

### VSCode設定（`.vscode/settings.json`）

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## パフォーマンスモニタリング

### テスト実行時間の確認

```bash
# テスト実行時間を表示
npm test -- --reporter=verbose
```

### カバレッジの確認

```bash
# カバレッジレポートを生成
npm test -- --coverage

# カバレッジレポートを開く
open coverage/index.html
```

## コミットメッセージの例

### TDDサイクルに基づくコミット

```bash
# Red: テストを追加
git commit -m "test: URL正規化関数のテストを追加（Red）"

# Green: 実装を追加
git commit -m "feat: URL正規化関数を実装（Green）"

# Refactor: リファクタリング
git commit -m "refactor: URL正規化関数をリファクタリング（Refactor）"

# Test: テストを追加
git commit -m "test: findMatchingFeedのテストを追加"

# Fix: バグ修正
git commit -m "fix: findMatchingFeedのインデックスフォールバックを削除"
```

## 参考リンク

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- プロジェクト憲法: [.specify/memory/constitution.md](../../../.specify/memory/constitution.md)

## サポート

問題が発生した場合は、以下を確認してください：

1. **既存のテストが通るか**: `npm test`
2. **型チェックが通るか**: `npm run build`
3. **Lintエラーがないか**: `npm run lint`

それでも解決しない場合は、プロジェクトチームに相談してください。

## まとめ

**所要時間**: 5-10分でTDDサイクルを開始可能

**次のアクション**:
1. `npm test`で既存テストを確認
2. `touch src/utils/urlNormalizer.test.ts`で最初のテストファイルを作成
3. テストを書いてRed状態を確認
4. 実装してGreen状態にする
5. リファクタリングして品質を向上

**TDDの原則**: Red→Green→Refactor を小さく繰り返す
