# Implementation Plan: コードベース全体のリファクタリング

**Branch**: `015-codebase-refactoring` | **Date**: 2025-11-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/015-codebase-refactoring/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

コードベース全体の品質向上、保守性改善、パフォーマンス最適化を目的としたリファクタリングを実施する。対象は14箇所（優先度「高」5箇所、「中」7箇所、「低」2箇所）で、フロントエンド（TypeScript/React）とバックエンド（Go）の両方を含む。

**技術的アプローチ**:
- フェーズ1（P1）: API層のエラーハンドリング改善と状態管理の簡素化
- フェーズ2（P2）: useEffectのカスタムフック化とパフォーマンス最適化
- フェーズ3（P3）: バックエンド設定の柔軟化とコード品質向上
- 各フェーズ後にテスト実行（`npm test`, `go test`）で既存機能の動作を保証

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5.9.3 + React 19.1.1
- Backend: Go 1.25.1

**Primary Dependencies**:
- Frontend: Vite 7.1.7（ビルド）, Vitest 4.0.3（テスト）, @testing-library/react 16.3.0（テスト）, TailwindCSS 4.x（スタイル）, date-fns 4.x（日付処理）
- Backend: 標準ライブラリ（net/http, encoding/json）, github.com/mmcdole/gofeed（RSSパース）

**Storage**: localStorage（フロントエンド）, ファイルシステム（バックエンドログ）

**Testing**:
- Frontend: Vitest 4.0.3 + @testing-library/react 16.3.0
- Backend: Go標準テストパッケージ（`go test`）

**Target Platform**:
- Frontend: ブラウザ（PWA対応）
- Backend: Vercel Serverless Functions

**Project Type**: Web（frontend/ + backend/）

**Performance Goals**:
- 検索バーのdebounce機能による不要なAPI呼び出しゼロ化
- FeedContainer.tsxのuseEffectを8個→1個のカスタムフックに集約し、可読性40%向上（行数ベース）
- API層のコード重複約70行削減

**Constraints**:
- 既存機能の動作保証（破壊的変更なし）
- 全テストケース（npm test, go test）が引き続きパス
- コードカバレッジが現状と同等以上（減少しない）

**Scale/Scope**:
- 14箇所のリファクタリング対象
- フロントエンド: 8ファイル（feedAPI.ts, ArticleContext.tsx, FeedContainer.tsx, useFeedPreview.ts, FeedManager.tsx, SearchBar.tsx, useFeedAPI.ts, errorMessages.ts）
- バックエンド: 1ファイル（cmd/server/main.go）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Constitution Compliance: ✅ PASS

このリファクタリングは以下の憲法原則に準拠しています：

#### I. Test-Driven Development (t-wada Style) - 遵守

- **テストファースト**: 既存の test が既に存在し、リファクタリング後も全てパスすることを保証する
- **Red-Green-Refactor**: このリファクタリングは「Refactor」フェーズに相当
  - Red: 既存のテストが既に存在（失敗していない）
  - Green: 既存のコードが既にテストをパス
  - **Refactor**: コードの品質を向上させる（今回の作業）
- **小さく確実に進む**: 6つのユーザーストーリー（P1, P1, P2, P2, P3, P3）に分割し、各フェーズでテスト実行

#### II. テストカバレッジと品質基準 - 遵守

- **カバレッジ維持**: リファクタリング後のコードカバレッジが現状と同等以上（減少しない）を保証（SC-006）
- **テスト実行**: 各フェーズ完了後に `npm test` と `go test` を実行（FR-014）
- **既存機能保証**: リファクタリング後も既存機能の動作が保証される（FR-015, SC-005）

#### III. TypeScript + React の品質基準 - 遵守

- **型安全性向上**: FeedAPIErrorをAbortError専用クラスで拡張し、キャンセル原因を型安全に判定（FR-003）
- **エラー種別の明確化**: timeout、network、parseをenumで定義（FR-001）
- **コンポーネント設計改善**: カスタムフック useFeedSync() に集約し、単一責任原則を強化（FR-006）

#### V. シンプルさの原則（YAGNI） - 遵守

- **過剰設計の排除**: 複雑なuseEffect（8個）をカスタムフックに集約（FR-006）
- **必要最小限の設計**: 現在の要求（コード品質向上）を満たす最小限のリファクタリング
- **リファクタリングで進化**: 既存コードを改善し、将来の拡張性を高める

### Gate Check: ✅ PASS (No violations)

リファクタリングは既存の構造を改善するものであり、新しい複雑性を導入しません。TDDサイクルの「Refactor」フェーズとして正当化されます。

## Project Structure

### Documentation (this feature)

```text
specs/015-codebase-refactoring/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (in progress)
├── research.md          # Phase 0 output (will be created)
├── checklists/
│   └── requirements.md  # Quality checklist (completed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

**Note**: data-model.md, quickstart.md, contracts/ は不要（このリファクタリングはデータモデルやAPI契約の変更を伴わない）

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   ├── FeedManager/        # FR-008: useMemo依存配列最適化
│   │   │   └── FeedManager.tsx
│   │   ├── SearchBar/          # FR-007: debounce実装改善
│   │   │   └── SearchBar.tsx
│   │   └── ArticleList/
│   ├── containers/
│   │   └── FeedContainer.tsx   # FR-006: useEffect集約（useFeedSync()）
│   ├── contexts/
│   │   └── ArticleContext.tsx  # FR-005: filterArticles()一元化
│   ├── hooks/
│   │   ├── useFeedAPI.ts       # FR-011: 関数分離（findMatchingFeed, transformArticles）
│   │   ├── useFeedPreview.ts   # FR-004: 状態管理一元化
│   │   └── useFeedSync.ts      # FR-006: 新規カスタムフック（作成予定）
│   ├── services/
│   │   ├── feedAPI.ts          # FR-001, FR-002, FR-003: API層リファクタリング
│   │   └── feedAPIUtils.ts     # FR-002: 共通ユーティリティ（作成予定）
│   └── constants/
│       └── errorMessages.ts    # FR-012: エラーメッセージ一元管理
└── __tests__/
    └── (既存のテストケース)

cmd/server/
└── main.go                      # FR-009, FR-010: logger設計改善、CORS環境変数化

pkg/
└── (既存のパッケージ - 変更なし)

tests/
└── (既存のテストケース)
```

**Structure Decision**: Web application（frontend/ + backend/）。既存の構造を維持し、リファクタリング対象ファイルのみを変更。新規ファイルは最小限（useFeedSync.ts, feedAPIUtils.ts）のみ作成。

## Complexity Tracking

**該当なし**: このリファクタリングは既存の構造を改善するものであり、新しい複雑性を導入しません。Constitution Checkに違反はありません。
