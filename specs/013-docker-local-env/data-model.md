# Data Model: Docker Local Development Environment

**Feature**: 013-docker-local-env
**Date**: 2025-11-01
**Status**: N/A

## Summary

このfeatureはインフラストラクチャ（開発環境構築）であり、データモデルを持ちません。

**Reason**:
- Docker環境は既存のバックエンド（Go）とフロントエンド（React）のコードを実行するための環境を提供するのみ
- 新しいデータエンティティ、データベーススキーマ、API契約の変更は一切なし
- 既存の `RSSFeed`, `Article`, `ErrorInfo` 等のモデルはそのまま使用

## Related Documentation

データモデルについては、既存のドキュメントを参照してください：

- **Backend Models**: [pkg/models/rss.go](../../pkg/models/rss.go)
- **Frontend Types**: [frontend/src/types/api.ts](../../frontend/src/types/api.ts)
- **API Contracts**: 既存のAPI仕様（spec 001-fix-feedurl-api-mismatch等を参照）

## Configuration Model

Docker環境の設定構造は以下のファイルで定義されています：

- **docker-compose.yml**: [contracts/docker-compose.schema.yml](contracts/docker-compose.schema.yml)
- **Dockerfile.backend**: [contracts/dockerfile-backend.schema](contracts/dockerfile-backend.schema)
- **Dockerfile.frontend**: [contracts/dockerfile-frontend.schema](contracts/dockerfile-frontend.schema)
- **.air.toml**: [contracts/air-config.schema.toml](contracts/air-config.schema.toml)

これらは設定ファイルであり、実行時のデータモデルではありません。
