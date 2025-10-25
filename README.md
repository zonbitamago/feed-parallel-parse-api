# Feed Parallel Parse API

## 概要

この API は、複数の RSS1.0/RSS2.0/Atom フィード URL を並列でパースし、共通のデータ構造で返却します。

## クイックスタート

### 1. 依存インストール

```
go mod tidy
```

### 2. テスト実行

```
go test ./tests/unit/...
```

### 3. 主要エンドポイント

- POST `/api/parse`
  - リクエスト: `{ "urls": ["https://example.com/rss", ...] }`
  - レスポンス: `feeds`（パース結果配列）、`errors`（エラー配列）

### 4. サポート形式

- RSS 1.0 (RDF)
- RSS 2.0
- Atom 1.0

### 5. 実装・仕様

- 並列パース（goroutine/channels）
- gofeed ライブラリ利用
- OpenAPI 仕様: `contracts/openapi.yaml`
- 詳細仕様: `specs/006-rss-format-support/`

---

## 開発・テスト

- 単体テスト: `go test ./tests/unit/...`
- パフォーマンステスト: `go test ./tests/integration/...`

---

## ライセンス

MIT

# 並列 RSS パース API

## 概要

Go + Vercel で動作する、複数 RSS を並列取得・パースし、統一 JSON 形式で返却する Web API です。
仕様・テスト・実装は TDD 原則に準拠し、すべて日本語で明示されています。

## 特徴

- 複数 RSS URL を並列で高速取得・パース
- 100 件まで同時リクエスト可能
- 10 秒以内で全件返却（パフォーマンステスト済み）
- エラーは ErrorInfo として JSON で返却
- 仕様を日本語テストケース名で担保
- Vercel サーバーレス対応・CI/CD 自動化
- **speckit（仕様駆動・タスク自動生成ツール）で設計・実装・テスト・ドキュメントを一元管理**
- OpenAPI 定義・API 定義書自動生成・参照手順を CI/CD で管理

## Go バージョンアップ手順（1.25 対応）

```sh
go mod edit -go=1.25
go mod tidy
go test ./...
```

## セットアップ

```sh
git clone https://github.com/zonbitamago/feed-parallel-parse-api.git
cd feed-parallel-parse-api
go mod tidy
```

## テスト

```sh
go test ./...
```

- 仕様・エラー・パフォーマンス・コントラクトテストを日本語ケース名で網羅
- API 定義書生成・参照テストは `tests/contract/` のシェルスクリプトで自動化

## デプロイ（Vercel）

```sh
npm i -g vercel
vercel --prod
```

- `vercel.json`で Go 1.21 サーバーレス関数指定済み

## API 例

- POST `/parse`
  - body: `{ "urls": ["https://example.com/rss", ...] }`
  - response: `{ "feeds": [...], "errors": [...] }`

## API 定義書参照方法

- 最新の API 定義書は `contracts/api-docs/index.html` をブラウザで開いて参照可能
- 仕様変更時は `contracts/openapi.yaml` を修正し、CI/CD で自動更新
- 参照手順は `contracts/api-docs/README.md` に記載

## 開発方針

- TDD 原則（テスト → 実装 → 検証）
- speckit で仕様・タスク・テスト・ドキュメントを一元管理・自動生成
- OpenAPI/CI/CD による API 定義書自動生成・参照性担保
