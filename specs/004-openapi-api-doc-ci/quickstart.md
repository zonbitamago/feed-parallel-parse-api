# Quickstart: OpenAPI API Doc CI

## 概要

OpenAPI ファイルをリポジトリに追加・更新すると、CI（GitHub Actions）で自動的に API 定義書（HTML 等）が生成されます。

## 手順

1. `contracts/openapi.yaml` に API インターフェースを OpenAPI 形式で記述
2. コミット・プッシュすると CI が自動実行
3. 定義書（HTML 等）が `contracts/` 配下に生成される
4. エラーがあれば CI で通知

## 依存ツール

- OpenAPI Generator
- GitHub Actions

## 参考

- [OpenAPI Specification](https://swagger.io/specification/)
- [OpenAPI Generator](https://openapi-generator.tech/)
