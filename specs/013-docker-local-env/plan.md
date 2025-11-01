# Implementation Plan: Docker Local Development Environment

**Branch**: `013-docker-local-env` | **Date**: 2025-11-01 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/013-docker-local-env/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

開発者が1つのコマンド（`docker-compose up`）でバックエンド（Go API）とフロントエンド（React + Vite）の両方を含む完全なローカル開発環境を起動できるようにする。ホットリロード機能により、ソースコード変更を自動検出し、手動再起動なしで反映する。

**Technical Approach**:
- Docker Composeで2つのサービス（backend, frontend）をオーケストレーション
- バックエンド: HTTP server wrapperでVercel serverless functionをローカル実行可能に
- フロントエンド: Vite dev serverをコンテナ化、ホットリロード標準対応
- CORS設定をバックエンドに追加
- ボリュームマウントでソースコード変更の即座反映

## Technical Context

**Language/Version**:
- Backend: Go 1.25.1
- Frontend: Node.js 25.0.0, TypeScript 5.9.3

**Primary Dependencies**:
- Backend: gofeed v1.3.0, testify v1.11.1
- Frontend: React 19.1.1, Vite 7.1.7, TailwindCSS 4.1.16
- DevOps: Docker 20.10+, Docker Compose 2.0+

**Storage**: N/A (このfeatureは環境構築のみ、データストレージは不要)

**Testing**:
- Backend: Go標準テストフレームワーク + testify
- Frontend: Vitest 4.0.3 + @testing-library/react 16.3.0
- Integration: docker-compose up の動作確認（手動テスト）

**Target Platform**:
- Development: macOS / Linux / Windows (Docker Desktop対応環境)
- Containers: Linux-based (Alpine or Debian)

**Project Type**: Web application (Backend API + Frontend SPA)

**Performance Goals**:
- 環境起動時間: 5分以内（初回ビルド含む）
- ホットリロード反映時間: 15秒以内
- 起動成功率: 95%以上

**Constraints**:
- 開発者マシンの最小要件: CPU 2コア、メモリ4GB
- ポート競合の自動検出とエラー表示
- ビルドキャッシュによる2回目以降の高速起動

**Scale/Scope**:
- 2つのサービス（backend, frontend）
- 開発者数: 1-10名の同時使用を想定
- コンテナイメージサイズ: 開発環境のため最適化不要

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Test-Driven Development (TDD) Compliance

- [x] **TDD Strategy Defined**: Docker環境のテストは手動テスト中心
  - **Justification**: インフラストラクチャコード（Dockerfile, docker-compose.yml）は設定ファイルであり、単体テスト不適
  - **Testing Approach**:
    - ✅ 手動テスト: `docker-compose up` の成功確認
    - ✅ Integration Test: 起動後のエンドポイントヘルスチェック
    - ✅ Smoke Test: バックエンド・フロントエンドへのHTTPリクエスト成功確認
  - **Constitution Alignment**: TDDの精神（動作確認を先に定義）は保持、テスト手法を適応

- [x] **HTTP Server Wrapper (cmd/server/main.go) はTDD適用**:
  - Red: CORS headerテスト（失敗を確認）
  - Green: CORS middleware実装
  - Refactor: コード整理

### Code Quality Standards

- [x] **Type Safety**: Go（静的型付け）、TypeScript strict mode使用
- [x] **Linting**: 既存のESLint設定を継承、新規Go codeはgofmt準拠
- [x] **Testing Framework**: 既存フレームワーク使用（Go testing, Vitest）

### YAGNI Principle

- [x] **Minimal Scope**: 本番環境最適化、CI/CD統合、DBコンテナ化は全てOut of Scope
- [x] **Current Need Only**: 開発環境の起動とホットリロードのみ実装

### Quality Gates (このfeature特有)

- [x] **環境起動テスト**: `docker-compose up` が5分以内に成功
- [x] **ホットリロードテスト**: ソースコード変更が15秒以内に反映
- [x] **エラーハンドリングテスト**: ポート競合時に明確なエラーメッセージ表示
- [x] **クリーンアップテスト**: `docker-compose down` で全リソース削除確認

### Constitution Compliance Status

✅ **PASSED** - All gates satisfied with appropriate adaptations for infrastructure code

### Post-Design Re-evaluation

After completing Phase 0 (Research) and Phase 1 (Design & Contracts):

- [x] **TDD Strategy Confirmed**: 手動テスト + HTTPサーバーのunit test
- [x] **Complexity Justified**: シンプルなdocker-compose構成、YAGNIに準拠
- [x] **Dependencies Minimal**: Air (hot reload) のみ追加、業界標準ツール
- [x] **Test Coverage Plan**: 手動テスト手順をquickstart.mdに明記
- [x] **Documentation Complete**: research.md, quickstart.md, contracts/ 全て作成済み

**Final Status**: ✅ **APPROVED FOR IMPLEMENTATION** (Phase 2 ready)

## Project Structure

### Documentation (this feature)

```text
specs/013-docker-local-env/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - Docker best practices
├── data-model.md        # Phase 1 output - N/A (no data model for this feature)
├── quickstart.md        # Phase 1 output - Docker environment setup guide
├── contracts/           # Phase 1 output - docker-compose.yml schema documentation
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

**Existing Structure** (Web application with Backend + Frontend):

```text
feed-parallel-parse-api/
├── api/                     # Vercel serverless functions (existing)
│   └── parse.go
│
├── cmd/                     # 🆕 NEW: Command-line tools
│   └── server/
│       └── main.go          # 🆕 HTTP server wrapper for local development
│
├── pkg/                     # Existing backend code
│   ├── models/
│   │   └── rss.go
│   └── services/
│       └── rss_service.go
│
├── tests/                   # Existing backend tests
│   ├── contract/
│   ├── integration/
│   └── unit/
│
├── frontend/                # Existing React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   ├── tests/
│   └── package.json
│
├── Dockerfile.backend       # 🆕 NEW: Backend container definition
├── Dockerfile.frontend      # 🆕 NEW: Frontend container definition
├── docker-compose.yml       # 🆕 NEW: Service orchestration
├── .dockerignore            # 🆕 NEW: Build optimization
│
├── go.mod                   # Existing
├── package.json             # Existing (root, if any)
└── README.md                # Existing (will be updated)
```

**New Files for This Feature**:
1. `cmd/server/main.go` - HTTP server wrapper with CORS support
2. `Dockerfile.backend` - Go 1.25.1 multi-stage build
3. `Dockerfile.frontend` - Node 25.0 + Vite dev server
4. `docker-compose.yml` - Orchestrates backend (port 8080) + frontend (port 5173)
5. `.dockerignore` - Excludes node_modules, .git, build artifacts

**Structure Decision**: Web application structure (Option 2) is already in place. This feature adds Docker orchestration files to enable local development with minimal changes to existing code structure.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
