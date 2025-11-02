# Quickstart: 購読フィードのインポート/エクスポート機能

**Feature**: 014-feed-import-export
**Date**: 2025-11-02
**Branch**: `014-feed-import-export`

## 目的

このガイドは、購読フィードのインポート/エクスポート機能を開発する際のクイックスタートドキュメントです。開発環境のセットアップ、テストの実行方法、デバッグ方法を説明します。

---

## 前提条件

以下がインストールされていることを確認してください：

- **Node.js**: v18以上
- **npm**: v9以上
- **Git**: v2.30以上

---

## 開発環境のセットアップ

### 1. リポジトリのクローンとブランチ切り替え

```bash
# リポジトリをクローン（初回のみ）
git clone <repository-url>
cd feed-parallel-parse-api

# 機能ブランチに切り替え
git checkout 014-feed-import-export
```

### 2. 依存関係のインストール

```bash
# フロントエンドの依存関係をインストール
cd frontend
npm install
```

### 3. 開発サーバーの起動

```bash
# フロントエンド開発サーバーを起動（ポート: 5173）
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスして、アプリケーションが起動することを確認します。

---

## テストの実行

### 基本的なテスト実行

```bash
# フロントエンドのテストを実行（1回限りの実行）
npm test
```

**重要**: watchモードは使用しないでください（CPU負荷が高いため）。

### 特定のテストファイルのみ実行

```bash
# 特定のファイルのテストを実行
npm test importExport.service.test.ts
npm test ImportExportButtons.test.tsx
```

### カバレッジ測定

```bash
# カバレッジレポートを生成
npm test -- --coverage

# カバレッジレポートをブラウザで確認
open coverage/index.html
```

**目標**: 新規コードのカバレッジ100%

---

## TDD ワークフロー（Red-Green-Refactor）

### Phase 1: Red（失敗するテストを書く）

```bash
# 1. テストファイルを作成
touch frontend/src/services/importExport.service.test.ts

# 2. テストを書く（実装はまだ存在しない）
# - 例: exportSubscriptions()のテストケースを記述

# 3. テストを実行して失敗することを確認
npm test importExport.service.test.ts
# → "Cannot find module" などのエラーが表示される（期待通り）
```

### Phase 2: Green（テストを通す）

```bash
# 1. 実装ファイルを作成
touch frontend/src/services/importExport.service.ts

# 2. 最小限の実装を書く（テストを通すだけ）
# - 例: exportSubscriptions()の仮実装

# 3. テストを実行してパスすることを確認
npm test importExport.service.test.ts
# → "PASS" と表示される（成功）
```

### Phase 3: Refactor（リファクタリング）

```bash
# 1. コードの品質を向上させる（テストは通ったまま）
# - 重複の排除
# - 意図の明確化
# - 変数名の改善

# 2. テストを実行して引き続きパスすることを確認
npm test importExport.service.test.ts
# → "PASS" と表示される（リファクタリング成功）
```

### コミット

```bash
# Red フェーズ
git add frontend/src/services/importExport.service.test.ts
git commit -m "test: exportSubscriptions のテストを追加（Red）"

# Green フェーズ
git add frontend/src/services/importExport.service.ts
git commit -m "feat: exportSubscriptions を実装（Green）"

# Refactor フェーズ
git add frontend/src/services/importExport.service.ts
git commit -m "refactor: exportSubscriptions の重複を排除（Refactor）"
```

---

## デバッグ方法

### ブラウザ開発者ツール

1. Chrome DevToolsを開く（F12 または Cmd+Option+I）
2. Consoleタブでログを確認
3. Sourcesタブでブレークポイントを設定

**例**:
```typescript
// コード内にブレークポイントを設定
function exportSubscriptions() {
  debugger; // ブラウザがここで停止
  const subscriptions = loadSubscriptions();
  // ...
}
```

### テストのデバッグ

```bash
# テストをデバッグモードで実行
npm test -- --inspect-brk importExport.service.test.ts

# Chrome でデバッグ
# 1. chrome://inspect にアクセス
# 2. "Inspect" をクリック
# 3. ブレークポイントを設定してステップ実行
```

### ログ出力

```typescript
// console.log でデバッグ
function importSubscriptions(file: File) {
  console.log('File size:', file.size);
  console.log('File type:', file.type);
  // ...
}
```

**注意**: 本番環境ではconsole.logを削除してください。

---

## 実装の順序（推奨）

### ステップ1: 型定義の追加

```bash
# ファイル: frontend/src/types/models.ts
# - ExportData型を追加
# - ImportResult型を追加
# - ImportValidationError型を追加
```

### ステップ2: エラーメッセージの追加

```bash
# ファイル: frontend/src/constants/errorMessages.ts
# - IMPORT_EXPORT_ERROR_MESSAGES を追加
```

### ステップ3: バリデーション関数の実装

```bash
# TDD で実装:
# 1. frontend/src/utils/importValidation.test.ts を作成（Red）
# 2. frontend/src/utils/importValidation.ts を実装（Green）
# 3. リファクタリング（Refactor）
```

### ステップ4: エクスポート機能の実装

```bash
# TDD で実装:
# 1. frontend/src/services/importExport.service.test.ts を作成（Red）
# 2. exportSubscriptions() を実装（Green）
# 3. リファクタリング（Refactor）
```

### ステップ5: インポート機能の実装

```bash
# TDD で実装:
# 1. importSubscriptions() のテストを追加（Red）
# 2. importSubscriptions() を実装（Green）
# 3. リファクタリング（Refactor）
```

### ステップ6: UIコンポーネントの実装

```bash
# TDD で実装:
# 1. frontend/src/components/FeedManager/ImportExportButtons.test.tsx を作成（Red）
# 2. ImportExportButtons.tsx を実装（Green）
# 3. リファクタリング（Refactor）
```

### ステップ7: インテグレーションテスト

```bash
# TDD で実装:
# 1. frontend/tests/integration/importExportFlow.test.tsx を作成（Red）
# 2. 必要に応じて調整（Green）
# 3. リファクタリング（Refactor）
```

---

## ファイル操作のテスト方法

### ファイルのモック作成

```typescript
// テスト用のモックファイルを作成
function createMockFile(content: string, filename = 'test.json'): File {
  const blob = new Blob([content], { type: 'application/json' });
  return new File([blob], filename, { type: 'application/json' });
}

// 使用例
const mockFile = createMockFile(JSON.stringify({ subscriptions: [] }));
```

### FileReaderのモック

```typescript
// Vitest でFileReaderをモック
vi.spyOn(window, 'FileReader').mockImplementation(() => {
  return {
    readAsText: vi.fn(),
    onload: null,
    onerror: null,
    result: JSON.stringify({ subscriptions: [] }),
  } as unknown as FileReader;
});
```

---

## トラブルシューティング

### 問題1: テストが失敗する

```bash
# エラーメッセージを確認
npm test -- --reporter=verbose

# 特定のテストのみ実行して原因を特定
npm test importExport.service.test.ts -- --reporter=verbose
```

### 問題2: ファイルダウンロードが動作しない

**原因**: ブラウザのダウンロード設定やポップアップブロック

**解決方法**:
1. ブラウザの設定でポップアップを許可
2. 開発者ツールのNetworkタブでダウンロードリクエストを確認

### 問題3: インポート時にJSONパースエラー

**原因**: 不正なJSON形式

**解決方法**:
```typescript
// デバッグログを追加
try {
  const data = JSON.parse(fileContent);
} catch (error) {
  console.error('JSON parse error:', error);
  console.log('File content:', fileContent); // 内容を確認
}
```

### 問題4: localStorageの容量不足

**原因**: ブラウザのlocalStorage制限（通常5MB）

**解決方法**:
```typescript
// ストレージ使用量を確認
const used = JSON.stringify(localStorage).length;
const maxSize = 5 * 1024 * 1024; // 5MB
console.log(`Storage used: ${used} / ${maxSize} bytes`);
```

---

## 便利なコマンド

### Lintとフォーマット

```bash
# ESLint でコードチェック
npm run lint

# Prettier でフォーマット
npm run format

# 自動修正
npm run lint -- --fix
```

### 型チェック

```bash
# TypeScript の型チェック
npx tsc --noEmit
```

### ビルド

```bash
# プロダクションビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

---

## リファレンス

### 重要なファイルパス

| ファイル | 説明 |
|---------|------|
| `frontend/src/types/models.ts` | 型定義 |
| `frontend/src/services/importExport.service.ts` | エクスポート/インポート処理 |
| `frontend/src/utils/importValidation.ts` | バリデーション関数 |
| `frontend/src/constants/errorMessages.ts` | エラーメッセージ定義 |
| `frontend/src/components/FeedManager/ImportExportButtons.tsx` | UIコンポーネント |

### 関連ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| [spec.md](./spec.md) | 機能仕様書 |
| [research.md](./research.md) | 技術調査結果 |
| [data-model.md](./data-model.md) | データモデル定義 |
| [contracts/importExport.contract.md](./contracts/importExport.contract.md) | API契約 |
| [plan.md](./plan.md) | 実装計画 |

### 外部リンク

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [TailwindCSS](https://tailwindcss.com/docs)
- [File API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/File)
- [FileReader API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)

---

## 次のステップ

1. `/speckit.tasks` コマンドを実行してタスクを自動生成
2. 生成されたタスクに従って実装を開始（TDDサイクルを遵守）
3. 各タスク完了後にコミット
4. 全タスク完了後にプルリクエストを作成

**開発を始める準備ができました！** 🚀
