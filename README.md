# Feed Parallel Parse API

## 概要

Go + Vercel で動作する、複数 RSS を並列取得・パースし、統一 JSON 形式で返却する Web API です。
仕様・テスト・実装は TDD 原則に準拠し、すべて日本語で明示されています。

## 特徴

- 複数 RSS URL を並列で高速取得・パース（goroutine/channels）
- RSS 1.0 (RDF)、RSS 2.0、Atom 1.0 対応
- 100 件まで同時リクエスト可能
- 10 秒以内で全件返却（パフォーマンステスト済み）
- エラーは ErrorInfo として JSON で返却
- 仕様を日本語テストケース名で担保
- Vercel サーバーレス対応・CI/CD 自動化
- **Speckit（仕様駆動・タスク自動生成ツール）で設計・実装・テスト・ドキュメントを一元管理**
- OpenAPI 定義・API 定義書自動生成・参照手順を CI/CD で管理

## セットアップ

```sh
git clone https://github.com/zonbitamago/feed-parallel-parse-api.git
cd feed-parallel-parse-api
go mod tidy
```

## テスト

```sh
# 全テスト実行
go test ./...

# 単体テストのみ
go test ./tests/unit/...

# パフォーマンステスト
go test ./tests/integration/...
```

- 仕様・エラー・パフォーマンス・コントラクトテストを日本語ケース名で網羅
- API 定義書生成・参照テストは `tests/contract/` のシェルスクリプトで自動化

## API 仕様

### エンドポイント

- **POST** `/api/parse`
  - リクエスト: `{ "urls": ["https://example.com/rss", ...] }`
  - レスポンス: `{ "feeds": [...], "errors": [...] }`

### 詳細仕様

- OpenAPI 仕様: [contracts/openapi.yaml](contracts/openapi.yaml)
- 機能仕様: [specs/006-rss-format-support/](specs/006-rss-format-support/)

## API 定義書参照方法

- 最新の API 定義書は `contracts/api-docs/index.html` をブラウザで開いて参照可能
- 仕様変更時は `contracts/openapi.yaml` を修正し、CI/CD で自動更新
- 参照手順は [contracts/api-docs/README.md](contracts/api-docs/README.md) に記載

## デプロイ（Vercel）

```sh
npm i -g vercel
vercel --prod
```

- `vercel.json`で Go 1.21 サーバーレス関数指定済み

## Go バージョンアップ手順（1.25 対応）

```sh
go mod edit -go=1.25
go mod tidy
go test ./...
```

## 開発方針

- TDD 原則（テスト → 実装 → 検証）
- Speckit で仕様・タスク・テスト・ドキュメントを一元管理・自動生成
- OpenAPI/CI/CD による API 定義書自動生成・参照性担保
- AI アシスタント:
  - ローカル開発: Claude Code ([CLAUDE.md](CLAUDE.md))
  - PR レビュー: GitHub Copilot ([.github/copilot-instructions.md](.github/copilot-instructions.md))

## ライセンス

MIT
