# Data Model: 実際のHTTP GETによるRSSフィード取得

**Date**: 2025-10-27
**Feature**: [spec.md](spec.md) | [plan.md](plan.md) | [research.md](research.md)

## Overview

この機能では、**既存のデータモデルを変更しません**。HTTP GETの実装は内部処理の変更であり、外部に公開されるAPIインターフェースやデータ構造には影響しません。

## Existing Data Models

### RSSFeed

```go
type RSSFeed struct {
    Title    string    `json:"title"`
    Link     string    `json:"link"`
    Articles []Article `json:"articles"`
}
```

**説明**: 単一のRSSフィードとその記事を表現
**変更**: なし

### Article

```go
type Article struct {
    Title   string `json:"title"`
    Link    string `json:"link"`
    PubDate string `json:"pubDate"`
    Summary string `json:"summary"`
}
```

**説明**: RSSフィード内の単一記事を表現
**変更**: なし

### ParseRequest

```go
type ParseRequest struct {
    URLs []string `json:"urls"`
}
```

**説明**: APIリクエストのペイロード（パースするRSSフィードURLのリスト）
**変更**: なし

### ParseResponse

```go
type ParseResponse struct {
    Feeds  []RSSFeed   `json:"feeds"`
    Errors []ErrorInfo `json:"errors"`
}
```

**説明**: APIレスポンスのペイロード（パース結果とエラー情報）
**変更**: なし

### ErrorInfo

```go
type ErrorInfo struct {
    URL     string `json:"url"`
    Message string `json:"message"`
}
```

**説明**: 個別のRSSフィード取得/パース失敗時のエラー詳細
**変更**: なし

**Note**: `Message` フィールドには、HTTPエラー、ネットワークエラー、パースエラーなど、さまざまなエラータイプが含まれます。既存の構造で十分対応可能です。

## Internal Implementation Details

以下は実装の詳細であり、公開APIには影響しません：

### HTTPClient (内部)

```go
// RSSServiceに追加される内部フィールド（仕様書では非公開）
type RSSService struct {
    httpClient *http.Client // テスト可能性のために注入可能
}
```

**説明**: HTTP GETリクエストを実行するためのHTTPクライアント
**スコープ**: 内部実装のみ、APIには公開されない
**目的**: テストでモック可能にするため

## Data Flow

```text
1. フロントエンド
   ↓ ParseRequest { URLs: [...] }
2. API Handler (api/parse.go)
   ↓ req.URLs
3. RSSService.ParseFeeds()
   ├─ HTTP GET (新規追加) ← ここが今回の変更点
   │  ↓ []byte (RSS/Atom XML)
   ├─ Parser (既存)
   │  ↓ RSSFeed
   └─ Error Handling (既存)
      ↓ ErrorInfo
4. API Handler
   ↓ ParseResponse { Feeds: [...], Errors: [...] }
5. フロントエンド
```

**変更点**: ステップ3でダミーレスポンスの代わりに実際のHTTP GETを実行

## Validation Rules

既存のバリデーションルールを維持：

- **URL検証**: 空文字列チェック（`rss_service.go` 内）
- **フォーマット検証**: RSS/Atom形式チェック（`gofeed` パーサー内）
- **エラーハンドリング**: 各URLの処理結果を個別に返す（並行処理での失敗隔離）

## State Transitions

N/A - このシステムはステートレスです。各リクエストは独立して処理されます。

## Relationships

- **ParseRequest** → **RSSService** → **ParseResponse**
- **ParseResponse** contains **RSSFeed[]** and **ErrorInfo[]**
- **RSSFeed** contains **Article[]**

これらの関係は変更されません。

## Migration Notes

データモデルに変更がないため、マイグレーションは不要です。既存のフロントエンドコードはそのまま動作します。

## Summary

✅ **既存のデータモデルを完全に維持**
✅ **APIインターフェースに変更なし**
✅ **フロントエンドへの影響なし**
✅ **内部実装のみ変更（ダミー → HTTP GET）**