# Data Model: 購読フィード0件時のインポート機能有効化

**Date**: 2025-11-04
**Feature**: 001-enable-import-zero-feeds
**Ref**: [plan.md](./plan.md) | [research.md](./research.md)

## Overview

このドキュメントは、購読フィード0件時のインポート機能有効化で使用するデータモデル（Props型定義、状態遷移）を定義します。

## Entities

### ImportExportButtonsProps

インポート/エクスポートボタンコンポーネントのProps型定義。

#### 型定義

```typescript
interface ImportExportButtonsProps {
  onExport: () => void       // エクスポートボタンのクリックハンドラ
  onImport: () => void       // インポートボタンのクリックハンドラ
  subscriptionCount: number  // 購読フィード数（新規追加）
}
```

#### フィールド詳細

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `onExport` | `() => void` | ✅ | - | エクスポートボタンがクリックされた際に実行される関数 |
| `onImport` | `() => void` | ✅ | - | インポートボタンがクリックされた際に実行される関数 |
| `subscriptionCount` | `number` | ✅ | - | 現在の購読フィード数。0以上の整数。エクスポートボタンの有効/無効を判定するために使用。 |

#### バリデーションルール

- `subscriptionCount` は0以上の整数
- 負の値は想定しない（`subscriptions.length` は常に0以上）
- TypeScriptの型システムで型安全性を確保

## State Transitions

### エクスポートボタンの状態遷移

```text
State: subscriptionCount = 0
  ├─ Button State: disabled
  ├─ Visual Feedback:
  │   ├─ opacity: 50%
  │   ├─ cursor: not-allowed
  │   └─ hover: なし
  └─ Accessibility:
      └─ disabled attribute: true

      ↓ (subscriptionCount が 1 に増加)

State: subscriptionCount >= 1
  ├─ Button State: enabled
  ├─ Visual Feedback:
  │   ├─ opacity: 100%
  │   ├─ cursor: pointer
  │   └─ hover: bg-blue-700
  └─ Accessibility:
      └─ disabled attribute: false
```

### インポートボタンの状態

```text
State: すべての subscriptionCount
  ├─ Button State: enabled（常に有効）
  ├─ Visual Feedback:
  │   ├─ opacity: 100%
  │   ├─ cursor: pointer
  │   └─ hover: bg-green-700
  └─ Accessibility:
      └─ disabled attribute: false
```

## Component Hierarchy

```text
FeedManager
  ├─ subscriptions: Subscription[]
  ├─ isCollapsed: boolean
  └─ ImportExportButtons
      ├─ subscriptionCount: subscriptions.length
      ├─ Export Button
      │   └─ disabled: subscriptionCount === 0
      └─ Import Button
          └─ disabled: false（常に有効）
```

## Data Flow

### Props の流れ

```text
1. FeedManager が subscriptions を管理
   ↓
2. subscriptions.length を計算
   ↓
3. ImportExportButtons に subscriptionCount として渡す
   ↓
4. ImportExportButtons がボタンの状態を決定
   - subscriptionCount === 0 → Export disabled
   - subscriptionCount >= 1 → Export enabled
```

### イベントの流れ

```text
1. ユーザーがボタンをクリック
   ↓
2. disabled 状態の場合はクリック無効（ブラウザがブロック）
   ↓
3. enabled 状態の場合は onExport / onImport が実行
   ↓
4. FeedManager の handleExport / handleImport が呼ばれる
   ↓
5. useImportExport フックが実際の処理を実行
   ↓
6. subscriptions が更新される
   ↓
7. subscriptionCount が再計算される
   ↓
8. ImportExportButtons が再レンダリングされる
```

## Edge Cases

### エッジケース1: 購読フィードが0件から1件に変わる瞬間

**状態**:
- 購読フィード数: 0件 → 1件
- エクスポートボタン: disabled → enabled

**期待される動作**:
- Reactの状態更新により、1秒以内にボタンが有効化される
- 視覚的フィードバック（opacity, cursor）が即座に更新される

**実装**:
```tsx
const subscriptionCount = subscriptions.length  // 状態が変わると自動的に再計算
```

### エッジケース2: インポート中にエラーが発生

**状態**:
- インポート処理中にエラー
- subscriptions は変更されない

**期待される動作**:
- エラーメッセージが表示される
- subscriptionCount は変わらない
- ボタンの状態は変わらない

**実装**:
- `useImportExport` フックでエラーハンドリング済み
- コンポーネント側は影響を受けない

### エッジケース3: インポートファイルに0件のフィードが含まれる

**状態**:
- インポート成功
- しかし、フィード数は0件のまま

**期待される動作**:
- エクスポートボタンは disabled のまま
- インポートボタンは enabled のまま

**実装**:
```tsx
const subscriptionCount = subscriptions.length  // 0件の場合でも正常に動作
```

## Relationships

### 既存コンポーネントとの関係

```text
FeedManager
  ├─ 状態管理: subscriptions
  ├─ イベントハンドラ: handleExport, handleImport
  └─ 表示制御: isCollapsed

useImportExport
  ├─ ビジネスロジック: エクスポート/インポート処理
  └─ エラーハンドリング

ImportExportButtons
  ├─ プレゼンテーション: ボタンの表示
  └─ 状態制御: disabled 属性、スタイル
```

## Validation Rules

### Props バリデーション

```typescript
// TypeScript の型システムで自動的にバリデーション
interface ImportExportButtonsProps {
  onExport: () => void       // 関数でなければコンパイルエラー
  onImport: () => void       // 関数でなければコンパイルエラー
  subscriptionCount: number  // 数値でなければコンパイルエラー
}
```

### ランタイムバリデーション

**不要**: TypeScriptの型システムで十分。追加のバリデーションは過剰設計となる。

## Migration Notes

### 既存コードからの変更点

#### Before（変更前）

```tsx
// FeedManager.tsx
{subscriptions.length > 0 && (
  <div className="mt-4">
    {!isCollapsed && (
      <div id="subscription-list" className="...">
        <ImportExportButtons onExport={handleExport} onImport={handleImport} />
      </div>
    )}
  </div>
)}
```

```tsx
// ImportExportButtons.tsx
interface ImportExportButtonsProps {
  onExport: () => void
  onImport: () => void
}

export function ImportExportButtons({ onExport, onImport }: ImportExportButtonsProps) {
  return (
    <div className="flex gap-2 mb-4">
      <button type="button" onClick={onExport} className="...">
        エクスポート
      </button>
      <button type="button" onClick={onImport} className="...">
        インポート
      </button>
    </div>
  )
}
```

#### After（変更後）

```tsx
// FeedManager.tsx
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

```tsx
// ImportExportButtons.tsx
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

## Conclusion

データモデルの定義が完了しました。次のステップは `quickstart.md` の作成です。

**主なエンティティ**:
- `ImportExportButtonsProps`: `subscriptionCount` を追加

**主な状態遷移**:
- 購読フィード数 0件 → エクスポートボタン無効化
- 購読フィード数 1件以上 → エクスポートボタン有効化
