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

## 開発方針

- TDD 原則（テスト → 実装 → 検証）
- speckit で仕様・タスク・テスト・ドキュメントを一元管理・自動生成
- 仕様・設計・タスクは `specs/001-parallel-rss-parse-api/` 配下に全て記載
- CI/CD（GitHub Actions）で自動テスト
