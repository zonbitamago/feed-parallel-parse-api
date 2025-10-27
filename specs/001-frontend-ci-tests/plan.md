# Implementation Plan: FrontendテストのCI統合

**Branch**: `001-frontend-ci-tests` | **Date**: 2025-10-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-frontend-ci-tests/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

プルリクエスト作成時にFrontendテスト（Vitest）をGitHub Actions CI環境で自動実行し、テスト結果をプルリクエストに表示する。テストが失敗した場合はマージをブロックし、開発者に詳細なエラー情報を提供する。

## Technical Context

**Language/Version**: TypeScript 5.9.3 (Frontend), GitHub Actions YAML (CI設定)
**Primary Dependencies**: React 19.1.1, Vite 7.1.7, Vitest 4.0.3, @testing-library/react 16.3.0
**Storage**: N/A（この機能はストレージを使用しない）
**Testing**: Vitest 4.0.3 + @testing-library/react（Frontendユニットテスト）
**Target Platform**: GitHub Actions (ubuntu-latest)、Node.js環境
**Project Type**: Web application (frontend + backend/api)
**Performance Goals**: テスト実行時間5分以内（SC-002より）
**Constraints**: GitHub Actionsの無料枠内で実行、プルリクエスト作成時に自動トリガー
**Scale/Scope**: 既存のFrontendテストスイート全体をCI化、将来的なテスト追加にも対応可能な構成

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: プロジェクトのconstitution.mdはテンプレートのままで、具体的な制約が定義されていません。この機能は既存のCI/CD設定（.github/workflows/ci.yml）に対する拡張であり、以下の一般的なベストプラクティスに従います：

- ✅ **既存のCI構造を尊重**: 既存のci.ymlにFrontendテストジョブを追加する形で統合
- ✅ **テスト優先**: 既存のFrontendテストスイート（Vitest）を活用し、新規テストコード追加は不要
- ✅ **シンプルさ**: GitHub Actionsの標準機能のみを使用、外部サービス不要
- ✅ **観測可能性**: GitHub ActionsのログとステータスチェックでFrontendテスト結果を可視化

**Gate Status**: ✅ PASS（既存の構造に対する非破壊的な追加機能）

## Project Structure

### Documentation (this feature)

```text
specs/001-frontend-ci-tests/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

**Note**: data-model.md および contracts/ は、この機能が既存のCI/CD設定のみを変更し、新規データモデルやAPIを追加しないため作成しません。

### Source Code (repository root)

```text
.github/
└── workflows/
    └── ci.yml           # Frontendテストジョブを追加（既存ファイルを編集）

frontend/
├── src/
│   ├── components/      # 既存のReactコンポーネント
│   ├── pages/          # 既存のページコンポーネント
│   └── services/       # 既存のサービスロジック
├── tests/              # 既存のVitestテストスイート
├── package.json        # 既存のテストスクリプト（test, test:watch）を使用
└── vitest.config.ts    # 既存のVitest設定

api/
└── handlers/           # Backend Go API（Frontendテストには影響なし）

pkg/
└── feedfetcher/        # RSSフィード処理（Frontendテストには影響なし）
```

**Structure Decision**: このプロジェクトはWeb application構造（frontend + backend/api）を採用しています。この機能は既存の.github/workflows/ci.ymlにFrontendテスト実行ステップを追加することで実装し、新規ファイルの追加は最小限に抑えます。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - Constitution Checkに違反がないため、このセクションは不要です。
