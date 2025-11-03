# Implementation Plan: 購読フィード0件時のインポート機能有効化

**Branch**: `001-enable-import-zero-feeds` | **Date**: 2025-11-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-enable-import-zero-feeds/spec.md`

## Summary

購読フィード0件の状態でインポート機能を利用可能にし、エクスポート機能は適切に無効化する。現在の実装では `subscriptions.length > 0` の条件によりインポート/エクスポートボタン全体が非表示となっているが、インポートボタンは0件時こそ必要（初期フィード登録のため）。エクスポートボタンは0件時に無効化（disabled）し、視覚的フィードバックとアクセシビリティ対応を提供する。

**技術アプローチ**: 既存の `ImportExportButtons` コンポーネントに `subscriptionCount` プロップを追加し、`FeedManager` の表示条件を変更。エクスポートボタンに disabled 属性と視覚的スタイル（opacity-50, cursor-not-allowed）、aria-disabled 属性を追加。

## Technical Context

**Language/Version**: TypeScript 5.9.3
**Primary Dependencies**: React 19.1.1, TailwindCSS 4.1.16
**Storage**: localStorage（フィード購読データ）
**Testing**: Vitest 4.0.3, @testing-library/react 16.3.0
**Target Platform**: Web（モダンブラウザ、PWA対応）
**Project Type**: Web application（frontend + backend分離）
**Performance Goals**: ボタン状態の即時反映（1秒以内）、インポート処理5秒以内
**Constraints**: 既存機能への影響なし、リスト折りたたみ時の非表示を維持
**Scale/Scope**: 2つのコンポーネント修正、4つのテストファイル更新

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Test-Driven Development (TDD) - 遵守

- **Red-Green-Refactor サイクル**: この機能は既存機能の改善であり、TDDサイクルを遵守
  - Red: 既存テストを0件時のシナリオに拡張して失敗を確認
  - Green: 最小限の実装でテストを通す
  - Refactor: コードの品質を向上
- **テストファースト**: 実装前にテストを追加
- **ベイビーステップ**: コンポーネント修正 → テスト追加 → リファクタリングの小さいサイクル

### ✅ テストカバレッジと品質基準 - 遵守

- **新規コード100%カバレッジ**: 新規追加のprops、条件分岐、スタイルをすべてテスト
- **既存コード変更100%カバー**: 変更部分（表示条件、disabled属性）をテスト
- **テストピラミッド**:
  - 単体テスト: `ImportExportButtons.test.tsx`, `FeedManager.test.tsx`（既存）
  - 統合テスト: 不要（UIコンポーネントの状態変更のみ）
  - E2Eテスト: 不要（クリティカルパスに影響なし）

### ✅ TypeScript + React の品質基準 - 遵守

- **any禁止**: `subscriptionCount: number` で型安全性を確保
- **Props型定義**: `ImportExportButtonsProps` に `subscriptionCount` を追加
- **単一責任**: `ImportExportButtons` は表示のみ、状態管理は `FeedManager`
- **Pure Components**: `ImportExportButtons` は純粋関数コンポーネント

### ✅ テスト実行ルール（CPU負荷対策） - 遵守

- **watchモード禁止**: `npm test` で1回限りの実行
- **選択的テスト実行**: `npm test ImportExportButtons.test.tsx` で個別実行

### ✅ シンプルさの原則（YAGNI） - 遵守

- **必要最小限の変更**: props追加とdisabled属性のみ、新規ライブラリ不要
- **過剰設計の禁止**: 現在の要求（0件時のインポート有効化）のみを実装

### 結論

**すべての憲法チェックに合格。Phase 0（研究）に進む。**

## Project Structure

### Documentation (this feature)

```text
specs/001-enable-import-zero-feeds/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   └── FeedManager/
│   │       ├── FeedManager.tsx              # 修正: 表示条件変更、subscriptionCount追加
│   │       ├── ImportExportButtons.tsx      # 修正: props追加、disabled対応
│   │       └── __tests__/
│   │           ├── FeedManager.test.tsx     # 更新: 0件時のテストケース追加
│   │           └── ImportExportButtons.test.tsx  # 更新: disabled状態のテスト追加
│   ├── hooks/
│   │   └── useImportExport.ts               # 変更なし（ビジネスロジック層）
│   └── services/
│       └── importExport.service.ts          # 変更なし（既に0件対応済み）
└── tests/                                    # 変更なし
```

**Structure Decision**: Web applicationプロジェクト構造を採用。フロントエンド（frontend/）のみを修正し、バックエンドへの影響はなし。UIコンポーネントとそのテストファイルのみを変更する。

## Complexity Tracking

> **憲法違反がないため、このセクションは空欄。**

## Phase 0: Outline & Research

### Research Tasks

このフェーズでは、以下の技術的な不明点を調査します：

1. **TailwindCSSでのdisabled状態のスタイリングベストプラクティス**
   - 透明度50%（`opacity-50`）とカーソル変更（`cursor-not-allowed`）の組み合わせ
   - ホバー状態との組み合わせ（`disabled:opacity-50`）
   - フォーカス状態の無効化（`disabled:cursor-not-allowed`）

2. **React + TypeScriptでのaria-disabled属性の実装**
   - `aria-disabled="true"` vs `disabled` 属性の使い分け
   - スクリーンリーダーでの読み上げ確認方法
   - キーボード操作との組み合わせ

3. **@testing-library/reactでのdisabled状態のテスト**
   - `toBeDisabled()` マッチャーの使用方法
   - `aria-disabled` 属性の検証方法
   - スタイルクラスの検証方法（`toHaveClass('opacity-50')`）

### Research Output: research.md

次のステップで `research.md` を生成し、上記の調査結果を記録します。

## Phase 1: Design & Contracts

### Data Model

このフェーズでは、以下のデータモデルを定義します：

**エンティティ**:
- `ImportExportButtonsProps`: `subscriptionCount: number` を追加

**状態遷移**:
- 購読フィード数 0件 → エクスポートボタン無効化
- 購読フィード数 1件以上 → エクスポートボタン有効化

### API Contracts

このフィーチャーはUI変更のみのため、API契約は不要。

### Agent Context Update

Phase 1完了後、`.specify/scripts/bash/update-agent-context.sh claude` を実行し、CLAUDE.mdを更新。

### Design Output

次のステップで以下のファイルを生成します：
- `data-model.md`: Props型定義と状態遷移
- `quickstart.md`: 開発者向けクイックスタートガイド

## Phase 2: Task Generation

このフェーズは `/speckit.tasks` コマンドで実行されます（本コマンドの範囲外）。

## Next Steps

1. Phase 0: `research.md` 生成（技術調査）
2. Phase 1: `data-model.md`, `quickstart.md` 生成、Agent Context更新
3. Constitution Check再評価
4. `/speckit.tasks` コマンドで tasks.md 生成へ移行
