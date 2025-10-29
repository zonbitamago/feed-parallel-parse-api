# Implementation Plan: FeedContainerのuseEffect依存配列修正

**Branch**: `010-fix-useeffect-deps` | **Date**: 2025-10-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/010-fix-useeffect-deps/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

FeedContainer.tsxのuseEffect依存配列から`subState.subscriptions`を削除し、`subState.subscriptions.length`のみを監視することで、タイトル更新時の不要なフィード再フェッチを防止します。この1行の修正により、購読の追加・削除時のみフィードを取得するという本来の意図通りの動作を実現します。

## Technical Context

**Language/Version**: TypeScript 5.9.3
**Primary Dependencies**: React 19.1.1, Vite 7.1.7
**Storage**: localStorage（ブラウザのクライアントサイドストレージ）
**Testing**: Vitest 4.0.3, @testing-library/react 16.3.0
**Target Platform**: モダンブラウザ（Chrome, Firefox, Safari, Edge最新版）
**Project Type**: Web（フロントエンドのみの修正）
**Performance Goals**: フィード取得APIリクエストを現状の2回以上から1回のみに削減
**Constraints**: 既存機能のリグレッションを発生させない、既存テストはすべて成功
**Scale/Scope**: 1ファイル（FeedContainer.tsx）、1行の修正

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### TDD（テスト駆動開発）の遵守

- [x] **Red-Green-Refactorサイクル**: この修正では以下の手順で進めます
  1. **Red**: タイトル更新時にフィード取得が発生しないことを検証するテストを追加（失敗を確認）
  2. **Green**: 依存配列から`subState.subscriptions`を削除してテストを通す
  3. **Refactor**: 必要に応じてコードの品質を向上（今回は1行の修正のため最小限）

- [x] **テストファースト**: 実装前に以下のテストケースを作成します
  - ページリロード時にフィード取得が1回のみ実行される
  - タイトル更新時にフィード取得が0回実行される
  - フィード追加時にフィード取得が1回実行される
  - 手動更新ボタンクリック時にフィード取得が1回実行される

### テストカバレッジ

- [x] **新規コード**: 修正部分は既存のuseEffectのため、既存テストでカバー済み
- [x] **カバレッジ維持**: 既存のすべてのテストが成功することを確認（SC-005）
- [x] **追加テスト**: タイトル更新時の非フェッチを検証する新規テストを追加

### TypeScript + React 品質基準

- [x] **型安全性**: 既存の型定義を変更しないため、型安全性は維持される
- [x] **Hooks Rules**: useEffectの依存配列を正しく設定することで、React Hooksのルールを遵守
- [x] **テスト可能性**: 修正により、テストがより明確になる（意図通りの動作を検証可能）

### シンプルさの原則（YAGNI）

- [x] **最小限の変更**: 1行の修正のみで問題を解決
- [x] **過剰設計の回避**: 新しいパターンや抽象化を導入せず、既存のコードを修正するのみ
- [x] **現在の要求を満たす**: 過剰リクエストの問題を解決する最小限の実装

### 憲法違反の有無

✅ **違反なし** - この修正はすべての憲法原則に準拠しています。

## Project Structure

### Documentation (this feature)

```text
specs/010-fix-useeffect-deps/
├── spec.md              # 機能仕様書
├── plan.md              # このファイル（実装計画）
└── checklists/
    └── requirements.md  # 仕様品質チェックリスト
```

**注記**: この修正は小規模なバグ修正のため、research.md、data-model.md、contracts/、quickstart.mdは不要です。

### Source Code (repository root)

```text
frontend/
├── src/
│   └── containers/
│       └── FeedContainer.tsx  # 修正対象ファイル（37行目の依存配列）
└── tests/
    └── integration/
        └── feedFlow.test.tsx  # 追加テストを含む既存テストファイル
```

**Structure Decision**: フロントエンドのみの修正です。`FeedContainer.tsx`の1行を修正し、既存の統合テストに新規テストケースを追加します。

## Phase 0: Research

**スキップ理由**: この修正は既存コードの1行を変更するバグ修正であり、新しい技術調査は不要です。問題の原因と解決策はspec.mdの「技術的な分析」セクションで既に明確化されています。

## Phase 1: Design & Contracts

**スキップ理由**: データモデルの変更なし、API契約の変更なし、新規エンティティなし。既存のSubscriptionおよびArticleエンティティをそのまま使用します。

## Implementation Tasks (Phase 2で詳細化)

この計画では概要のみを記載します。詳細なタスクは `/speckit.tasks` で生成されます。

### 1. テストの追加（Red）

- タイトル更新時にフィード取得が発生しないことを検証するテストを作成
- テストが失敗することを確認

### 2. 実装（Green）

- `frontend/src/containers/FeedContainer.tsx:37` の依存配列から `subState.subscriptions` を削除
- テストが成功することを確認

### 3. リファクタリング（Refactor）

- 必要に応じてコメントを更新
- コードレビュー

### 4. 既存テストの実行

- すべての既存テストが成功することを確認
- カバレッジが維持されていることを確認

## Complexity Tracking

**該当なし** - 憲法違反はありません。
