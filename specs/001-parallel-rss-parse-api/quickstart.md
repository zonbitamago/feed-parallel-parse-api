# クイックスタート: 並列 RSS パース API

## 概要

Go 最新版＋ Vercel でデプロイ可能な並列 RSS パース API のセットアップ手順です。

## 前提

- Go 1.21 以降がインストール済み
- Vercel アカウント作成済み
- GitHub リポジトリ連携済み

## セットアップ手順

1. リポジトリをクローン

   ```sh
   git clone https://github.com/zonbitamago/feed-parallel-parse-api.git
   cd feed-parallel-parse-api
   ```

2. 依存パッケージインストール

   ```sh
   go mod tidy
   ```

3. ローカルテスト実行

   ```sh
   go test ./...
   ```

4. Vercel にデプロイ

   - Vercel CLI インストール（未導入の場合）

     ```sh
     npm i -g vercel
     ```

   - デプロイ

     ```sh
     vercel --prod
     ```

## API エンドポイント例

- POST /parse
  - body: { "urls": ["https://example.com/rss", ...] }
  - response: { "feeds": [...], "errors": [...] }

## テスト

- 日本語ケース名で仕様を明示したテストを多数実装
- 単体・コントラクト・パフォーマンス・エラー検証テストあり

## 補足

- Vercel の Go サーバーレス関数として動作
- 仕様・テスト・実装は tasks.md に準拠
