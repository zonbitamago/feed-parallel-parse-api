# API Contract: 実際のHTTP GETによるRSSフィード取得

**Date**: 2025-10-27
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [data-model.md](../data-model.md)

## Overview

この機能では、**既存のAPIコントラクトを変更しません**。HTTP GETの実装は内部処理の変更であり、外部に公開されるAPIエンドポイントやリクエスト/レスポンスの形式には影響しません。

## Existing API Contract

既存のAPIコントラクトは `/contracts/openapi.yaml` で定義されており、そのまま維持されます。

### Endpoint

```
POST /api/parse
```

**変更**: なし

### Request

```json
{
  "urls": ["string"]
}
```

**変更**: なし

**Example**:

```json
{
  "urls": [
    "https://example.com/feed.xml",
    "https://another.com/rss"
  ]
}
```

### Response (200 OK)

```json
{
  "feeds": [
    {
      "title": "string",
      "link": "string",
      "articles": [
        {
          "title": "string",
          "link": "string",
          "pubDate": "string",
          "summary": "string"
        }
      ]
    }
  ],
  "errors": [
    {
      "url": "string",
      "message": "string"
    }
  ]
}
```

**変更**: なし

**Example** (実際のHTTP GET後):

```json
{
  "feeds": [
    {
      "title": "Example Blog",
      "link": "https://example.com",
      "articles": [
        {
          "title": "New Post",
          "link": "https://example.com/post/1",
          "pubDate": "2025-10-27T10:00:00Z",
          "summary": "This is a new post..."
        }
      ]
    }
  ],
  "errors": [
    {
      "url": "https://broken.com/feed",
      "message": "HTTPエラー: 404 Not Found"
    }
  ]
}
```

### Response (400 Bad Request)

```json
{
  "error": "string",
  "details": [...]
}
```

**変更**: なし

### Response (500 Internal Server Error)

```json
{
  "error": "string",
  "details": [...]
}
```

**変更**: なし

## Behavior Changes

APIコントラクトは変更されませんが、**レスポンスの内容**は以下のように変化します：

### Before (ダミーレスポンス)

```json
{
  "feeds": [
    {
      "title": "Dummy",
      "link": "https://example.com/feed.xml",
      "articles": []
    }
  ],
  "errors": []
}
```

### After (実際のHTTP GET)

```json
{
  "feeds": [
    {
      "title": "Real Feed Title",
      "link": "https://example.com",
      "articles": [
        {
          "title": "Article 1",
          "link": "https://example.com/article-1",
          "pubDate": "2025-10-27T10:00:00Z",
          "summary": "Article summary..."
        }
      ]
    }
  ],
  "errors": []
}
```

## Error Message Examples

エラーメッセージがより具体的になります：

### HTTPエラー

```json
{
  "url": "https://example.com/feed",
  "message": "HTTPエラー: 404 Not Found"
}
```

### ネットワークエラー

```json
{
  "url": "https://timeout.com/feed",
  "message": "タイムアウト: リクエストが10秒を超えました"
}
```

```json
{
  "url": "https://invalid-domain.com/feed",
  "message": "DNS解決失敗: ホストが見つかりません"
}
```

### パースエラー

```json
{
  "url": "https://example.com/not-a-feed.html",
  "message": "サポート外のフィード形式"
}
```

## Backward Compatibility

✅ **完全な後方互換性**

- リクエスト形式: 変更なし
- レスポンス形式: 変更なし
- HTTPステータスコード: 変更なし
- エラーハンドリング: 既存の構造を維持

**Note**: エラーメッセージの内容はより詳細になりますが、`ErrorInfo` の構造（`url` と `message` フィールド）は変更されないため、既存のフロントエンドコードはそのまま動作します。

## Contract Testing

既存のコントラクトテスト（`tests/contract/parse_api_test.go`）は引き続き有効です。テストケースは実際のHTTP取得を反映して更新されますが、コントラクト自体は変更されません。

## OpenAPI Specification

既存の `/contracts/openapi.yaml` はそのまま使用できます。変更は不要です。

## Summary

✅ **APIコントラクトに変更なし**
✅ **完全な後方互換性を維持**
✅ **フロントエンドへの影響なし**
✅ **レスポンス内容のみ変化（ダミー → 実データ）**