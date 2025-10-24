# Data Model: OpenAPI API Doc CI

## Entities

### OpenAPI ファイル

- 属性: エンドポイント, リクエスト, レスポンス, スキーマ, バージョン
- 関係: API 定義書と 1 対 1（最新コミットのみ）
- バリデーション: OpenAPI 仕様に準拠

### API 定義書

- 属性: HTML 等の人間可読ドキュメント, 生成日時, バージョン
- 関係: OpenAPI ファイルから自動生成

## Validation Rules

- OpenAPI ファイルは仕様に準拠していること
- API 定義書は最新の OpenAPI ファイルから生成されていること

## State Transitions

- OpenAPI ファイル更新 → CI 実行 → API 定義書自動生成
- エラー時: CI で通知
