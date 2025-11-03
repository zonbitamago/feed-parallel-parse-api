# Quickstart: 購読フィード0件時のインポート機能有効化

**Date**: 2025-11-04
**Feature**: 001-enable-import-zero-feeds
**Branch**: `001-enable-import-zero-feeds`

## Overview

このガイドでは、購読フィード0件時のインポート機能有効化の実装を開始するための手順を説明します。

## Prerequisites

### 環境要件

- Node.js 18+
- npm または yarn
- Git

### 既存の知識

- TypeScript
- React 19
- TailwindCSS 4
- Vitest + @testing-library/react

## Setup

### 1. ブランチのチェックアウト

```bash
git checkout 001-enable-import-zero-feeds
```

### 2. 依存関係のインストール

```bash
cd frontend
npm install
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開き、アプリケーションが起動することを確認します。

## Development Workflow

### TDDサイクル（重要）

このプロジェクトはTDD（テスト駆動開発）を採用しています。実装前に必ずテストを書いてください。

```text
1. Red: 失敗するテストを書く
   ↓
2. Green: 最小限の実装でテストを通す
   ↓
3. Refactor: コードの品質を向上
   ↓
4. Commit: 各フェーズでコミット
```

### テストの実行

```bash
# すべてのテストを実行（推奨）
npm test

# 特定のテストファイルのみ実行
npm test ImportExportButtons.test.tsx

# watchモード（CPU負荷に注意）
npm run test:watch
```

**注意**: watchモードは開発中のCPU負荷が高いため、必要な時のみ使用してください。

## File Structure

### 修正対象ファイル

```text
frontend/src/components/FeedManager/
├── FeedManager.tsx                     # 表示条件変更、subscriptionCount追加
├── ImportExportButtons.tsx             # props追加、disabled対応
└── __tests__/
    ├── FeedManager.test.tsx            # 0件時のテストケース追加
    └── ImportExportButtons.test.tsx    # disabled状態のテスト追加
```

### 変更不要ファイル

```text
frontend/src/hooks/
└── useImportExport.ts                  # ビジネスロジック層（変更なし）

frontend/src/services/
└── importExport.service.ts             # 既に0件対応済み（変更なし）
```

## Implementation Steps

### Step 1: テストの追加（Red）

#### 1.1 ImportExportButtons のテスト追加

`frontend/src/components/FeedManager/__tests__/ImportExportButtons.test.tsx` に以下のテストを追加：

```typescript
it('購読フィード0件時にエクスポートボタンが無効化される', () => {
  // Arrange: 準備
  const onExport = vi.fn()
  const onImport = vi.fn()
  const subscriptionCount = 0

  // Act: 実行
  render(
    <ImportExportButtons
      onExport={onExport}
      onImport={onImport}
      subscriptionCount={subscriptionCount}
    />
  )

  // Assert: 検証
  const exportButton = screen.getByRole('button', { name: 'エクスポート' })
  expect(exportButton).toBeDisabled()
  expect(exportButton).toHaveClass('opacity-50')
  expect(exportButton).toHaveClass('cursor-not-allowed')
})

it('購読フィード1件以上の時にエクスポートボタンが有効化される', () => {
  // Arrange: 準備
  const onExport = vi.fn()
  const onImport = vi.fn()
  const subscriptionCount = 1

  // Act: 実行
  render(
    <ImportExportButtons
      onExport={onExport}
      onImport={onImport}
      subscriptionCount={subscriptionCount}
    />
  )

  // Assert: 検証
  const exportButton = screen.getByRole('button', { name: 'エクスポート' })
  expect(exportButton).not.toBeDisabled()
  expect(exportButton).toHaveClass('hover:bg-blue-700')
})
```

#### 1.2 テストを実行して失敗を確認

```bash
npm test ImportExportButtons.test.tsx
```

**期待される結果**: テストが失敗する（Redフェーズ）

### Step 2: 実装（Green）

#### 2.1 ImportExportButtons の修正

`frontend/src/components/FeedManager/ImportExportButtons.tsx` を修正：

```typescript
interface ImportExportButtonsProps {
  onExport: () => void
  onImport: () => void
  subscriptionCount: number  // 新規追加
}

export function ImportExportButtons({ onExport, onImport, subscriptionCount }: ImportExportButtonsProps) {
  return (
    <div className="flex gap-2 mb-4">
      <button
        type="button"
        onClick={onExport}
        disabled={subscriptionCount === 0}
        className={`
          px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors
          ${subscriptionCount === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}
        `}
      >
        エクスポート
      </button>
      <button
        type="button"
        onClick={onImport}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        インポート
      </button>
    </div>
  )
}
```

#### 2.2 FeedManager の修正

`frontend/src/components/FeedManager/FeedManager.tsx` を修正：

```typescript
// 変更前
{subscriptions.length > 0 && (
  <div className="mt-4">
    {!isCollapsed && (
      <div id="subscription-list" className="...">
        <ImportExportButtons onExport={handleExport} onImport={handleImport} />
      </div>
    )}
  </div>
)}

// 変更後
{!isCollapsed && (
  <div id="subscription-list" className="...">
    <ImportExportButtons
      onExport={handleExport}
      onImport={handleImport}
      subscriptionCount={subscriptions.length}
    />
  </div>
)}
```

#### 2.3 テストを実行して成功を確認

```bash
npm test ImportExportButtons.test.tsx
```

**期待される結果**: テストが成功する（Greenフェーズ）

### Step 3: リファクタリング（Refactor）

#### 3.1 コードレビュー

- className の可読性を確認
- 型定義の一貫性を確認
- テストコードの3Aパターン（Arrange-Act-Assert）を確認

#### 3.2 テストを再実行

```bash
npm test
```

**期待される結果**: すべてのテストが成功する

### Step 4: FeedManager のテスト追加

`frontend/src/components/FeedManager/__tests__/FeedManager.test.tsx` に0件時のテストを追加：

```typescript
it('購読フィード0件時にインポートボタンが表示される', () => {
  // Arrange: 準備
  renderFeedManager({ initialSubscriptions: [] })

  // Act: 実行
  const importButton = screen.getByRole('button', { name: 'インポート' })

  // Assert: 検証
  expect(importButton).toBeInTheDocument()
  expect(importButton).not.toBeDisabled()
})

it('購読フィード0件時にエクスポートボタンが無効化される', () => {
  // Arrange: 準備
  renderFeedManager({ initialSubscriptions: [] })

  // Act: 実行
  const exportButton = screen.getByRole('button', { name: 'エクスポート' })

  // Assert: 検証
  expect(exportButton).toBeInTheDocument()
  expect(exportButton).toBeDisabled()
})
```

## Testing Guidelines

### AAA パターン（必須）

すべてのテストケースは3Aパターンに従ってください：

```typescript
it('テストケースの説明', () => {
  // Arrange: 準備
  // テストに必要なデータやモックをセットアップ

  // Act: 実行
  // テスト対象の関数やメソッドを実行

  // Assert: 検証
  // 期待する結果と実際の結果を検証
})
```

### テストカバレッジ

```bash
# カバレッジレポートを生成
npm test -- --coverage
```

**目標**: 新規コード100%カバレッジ

## Common Issues

### Issue 1: TypeScript エラー

**エラー**:
```
Property 'subscriptionCount' is missing in type 'ImportExportButtonsProps'
```

**解決方法**:
`ImportExportButtonsProps` に `subscriptionCount: number` を追加してください。

### Issue 2: テストが失敗する

**エラー**:
```
TestingLibraryElementError: Unable to find an element with the role "button" and name "エクスポート"
```

**解決方法**:
ボタンのテキストが正しいか確認してください。`screen.debug()` で DOM を確認できます。

### Issue 3: スタイルクラスが適用されない

**エラー**:
```
expect(element).toHaveClass('opacity-50') // false
```

**解決方法**:
TailwindCSS のクラス名が正しいか確認してください。条件分岐のロジックを確認してください。

## Next Steps

1. ✅ テストの追加（Red）
2. ✅ 実装（Green）
3. ✅ リファクタリング（Refactor）
4. 🔄 コードレビュー
5. 🔄 PR作成

## Resources

### ドキュメント

- [spec.md](./spec.md) - 機能仕様
- [plan.md](./plan.md) - 実装計画
- [research.md](./research.md) - 技術調査
- [data-model.md](./data-model.md) - データモデル

### 参考資料

- [TailwindCSS Disabled Variant](https://tailwindcss.com/docs/hover-focus-and-other-states#disabled)
- [React Testing Library - toBeDisabled](https://testing-library.com/docs/queries/byrole/)
- [WCAG 2.1 - Disabled State](https://www.w3.org/WAI/WCAG21/Understanding/)

## Support

質問や問題がある場合は、以下を参照してください：

- プロジェクトの [CLAUDE.md](../../../CLAUDE.md) でガイドラインを確認
- [constitution.md](../../../.specify/memory/constitution.md) でTDD原則を確認
- GitHubのissueを作成
