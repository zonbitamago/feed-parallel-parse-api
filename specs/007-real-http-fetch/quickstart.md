# Quickstart: 実際のHTTP GETによるRSSフィード取得

**Date**: 2025-10-27
**Feature**: [spec.md](spec.md) | [plan.md](plan.md) | [research.md](research.md)

## Overview

このガイドは、開発者が「実際のHTTP GETによるRSSフィード取得」機能を理解し、実装・テストするための手順を提供します。

## Prerequisites

- Go 1.25.1以上
- 既存のプロジェクト環境（`feed-parallel-parse-api`）
- 基本的なGoの知識（goroutine、`net/http` パッケージ）

## Implementation Summary

### 変更対象ファイル

1. **`pkg/services/rss_service.go`** - ダミーレスポンスを実際のHTTP GETに置き換える
2. **テストファイル** - HTTPクライアントモックとエラーケースを追加

### 実装の流れ

```text
1. HTTPクライアント設定
   ↓
2. HTTP GETリクエスト実装
   ↓
3. エラーハンドリング強化
   ↓
4. テスト更新
   ↓
5. 統合テスト実行
```

## Step 1: HTTPクライアント設定

`RSSService` 構造体にHTTPクライアントを追加します。

```go
type RSSService struct {
    httpClient *http.Client
}

func NewRSSService() *RSSService {
    return &RSSService{
        httpClient: &http.Client{
            Timeout: 10 * time.Second,
            CheckRedirect: func(req *http.Request, via []*http.Request) error {
                if len(via) >= 10 {
                    return errors.New("リダイレクトが10回を超えました")
                }
                return nil
            },
        },
    }
}
```

**Key Points**:

- タイムアウト: 10秒（仕様書のFR-003）
- リダイレクト: 最大10回（仕様書のFR-006）

## Step 2: HTTP GETリクエスト実装

`ParseFeeds` メソッド内のダミーレスポンス部分を置き換えます。

### Before (ダミーレスポンス)

```go
// フィード取得（ここではダミー: 実際はHTTP GET等）
if u == "bad-url" {
    ch <- struct {
        feed *models.RSSFeed
        err  *models.ErrorInfo
    }{
        feed: nil,
        err:  &models.ErrorInfo{URL: u, Message: "URL不正またはサポート外フォーマット"},
    }
    return
}
// 正常系（ダミー）
ch <- struct {
    feed *models.RSSFeed
    err  *models.ErrorInfo
}{
    feed: &models.RSSFeed{Title: "Dummy", Link: u, Articles: []models.Article{}},
    err:  nil,
}
```

### After (実際のHTTP GET)

```go
// HTTP GETリクエスト作成
req, err := http.NewRequestWithContext(ctx, "GET", u, nil)
if err != nil {
    ch <- struct {
        feed *models.RSSFeed
        err  *models.ErrorInfo
    }{
        feed: nil,
        err:  &models.ErrorInfo{URL: u, Message: fmt.Sprintf("リクエスト作成失敗: %v", err)},
    }
    return
}

// User-Agentヘッダー設定
req.Header.Set("User-Agent", "feed-parallel-parse-api/1.0 (RSS Reader)")

// HTTP GETリクエスト実行
resp, err := s.httpClient.Do(req)
if err != nil {
    ch <- struct {
        feed *models.RSSFeed
        err  *models.ErrorInfo
    }{
        feed: nil,
        err:  &models.ErrorInfo{URL: u, Message: fmt.Sprintf("HTTP取得失敗: %v", err)},
    }
    return
}
defer resp.Body.Close()

// HTTPステータスコードチェック
if resp.StatusCode != http.StatusOK {
    ch <- struct {
        feed *models.RSSFeed
        err  *models.ErrorInfo
    }{
        feed: nil,
        err:  &models.ErrorInfo{URL: u, Message: fmt.Sprintf("HTTPエラー: %d %s", resp.StatusCode, resp.Status)},
    }
    return
}

// レスポンスボディ読み取り
body, err := io.ReadAll(resp.Body)
if err != nil {
    ch <- struct {
        feed *models.RSSFeed
        err  *models.ErrorInfo
    }{
        feed: nil,
        err:  &models.ErrorInfo{URL: u, Message: fmt.Sprintf("ボディ読み取り失敗: %v", err)},
    }
    return
}

// RSSパース（既存のパーサーを使用）
parser := gofeed.NewParser()
feed, err := parser.ParseString(string(body))
if err != nil {
    ch <- struct {
        feed *models.RSSFeed
        err  *models.ErrorInfo
    }{
        feed: nil,
        err:  &models.ErrorInfo{URL: u, Message: fmt.Sprintf("パース失敗: %v", err)},
    }
    return
}

// RSSFeed変換（既存のロジック）
rssFeed := feedToRSSFeed(feed)
ch <- struct {
    feed *models.RSSFeed
    err  *models.ErrorInfo
}{
    feed: rssFeed,
    err:  nil,
}
```

## Step 3: テスト更新

### Unit Test (`tests/unit/rss_service_test.go`)

HTTPクライアントをモック化してテストします。

```go
func TestParseFeeds_RealHTTP(t *testing.T) {
    // モックサーバー作成
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/xml")
        w.WriteHeader(http.StatusOK)
        w.Write([]byte(`<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <link>https://example.com</link>
    <item>
      <title>Test Article</title>
      <link>https://example.com/article</link>
      <pubDate>Mon, 27 Oct 2025 10:00:00 GMT</pubDate>
      <description>Test description</description>
    </item>
  </channel>
</rss>`))
    }))
    defer server.Close()

    // テスト実行
    service := services.NewRSSService()
    feeds, errors := service.ParseFeeds(context.Background(), []string{server.URL})

    // 検証
    assert.Len(t, feeds, 1)
    assert.Equal(t, "Test Feed", feeds[0].Title)
    assert.Len(t, feeds[0].Articles, 1)
    assert.Len(t, errors, 0)
}
```

### Integration Test (`tests/integration/error_test.go`)

HTTPエラーケースをテストします。

```go
func TestHTTPError_404(t *testing.T) {
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusNotFound)
    }))
    defer server.Close()

    service := services.NewRSSService()
    feeds, errors := service.ParseFeeds(context.Background(), []string{server.URL})

    assert.Len(t, feeds, 0)
    assert.Len(t, errors, 1)
    assert.Contains(t, errors[0].Message, "404")
}
```

## Step 4: テスト実行

```bash
# Unit tests
go test ./tests/unit/...

# Integration tests
go test ./tests/integration/...

# Contract tests
go test ./tests/contract/...

# All tests
go test ./...
```

## Step 5: ローカル動作確認

### APIをローカルで起動

```bash
# Vercel Dev環境で起動
vercel dev
```

### curlでテスト

```bash
curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example.com/feed.xml"
    ]
  }'
```

### 期待されるレスポンス

```json
{
  "feeds": [
    {
      "title": "Real Feed Title",
      "link": "https://example.com",
      "articles": [...]
    }
  ],
  "errors": []
}
```

## Common Issues & Solutions

### 問題: タイムアウトエラーが頻繁に発生

**解決策**: タイムアウト時間を調整（ただし仕様書の10秒を推奨）

```go
httpClient: &http.Client{
    Timeout: 15 * time.Second, // 必要に応じて調整
}
```

### 問題: 一部のフィードが403エラーを返す

**解決策**: User-Agentヘッダーをより詳細に設定

```go
req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; feed-parallel-parse-api/1.0)")
```

### 問題: リダイレクトが10回を超える

**解決策**: 特定のURLのリダイレクトチェーンを確認し、必要に応じて直接URLを使用

## Performance Considerations

- **並列処理**: 既存のgoroutine構造を維持しているため、10個のフィードを並列処理可能
- **タイムアウト**: 各リクエストは10秒でタイムアウトするため、全体で最大10秒程度
- **メモリ**: 大規模フィード（数千記事）は数MBのメモリを使用する可能性あり

## Next Steps

1. **Phase 2**: `/speckit.tasks` コマンドでタスクリストを生成
2. **Implementation**: タスクに従って実装を進める
3. **Testing**: 各タスク完了後にテストを実行
4. **Review**: コードレビュー後にマージ

## References

- [Spec](spec.md) - 機能仕様書
- [Plan](plan.md) - 実装計画
- [Research](research.md) - 技術調査
- [Data Model](data-model.md) - データモデル
- [API Contract](contracts/api-contract.md) - APIコントラクト