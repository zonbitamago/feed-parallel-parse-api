# Research: 購読フィード0件時のインポート機能有効化

**Date**: 2025-11-04
**Feature**: 001-enable-import-zero-feeds
**Ref**: [plan.md](./plan.md)

## Overview

このドキュメントは、購読フィード0件時のインポート機能有効化に必要な技術調査の結果をまとめます。

## Research Areas

### 1. TailwindCSSでのdisabled状態のスタイリングベストプラクティス

#### 調査内容

TailwindCSS 4.x系でのdisabled状態のスタイリング方法を調査。

#### 決定事項

**選択したアプローチ**: `disabled:` バリアントと組み合わせたスタイリング

```tsx
<button
  disabled={subscriptionCount === 0}
  className={`
    px-4 py-2 bg-blue-600 text-white rounded-lg
    transition-colors
    ${subscriptionCount === 0
      ? 'opacity-50 cursor-not-allowed'
      : 'hover:bg-blue-700'
    }
  `}
>
  エクスポート
</button>
```

#### 理由

1. **視覚的フィードバック**: `opacity-50` で無効状態を明確に表現
2. **ユーザー体験**: `cursor-not-allowed` でクリック不可を直感的に伝える
3. **TailwindCSS標準**: Tailwind公式のベストプラクティスに準拠
4. **アクセシビリティ**: disabled属性と視覚的スタイルの両方を提供

#### 代替案と却下理由

- **代替案1**: `disabled:opacity-50 disabled:cursor-not-allowed` のバリアント使用
  - **却下理由**: 条件分岐が必要な場合、className内での条件式の方が可読性が高い

- **代替案2**: 完全にグレーアウト（`bg-gray-400`）
  - **却下理由**: ブランドカラー（青）を維持し、一貫性を保つため

### 2. React + TypeScriptでのaria-disabled属性の実装

#### 調査内容

`disabled` 属性と `aria-disabled` 属性の使い分け、スクリーンリーダー対応を調査。

#### 決定事項

**選択したアプローチ**: `disabled` 属性を使用し、`aria-disabled` は不要

```tsx
<button
  type="button"
  disabled={subscriptionCount === 0}
  onClick={onExport}
  className={/* ... */}
>
  エクスポート
</button>
```

#### 理由

1. **標準準拠**: HTML標準の `disabled` 属性で十分
2. **スクリーンリーダー対応**: `disabled` 属性はスクリーンリーダーで自動的に「無効」と読み上げられる
3. **キーボード操作**: `disabled` 属性により、Tabキーでフォーカスできなくなる（期待される動作）
4. **シンプル性**: 追加の `aria-disabled` 属性は冗長

#### 代替案と却下理由

- **代替案1**: `aria-disabled="true"` のみ使用
  - **却下理由**: `disabled` 属性なしだとキーボード操作で誤ってクリックできてしまう

- **代替案2**: `disabled` と `aria-disabled` の両方を使用
  - **却下理由**: 冗長。`disabled` 属性で十分

#### 参考資料

- [MDN - disabled attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled)
- [WCAG 2.1 - 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html)

### 3. @testing-library/reactでのdisabled状態のテスト

#### 調査内容

Vitest + @testing-library/react でのdisabled状態のテスト方法を調査。

#### 決定事項

**選択したアプローチ**: `toBeDisabled()` マッチャーとクラス検証の組み合わせ

```tsx
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
```

#### 理由

1. **toBeDisabled()**: disabled属性の検証に最適
2. **toHaveClass()**: TailwindCSSクラスの検証に対応
3. **AAA パターン**: Arrange-Act-Assert パターンに従い、可読性を確保
4. **役割ベース**: `getByRole('button')` でアクセシビリティを重視

#### 代替案と却下理由

- **代替案1**: `toHaveAttribute('disabled')` のみ使用
  - **却下理由**: `toBeDisabled()` の方が意図が明確

- **代替案2**: スタイルの検証をスキップ
  - **却下理由**: 視覚的フィードバックも仕様の一部なので検証が必要

#### 参考資料

- [@testing-library/react - toBeDisabled](https://testing-library.com/docs/queries/byrole/)
- [@testing-library/jest-dom - Custom matchers](https://github.com/testing-library/jest-dom#custom-matchers)

## Data Requirements

### Props型定義

```typescript
interface ImportExportButtonsProps {
  onExport: () => void
  onImport: () => void
  subscriptionCount: number  // 新規追加
}
```

### 状態遷移

```text
購読フィード数: 0件
  ├─ インポートボタン: 有効（enabled）
  └─ エクスポートボタン: 無効（disabled）
      ├─ opacity-50
      └─ cursor-not-allowed

購読フィード数: 1件以上
  ├─ インポートボタン: 有効（enabled）
  └─ エクスポートボタン: 有効（enabled）
      └─ hover:bg-blue-700
```

## Integration Points

### 既存コンポーネントとの連携

1. **FeedManager.tsx**:
   - `subscriptions.length` を `ImportExportButtons` に渡す
   - 表示条件 `subscriptions.length > 0` を削除
   - リスト展開時（`!isCollapsed`）の条件は維持

2. **useImportExport.ts**:
   - 変更なし（ビジネスロジック層は0件でも動作する）

3. **importExport.service.ts**:
   - 変更なし（既に0件のエクスポートに対応済み）

## Performance Considerations

### パフォーマンス目標

- **ボタン状態の即時反映**: 購読フィード数が変わった際、1秒以内にボタンの状態を更新
- **レンダリング最適化**: `subscriptionCount` の変更時のみ再レンダリング

### 実装方針

```tsx
// FeedManager.tsx
const subscriptionCount = subscriptions.length

return (
  <div className="...">
    {!isCollapsed && (
      <div id="subscription-list" className="...">
        <ImportExportButtons
          onExport={handleExport}
          onImport={handleImport}
          subscriptionCount={subscriptionCount}  // propsとして渡す
        />
      </div>
    )}
  </div>
)
```

## Security Considerations

### セキュリティリスク

**なし**: このフィーチャーはUI変更のみで、セキュリティリスクは存在しない。

### バリデーション

- `subscriptionCount` は `number` 型で型安全性を確保
- 負の値は想定しない（`subscriptions.length` は常に0以上）

## Dependencies

### 新規依存関係

**なし**: 既存のライブラリ（React, TailwindCSS, @testing-library/react）のみで実装可能。

### 既存依存関係

- **React 19.1.1**: Hooks、コンポーネント
- **TailwindCSS 4.1.16**: スタイリング
- **@testing-library/react 16.3.0**: テスト
- **Vitest 4.0.3**: テストランナー

## Conclusion

すべての技術調査が完了し、実装方針が確定しました。次のフェーズ（Phase 1: Design & Contracts）へ進む準備が整いました。

**主な決定事項**:
1. TailwindCSS の `disabled:` バリアント + 条件付きクラスでスタイリング
2. `disabled` 属性のみ使用（`aria-disabled` は不要）
3. `toBeDisabled()` + `toHaveClass()` でテスト

**新規依存関係**: なし

**次のステップ**: data-model.md, quickstart.md の生成
