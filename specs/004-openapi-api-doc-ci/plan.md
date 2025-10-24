# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

OpenAPI ファイルで API インターフェースを定義し、CI（GitHub Actions）で自動的に API 定義書（HTML 等）を生成する。定義書生成時に OpenAPI ファイルの妥当性を検証し、エラーは CI で通知。複数バージョンがある場合は最新コミットのみ対象。

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Go 1.2x
**Primary Dependencies**: OpenAPI Generator, GitHub Actions
**Storage**: N/A（API 定義書生成のみ）
**Testing**: go test, OpenAPI バリデーション
**Target Platform**: GitHub リポジトリ, CI 環境
**Project Type**: single
**Performance Goals**: OpenAPI ファイル更新後 24 時間以内に API 定義書自動生成
**Constraints**: OpenAPI ファイルの妥当性必須
**Scale/Scope**: API 数はリポジトリ内管理分

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

ライブラリ優先: API 定義は OpenAPI 形式で独立管理
CLI インターフェース: CI 経由で自動生成
テストファースト: OpenAPI バリデーション必須
統合テスト: API 定義書生成の妥当性検証
バージョン管理: 最新バージョンのみ生成
→ 憲章違反なし

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

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
  api/
  lib/
  models/
  services/
tests/
  contract/
  integration/
  unit/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
