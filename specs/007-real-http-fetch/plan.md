# Implementation Plan: 実際のHTTP GETによるRSSフィード取得

**Branch**: `007-real-http-fetch` | **Date**: 2025-10-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-real-http-fetch/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

現在ダミーレスポンスを返している `pkg/services/rss_service.go` の `ParseFeeds` メソッドを、実際のHTTP GETリクエストを実行するように変更する。並行処理構造、エラーハンドリング、既存のパース機能は維持しながら、HTTP クライアントを追加してリアルなフィード取得を実現する。タイムアウト、リダイレクト、HTTPエラーハンドリングを適切に実装する。

## Technical Context

**Language/Version**: Go 1.25.1

**Primary Dependencies**:

- `github.com/mmcdole/gofeed` v1.3.0 (既存のRSS/Atomパーサー)
- Go標準ライブラリ `net/http` (HTTP GETリクエスト用)
- `github.com/stretchr/testify` v1.11.1 (テスト用)

**Storage**: N/A（この機能はストレージを使用しない）

**Testing**: Go標準の `testing` パッケージ + `testify`（既存のテスト構造を維持）

**Target Platform**: Vercel Serverless Functions（既存のデプロイ先）

**Project Type**: Web API (バックエンドのみ、フロントエンドは既存)

**Performance Goals**:

- 単一フィード取得: 5秒以内
- 10個の並列フィード取得: 15秒以内
- タイムアウト: 10秒

**Constraints**:

- Vercel Serverless Functionsの実行時間制限内で動作（デフォルト10秒、最大60秒）
- メモリ使用量を最小限に抑える（大きなフィードの処理）
- 既存の並行処理構造を維持
- 既存のエラーハンドリングメカニズムを維持

**Scale/Scope**:

- 1リクエストあたり最大数十個のフィードURL（並列処理）
- エッジケース: 大規模フィード（数千記事）、遅いサーバー、エラー処理

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **Constitution file is a template** - プロジェクト固有の原則が未設定のため、一般的なベストプラクティスに従う

**General Best Practices Check**:

- ✅ 既存のコード構造を維持（`pkg/services/rss_service.go` を修正）
- ✅ テスト可能な設計（HTTPクライアントを注入可能にする）
- ✅ 既存のテスト構造を維持（unit, integration, contract tests）
- ✅ エラーハンドリングの一貫性（既存の `models.ErrorInfo` を使用）
- ✅ 並行処理の保持（既存のgoroutine構造を維持）

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
api/
└── parse.go              # Vercel serverless function handler

pkg/
├── models/
│   └── models.go         # RSSFeed, Article, ErrorInfo 定義（既存）
└── services/
    └── rss_service.go    # 🔧 修正対象: HTTP GET追加、ダミー削除

tests/
├── contract/
│   └── parse_api_test.go # 🔧 更新: 実際のHTTP取得をテスト
├── integration/
│   ├── error_test.go     # 🔧 更新: HTTPエラーケース追加
│   └── performance_test.go # 🔧 更新: 実際のフィード取得性能
└── unit/
    ├── rss_service_test.go # 🔧 更新: HTTPクライアントモック
    └── rss_model_test.go   # 既存（変更なし）

frontend/                  # フロントエンドは変更なし
└── [React + TypeScript application]

contracts/                 # OpenAPI定義（変更なし）
└── openapi.yaml

specs/007-real-http-fetch/ # この機能のドキュメント
└── [plan.md, research.md, etc.]
```

**Structure Decision**:

このプロジェクトは**Web application (Option 2)**構造を採用しており、`api/` ディレクトリにVercel serverless functions、`pkg/` にビジネスロジック、`frontend/` にReactアプリケーションを配置しています。

今回の機能は**バックエンドのみ**を修正し、`pkg/services/rss_service.go` のダミーレスポンス部分を実際のHTTP GETリクエストに置き換えます。フロントエンドやAPIエンドポイント、データモデルの変更は不要です。

## Complexity Tracking

N/A - Constitution Checkに違反なし
