# Implementation Plan: 購読フィード一覧の折りたたみ機能

**Branch**: `010-improve-feed-article-access` | **Date**: 2025-10-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-improve-feed-article-access/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

購読フィード一覧が画面を占有し、記事がファーストビューから押し出される問題を解決するため、購読一覧の折りたたみ機能を実装します。デフォルトで折りたたまれた状態とし、ユーザーの選択を localStorage で永続化します。これにより、RSSリーダーの本来の目的である記事閲覧を最優先にしたUIを実現します。

## Technical Context

**Language/Version**: TypeScript 5.9.3
**Primary Dependencies**: React 19.1.1, TailwindCSS 4.x, localStorage (ブラウザAPI)
**Storage**: localStorage（折りたたみ状態の永続化）
**Testing**: Vitest 4.0.3, @testing-library/react 16.3.0
**Target Platform**: Web ブラウザ（モダンブラウザ対応）
**Project Type**: Web（フロントエンドのみ）
**Performance Goals**: 折りたたみ/展開アニメーション 1秒以内、ファーストビューでの記事表示
**Constraints**: 既存のUIContextとの整合性維持、localStorage容量制限（5MB）は問題なし
**Scale/Scope**: 既存のFeedManagerコンポーネント1つの改修、新規コンポーネント追加なし

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Test-Driven Development (TDD) 遵守

- [x] **テストファースト**: すべての実装前に失敗するテストを作成
- [x] **Red-Green-Refactor**: サイクルを厳守
- [x] **カバレッジ目標**: 新規コード100%カバレッジ

### 型安全性

- [x] **TypeScript strict mode**: `tsconfig.json` で有効化済み
- [x] **any型禁止**: `any`の使用なし
- [x] **Props型定義**: すべてのコンポーネントPropsに型定義

### テスト品質

- [x] **Vitest 4.0+**: 使用中
- [x] **@testing-library/react 16.0+**: 使用中
- [x] **テストピラミッド**: Unit Tests 70%, Integration Tests 20%, E2E Tests 10%

### シンプルさの原則（YAGNI）

- [x] **最小限の実装**: 現在の要求を満たす最小限の設計
- [x] **新規依存関係なし**: 既存ツール（React, TailwindCSS, localStorage）のみ使用
- [x] **過剰設計の回避**: 折りたたみ機能のみに焦点

### コードレビュー基準

- [ ] **テストコミットが先**: 実装コミットより前にテストコミット（実装時に確認）
- [ ] **カバレッジ100%**: 新規コードのカバレッジ（実装時に確認）
- [ ] **型チェックパス**: TypeScriptの型チェック（実装時に確認）
- [ ] **ESLint警告ゼロ**: リンターの警告なし（実装時に確認）

**Constitution Check Status**: ✅ 合格（設計段階での違反なし）

## Project Structure

### Documentation (this feature)

```text
specs/010-improve-feed-article-access/
├── spec.md              # 機能仕様書
├── plan.md              # このファイル（実装計画）
├── research.md          # Phase 0 出力（技術調査）
├── data-model.md        # Phase 1 出力（データモデル）
├── quickstart.md        # Phase 1 出力（クイックスタート）
├── contracts/           # Phase 1 出力（API契約）※今回はN/A
└── checklists/
    └── requirements.md  # 要件チェックリスト
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   └── FeedManager/
│   │       ├── FeedManager.tsx          # 【改修対象】折りたたみロジック追加
│   │       ├── FeedManager.test.tsx     # 【改修対象】テスト追加
│   │       ├── FeedSubscriptionItem.tsx # 既存（変更なし）
│   │       ├── FeedEditRow.tsx          # 既存（変更なし）
│   │       └── FeedDisplayRow.tsx       # 既存（変更なし）
│   ├── contexts/
│   │   ├── UIContext.tsx                # 【改修候補】折りたたみ状態管理
│   │   └── UIContext.test.tsx           # 【改修対象】テスト追加
│   ├── hooks/
│   │   └── useSubscriptionListCollapse.ts # 【新規】折りたたみロジックのカスタムフック
│   └── utils/
│       └── localStorage.ts              # 【既存活用】localStorage操作ヘルパー
└── tests/
    └── integration/
        └── subscriptionCollapseFlow.test.tsx # 【新規】統合テスト
```

**Structure Decision**:
- **Web application構造**を採用（フロントエンドのみ）
- 既存の`FeedManager`コンポーネントを改修し、折りたたみ機能を追加
- 新規カスタムフック`useSubscriptionListCollapse`でロジックを分離（テスタビリティ向上）
- UIContextに折りたたみ状態を追加する可能性あり（Phase 0研究で決定）
- localStorageの操作は既存のパターンに従う

## Complexity Tracking

> **憲法違反がないため、このセクションは不要です。**

N/A - 憲法チェックで違反なし

---

## Phase 0: Outline & Research ✅

**Status**: 完了

**成果物**: [research.md](./research.md)

**主要な決定事項**:

1. **localStorage統合**: `useLocalStorage<boolean>` + キー `rss_reader_subscriptions_collapsed`
2. **状態管理**: 新規カスタムフック `useSubscriptionListCollapse` で独立管理
3. **コンポーネント設計**: FeedManagerを直接改修（新規コンポーネント不要）
4. **アニメーション**: TailwindCSSの`transition`クラスのみ（新規依存なし）
5. **アクセシビリティ**: WAI-ARIA完全準拠
6. **テスト戦略**: TDDアプローチ + 3層テスト（Unit 70%, Integration 20%, E2E 10%）

**解決された技術的不確定要素**:
- ✅ localStorage使用パターン調査完了
- ✅ UIContext構造分析完了
- ✅ 既存カスタムフックパターン特定完了
- ✅ アニメーション実装方針決定
- ✅ パフォーマンス最適化方針決定

---

## Phase 1: Design & Contracts ✅

**Status**: 完了

**成果物**:
- [data-model.md](./data-model.md) - データモデル定義
- [quickstart.md](./quickstart.md) - 開発者向けクイックスタート
- contracts/ - N/A（フロントエンドのみで完結）

**データモデル概要**:
- **新規エンティティ**: `SubscriptionListCollapseState` (boolean)
- **ストレージ**: localStorage（キー: `rss_reader_subscriptions_collapsed`）
- **デフォルト値**: `true`（折りたたみ状態）
- **既存モデルへの影響**: なし

**Agent Context更新**:
- 実行予定: `.specify/scripts/bash/update-agent-context.sh claude`
- 追加する技術: なし（既存技術のみ使用）

---

## Phase 2: Implementation Tasks

**Status**: 未着手

**次のコマンド**: `/speckit.tasks`

このコマンドで以下が生成されます：
- `tasks.md` - 実装タスクのリスト（優先順位付き）
- TDDサイクルに従った詳細な実装手順
- 各タスクの受け入れ基準

**実装の準備完了**:
- ✅ すべての技術的不確定要素が解決済み
- ✅ 設計文書が完成
- ✅ テスト戦略が確立
- ✅ 憲法チェック合格

---

## Constitution Check (再確認)

**Phase 1完了後の再評価**: ✅ 合格

### 設計品質

- [x] **新規依存関係なし**: 既存のReact, TailwindCSS, localStorageのみ使用
- [x] **シンプルな設計**: カスタムフック1つ + コンポーネント改修のみ
- [x] **テスタビリティ**: 完全に単体テスト可能な設計
- [x] **型安全性**: TypeScript strict mode準拠

### 実装準備

- [x] **データモデル定義済み**: data-model.md完成
- [x] **開発環境整備済み**: quickstart.md完成
- [x] **パフォーマンス目標明確**: 300ms以内のアニメーション
- [x] **アクセシビリティ準拠**: WAI-ARIA完全実装

**結論**: 実装フェーズに進む準備が完了しました。

---

## 次のステップ

実装を開始するには、以下のコマンドを実行してください：

```bash
/speckit.tasks
```

これにより、優先順位付きのタスクリスト（`tasks.md`）が生成され、TDDサイクルに従った実装が開始できます。

**推奨される実装順序**:
1. Phase 1: カスタムフック実装（`useSubscriptionListCollapse`）
2. Phase 2: FeedManager改修（UI実装）
3. Phase 3: 統合テスト
4. Phase 4: E2Eテスト（オプション）

各フェーズでRed-Green-Refactorサイクルを厳守してください。
