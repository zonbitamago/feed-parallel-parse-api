# Feed Parallel Parse API

## 概要

複数のRSSフィードを統合表示できるWebアプリケーションです。

- **バックエンド**: Go製の並列RSS取得・パースAPI
- **フロントエンド**: React製のRSSリーダーUI

仕様・テスト・実装は完全TDD原則に準拠し、すべて日本語で明示されています。

**本番環境**: <https://feed-parallel-parse-api.vercel.app/>

**Vercelダッシュボード**: <https://vercel.com/zonbitamagos-projects/feed-parallel-parse-api>

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
- ✅ **フィード識別表示**: 自動取得されたフィードタイトル表示、手動編集にも対応
- ✅ **購読一覧の折りたたみ**: フィード数が増えても記事一覧を優先表示（状態永続化対応）
- ✅ **インポート/エクスポート**: 購読フィードをJSON形式でバックアップ・復元（URL重複チェック機能付き）
- ✅ **リアルタイム検索**: 記事のタイトルや要約から素早く検索（300msデバウンス）
- ✅ **フィード購読管理**: URL追加・削除、最大100件まで購読可能
- ✅ **自動更新**: ワンクリックで全フィードを更新
- ✅ **仮想スクロール**: 大量記事の高速表示（50件ずつ遅延ロード）
- ✅ **アクセシビリティ**: ARIA属性、キーボードナビゲーション完備
- ✅ **レスポンシブデザイン**: モバイル・デスクトップ対応
- ✅ **PWA対応**: デスクトップアプリとしてインストール可能
  - オフライン動作（キャッシュファースト戦略）
  - ネットワーク状態の自動検出と通知
  - Service Worker自動更新検出
  - 専用アプリアイコン（5ファイル: PNG 3種、SVG 2種）

### 技術スタック

- React 19.1 + TypeScript 5.9
- Vite 7.1（ビルドツール）
- TailwindCSS 4.1（スタイリング）
- Vitest 4.0 + React Testing Library 16.3（テスト）
- react-window 2.2（仮想スクロール）
- date-fns 4.1（日付処理）
- vite-plugin-pwa 1.1（PWA対応）
- workbox-window（Service Worker管理）
- **テストカバレッジ**: 40ファイル・265テスト合格（100%、1スキップ）

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

## Dockerローカル開発

**最速セットアップ** - バックエンドとフロントエンドを1コマンドで起動：

```sh
docker-compose up
```

### 前提条件

- Docker Desktop 20.10+ ([インストール](https://www.docker.com/products/docker-desktop/))
- Git

### クイックスタート

```sh
# 1. リポジトリクローン
git clone https://github.com/zonbitamago/feed-parallel-parse-api.git
cd feed-parallel-parse-api

# 2. Docker環境起動（初回は5分程度）
docker-compose up

# アクセス確認
# バックエンド: http://localhost:8080/api/parse
# フロントエンド: http://localhost:5173
```

### 開発ワークフロー

ホットリロード対応（コード変更を自動検出）：

- **バックエンド**（Go）: ~5秒で自動再起動
- **フロントエンド**（React）: ~1秒でブラウザ更新

```sh
# ログ確認
docker-compose logs -f backend   # バックエンドログ
docker-compose logs -f frontend  # フロントエンドログ

# 停止
docker-compose down              # コンテナとネットワーク削除
docker-compose down -v           # + ボリューム削除（完全クリーンアップ）
```

### トラブルシューティング

**ポート競合エラー**:
```sh
# ポート8080または5173が使用中の場合
lsof -ti:8080 | xargs kill -9  # macOS/Linux
```

**Docker Desktop未起動**:
- Docker Desktopアプリケーションを起動してください

詳細は [specs/013-docker-local-env/quickstart.md](specs/013-docker-local-env/quickstart.md) を参照してください。

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

- フロントエンドは`frontend/dist`からビルド・デプロイ
- バックエンドAPIは`api/`ディレクトリのサーバーレス関数として自動デプロイ

## Go バージョン

現在のバージョン: **Go 1.25.1**

バージョンアップ手順:

```sh
go mod edit -go=1.25.1
go mod tidy
go test ./...
```

## CI/CD

### 自動テスト統合

このプロジェクトでは、GitHub Actionsを使用してBackendとFrontendの両方のテストを自動実行しています。

**実行タイミング**:

- `main` または `001-parallel-rss-parse-api` ブランチへのプッシュ時
- プルリクエスト作成・更新時

**テストジョブ**:

- ✅ **Backend Tests (Go)**: Go 1.25.1でのユニット・統合テスト（約49秒）
- ✅ **Frontend Tests (Vitest)**: React + TypeScript のユニットテスト（約35秒、204テスト合格）

**Branch Protection**:

- すべてのテストが成功しない限り、メインブランチへのマージはブロックされます
- 各PRでテスト結果がリアルタイムで表示されます

**セットアップ方法**:

詳細なCI統合のセットアップ手順は [specs/001-frontend-ci-tests/quickstart.md](specs/001-frontend-ci-tests/quickstart.md) を参照してください。

## 開発方針

- TDD 原則（テスト → 実装 → 検証）
- Speckit で仕様・タスク・テスト・ドキュメントを一元管理・自動生成
- OpenAPI/CI/CD による API 定義書自動生成・参照性担保
- **システム仕様書（SPECIFICATION.md）の維持**: PR作成時に必ず更新し、最新の機能を反映
- AI アシスタント:
  - ローカル開発: Claude Code ([CLAUDE.md](CLAUDE.md))
  - PR レビュー: GitHub Copilot ([.github/copilot-instructions.md](.github/copilot-instructions.md))

## ライセンス

MIT
