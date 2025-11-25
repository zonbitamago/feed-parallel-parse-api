# Implementation Plan: 記事表示時のローディング表示抑制

**Branch**: `018-fix-loading-display` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-fix-loading-display/spec.md`

## Summary

自動更新（ポーリング）実行時にローディングアイコンが表示されて既存の記事が読めなくなる問題を修正する。記事が0件かつ読み込み中の場合のみローディングアイコンを表示し、記事が1件以上ある場合は読み込み中でも記事一覧を表示し続ける。

**技術的アプローチ**: `ArticleContainer.tsx`のローディング表示条件を、`isLoading`のみの判定から`isLoading && articles.length === 0`の複合条件に変更する。

## Technical Context

**Language/Version**: TypeScript 5.9.3
**Primary Dependencies**: React 19.1.1, Vitest 4.0.3, @testing-library/react 16.3.0
**Storage**: N/A（既存のArticleContext状態を使用）
**Testing**: Vitest + React Testing Library
**Target Platform**: Web（モバイル・デスクトップ対応）
**Project Type**: Web application（frontend）
**Performance Goals**: N/A（UIの条件分岐変更のみ）
**Constraints**: 既存の記事表示機能に影響を与えない
**Scale/Scope**: 1ファイル変更 + テスト追加

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| TDD必須 | ✅ PASS | テストファーストで実装する |
| 型安全性（any禁止） | ✅ PASS | 既存の型定義を使用 |
| 単一責任 | ✅ PASS | ArticleContainerの表示ロジックのみ変更 |
| YAGNI | ✅ PASS | 最小限の変更で要件を満たす |
| テストカバレッジ | ✅ PASS | 新規コード100%カバー |

**Constitution準拠**: 全ゲートパス。TDDサイクルに従い、テストファーストで実装する。

## Project Structure

### Documentation (this feature)

```text
specs/018-fix-loading-display/
├── spec.md              # 機能仕様書
├── plan.md              # この実装計画
├── research.md          # Phase 0 リサーチ結果
├── quickstart.md        # Phase 1 クイックスタート
├── checklists/          # 品質チェックリスト
│   └── requirements.md
└── tasks.md             # Phase 2 タスク一覧（/speckit.tasksで生成）
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── containers/
│   │   ├── ArticleContainer.tsx      # 変更対象
│   │   └── ArticleContainer.test.tsx # テスト追加対象
│   ├── components/
│   │   └── LoadingIndicator/         # 参照のみ（変更なし）
│   └── contexts/
│       └── ArticleContext.tsx        # 参照のみ（変更なし）
└── tests/
```

**Structure Decision**: 既存のフロントエンド構造を維持。`ArticleContainer.tsx`の条件分岐を1行変更するのみ。

## Complexity Tracking

> 違反なし。シンプルな条件分岐変更のため、複雑性トラッキング不要。
