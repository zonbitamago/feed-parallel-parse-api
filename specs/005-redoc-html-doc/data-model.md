# Data Model: Redoc HTML Doc

## エンティティ一覧

### OpenAPI 定義ファイル（openapi.yaml）

- 種別: YAML ファイル
- 内容: API エンドポイント、スキーマ、レスポンス、エラー定義等

### HTML API 定義書

- 種別: 静的 HTML ファイル
- 生成元: Redoc CLI
- 格納先: contracts/api-docs/index.html
- 内容: OpenAPI 仕様に基づく API ドキュメント

### Redoc CLI

- 種別: コマンドラインツール
- 入力: openapi.yaml
- 出力: HTML API 定義書

## バリデーション・ルール

- openapi.yaml は OpenAPI 3.0/3.1 仕様に準拠していること
- 生成 HTML は主要ブラウザで正しく表示できること

## 状態遷移

- openapi.yaml 更新 → CI/CD トリガー → Redoc CLI で HTML 生成 → contracts/api-docs/に格納
