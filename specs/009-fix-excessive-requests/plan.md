# Implementation Plan: フィード登録時のタイトル保存による過剰リクエスト削減

**Branch**: `009-fix-excessive-requests` | **Date**: 2025-10-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/009-fix-excessive-requests/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

RSSフィード購読時の過剰なAPIリクエストを削減するため、フィード登録時にタイトルを一度だけ取得してlocalStorageに永続化します。以降のアプリケーションロード時はlocalStorageから読み込むのみとし、タイトル取得APIリクエストを完全に排除します。これにより、10個のフィード登録時のロード時間が5-10秒から100ミリ秒以内に短縮されます。

## Technical Context

**Language/Version**: TypeScript 5.9.3 + React 19.1.1
**Primary Dependencies**: Vite 7.1.7（ビルド）, date-fns 4.x（日付処理）, TailwindCSS 4.x（スタイリング）
**Storage**: localStorage（ブラウザのクライアントサイドストレージ）
**Testing**: Vitest 4.0.3 + @testing-library/react 16.3.0
**Target Platform**: モダンブラウザ（Chrome, Firefox, Safari, Edge最新版）
**Project Type**: web（フロントエンドのみの修正、バックエンドAPIは既存のものを使用）
**Performance Goals**:
- アプリケーションロード時のタイトル表示: 100ミリ秒以内
- フィード登録時のタイトル取得: 10秒以内（タイムアウト）
- APIリクエスト数: ロード時0回、登録時1回のみ

**Constraints**:
- localStorage容量制限（通常5-10MB）
- 既存のSubscription型との後方互換性維持
- 既存のカスタムタイトル編集機能を維持
- 既存のフィード記事取得ロジックに影響を与えない

**Scale/Scope**:
- 想定フィード数: 10-50個程度
- 対象ファイル: 5-7ファイル（frontend/src配下）
- 新規コード: 約200-300行（テスト含む）
- 既存コード変更: 約100-150行

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Test-Driven Development (t-wada Style)

- [ ] **テストファースト**: すべての実装前に失敗するテストを書く
- [ ] **Red-Green-Refactor**: Red（失敗）→ Green（成功）→ Refactor（改善）サイクルを厳守
- [ ] **TODOリスト**: 実装タスクを小さく分割し、5-10分のサイクルで進める
- [ ] **テストの品質**: 高速（1秒以内）、独立、反復可能、自己検証

**Status**: ✅ PASS - TDD原則に従った実装計画

### II. テストカバレッジと品質基準

- [ ] **新規コード100%カバレッジ**: すべての新規コードにテストを書く
- [ ] **テストピラミッド**: 単体テスト70%、統合テスト20%、E2Eテスト10%

**Status**: ✅ PASS - テスト計画はこの基準に従う

### III. TypeScript + React の品質基準

- [ ] **any禁止**: `any`型の使用は禁止（`unknown`を使用）
- [ ] **strict mode**: TypeScript strict モード有効
- [ ] **型定義**: すべての関数、変数に明示的な型定義
- [ ] **Props型定義**: React コンポーネントのPropsは必ず型定義

**Status**: ✅ PASS - 既存コードベースはこれらを遵守

### IV. コードレビュー基準

- [ ] **テストコミットが実装コミットより先**: TDDサイクルを履歴で確認可能
- [ ] **カバレッジ**: 新規コードのカバレッジが100%
- [ ] **型安全性**: TypeScriptの型チェックがすべてパス
- [ ] **リンター**: ESLint, Prettier の警告ゼロ

**Status**: ✅ PASS - PRレビュー時にこれらをチェック

### V. シンプルさの原則（YAGNI）

- [ ] **必要になるまで作らない**: 将来の拡張性より現在のシンプルさ
- [ ] **過剰設計の禁止**: 現在の要求を満たす最小限の設計

**Status**: ✅ PASS - この機能は現在の要求のみに焦点を当てている

### Quality Gates

**マージ前の必須条件**:

- [ ] すべてのテストがパス
- [ ] カバレッジが基準（80%）以上
- [ ] TypeScript の型チェックがパス
- [ ] ESLint の警告ゼロ
- [ ] コードレビュー承認
- [ ] CI/CDパイプラインがグリーン

**Overall Status**: ✅ PASS - すべての憲法チェックをクリア、違反なし

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
│   ├── types/
│   │   └── models.ts           # 修正: Subscription型にtitleフィールド追加
│   ├── utils/
│   │   └── storage.ts          # 修正: データマイグレーションロジック追加
│   ├── hooks/
│   │   └── useFeedAPI.ts       # 修正: タイトル取得時のタイムアウト設定
│   ├── containers/
│   │   └── FeedContainer.tsx   # 修正: フィード登録時のタイトル取得、重複チェック、ローディング表示
│   └── contexts/
│       └── SubscriptionContext.tsx  # 確認: 変更不要の可能性
└── tests/
    ├── unit/                    # 新規: 各関数・フックの単体テスト
    ├── integration/             # 新規: コンポーネント統合テスト
    └── e2e/                     # 既存: E2Eテスト（必要に応じて追加）

api/
└── (変更なし: 既存のフィードパースAPIを使用)
```

**Structure Decision**:

このプロジェクトはフロントエンド（React + TypeScript）とバックエンド（Go API）の2層構造ですが、今回の機能はフロントエンドのみの修正です。バックエンドの既存フィードパースAPI（`/api/parse`）をそのまま利用します。

**主な変更箇所**:
- `frontend/src/types/models.ts`: Subscription型の拡張
- `frontend/src/utils/storage.ts`: localStorage読み書きとマイグレーション
- `frontend/src/hooks/useFeedAPI.ts`: API呼び出しロジック
- `frontend/src/containers/FeedContainer.tsx`: UI層のロジック

**テスト配置**:
- `frontend/tests/unit/`: 各関数・フックの単体テスト（70%）
- `frontend/tests/integration/`: コンポーネント統合テスト（20%）
- `frontend/tests/e2e/`: E2Eテスト（10%、必要に応じて）

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: N/A - Constitution Checkで違反はありません。すべての原則を遵守しています。
