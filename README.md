# Feed Parallel Parse API

## 概要

複数のRSSフィードを統合表示できるWebアプリケーションです。

- **バックエンド**: Go製の並列RSS取得・パースAPI
- **フロントエンド**: React製のRSSリーダーUI

仕様・テスト・実装は完全TDD原則に準拠し、すべて日本語で明示されています。

**本番環境**: https://feed-parallel-parse-api.vercel.app/

## プロジェクト構成

```text
feed-parallel-parse-api/
├── api/              # Go製バックエンドAPI
├── frontend/         # React製フロントエンド
├── specs/            # 機能仕様書（Speckit）
├── contracts/        # OpenAPI定義・API定義書
└── tests/            # バックエンドテスト
```

## フロントエンド（RSSリーダー）

### 特徴

- ✅ **統合フィード表示**: 複数のRSSフィードをまとめて閲覧
- ✅ **リアルタイム検索**: 記事のタイトルや要約から素早く検索（300msデバウンス）
- ✅ **フィード購読管理**: URL追加・削除、最大100件まで購読可能
- ✅ **自動更新**: ワンクリックで全フィードを更新
- ✅ **仮想スクロール**: 大量記事の高速表示（50件ずつ遅延ロード）
- ✅ **アクセシビリティ**: ARIA属性、キーボードナビゲーション完備
- ✅ **レスポンシブデザイン**: モバイル・デスクトップ対応

### 技術スタック

- React 18.x + TypeScript 5.x
- Vite 5.x（ビルドツール）
- TailwindCSS 4.x（スタイリング）
- Vitest + React Testing Library（テスト）
- **テストカバレッジ**: 99% (96/97 テスト合格)

### セットアップ・開発

```sh
cd frontend
npm install
npm run dev      # 開発サーバー起動
npm test         # テスト実行
npm run build    # 本番ビルド
```

詳細は [frontend/README.md](frontend/README.md) を参照してください。

## バックエンド（RSS Parse API）

### 特徴

- 複数RSS URLを並列で高速取得・パース（goroutine/channels）
- **実際のHTTP GETリクエストでRSSフィードを取得**（ダミーレスポンスから移行完了）
- RSS 1.0 (RDF)、RSS 2.0、Atom 1.0 対応
- 100件まで同時リクエスト可能
- 10秒以内で全件返却（パフォーマンステスト済み）
- HTTPクライアント設定:
  - タイムアウト: 10秒
  - リダイレクト上限: 10回
  - User-Agent: "feed-parallel-parse-api/1.0 (RSS Reader)"
- エラーハンドリング:
  - HTTP エラー（404, 500など）
  - ネットワークエラー
  - タイムアウト
  - パースエラー
- エラーはErrorInfoとしてJSONで返却
- Vercelサーバーレス対応・CI/CD自動化
- **Speckit（仕様駆動・タスク自動生成ツール）で設計・実装・テスト・ドキュメントを一元管理**
- OpenAPI定義・API定義書自動生成・参照手順をCI/CDで管理

### バックエンドセットアップ

```sh
git clone https://github.com/zonbitamago/feed-parallel-parse-api.git
cd feed-parallel-parse-api
go mod tidy
```

### バックエンドテスト

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

- **POST** `https://feed-parallel-parse-api.vercel.app/api/parse`
  - リクエスト: `{ "urls": ["https://example.com/rss", ...] }`
  - レスポンス: `{ "feeds": [...], "errors": [...] }`

### 使用例

```sh
curl -X POST https://feed-parallel-parse-api.vercel.app/api/parse \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://example.com/rss"]}'
```

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
