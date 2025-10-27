# Research: 実際のHTTP GETによるRSSフィード取得

**Date**: 2025-10-27
**Feature**: [spec.md](spec.md) | [plan.md](plan.md)

## Overview

この文書は、現在のダミーレスポンスから実際のHTTP GETリクエストへの移行に関する技術的な調査結果をまとめたものです。

## Research Topics

### 1. Go標準ライブラリ `net/http` によるHTTP GETリクエスト

**Decision**: Go標準ライブラリの `net/http.Client` を使用する

**Rationale**:

- Go標準ライブラリは安定しており、外部依存関係を追加する必要がない
- タイムアウト、リダイレクト、カスタムヘッダーなど、必要な機能をすべてサポート
- Vercel Serverless Functionsで問題なく動作する
- 既存のプロジェクトでも標準ライブラリを使用している

**Alternatives Considered**:

- **`github.com/go-resty/resty`**: より高レベルなHTTPクライアントだが、今回の要件には標準ライブラリで十分
- **`github.com/valyala/fasthttp`**: パフォーマンス重視だが、標準ライブラリでも要件を満たせる

### 2. HTTPクライアント設定（タイムアウト、リダイレクト）

**Decision**: 以下の設定でHTTPクライアントを構成する

```go
&http.Client{
    Timeout: 10 * time.Second,
    CheckRedirect: func(req *http.Request, via []*http.Request) error {
        if len(via) >= 10 {
            return errors.New("リダイレクトが10回を超えました")
        }
        return nil
    },
}
```

**Rationale**:

- **タイムアウト10秒**: 仕様書で定義された要件（FR-003）を満たす
- **リダイレクト最大10回**: 仕様書で定義された要件（FR-006）を満たし、無限ループを防ぐ
- デフォルトでHTTP/HTTPSの両方をサポート（FR-007）

**Alternatives Considered**:

- タイムアウトをより短く（5秒）: 遅いサーバーで失敗する可能性が高い
- リダイレクトを無効化: 多くのRSSフィードがリダイレクトを使用している

### 3. User-Agentヘッダー設定

**Decision**: 適切なUser-Agentヘッダーを設定する

```go
req.Header.Set("User-Agent", "feed-parallel-parse-api/1.0 (RSS Reader; +https://github.com/...)")
```

**Rationale**:

- 多くのRSSフィード提供者はUser-Agentを確認し、不明なボットをブロックすることがある
- 適切なUser-Agentは、サーバー管理者がトラフィックを識別するのに役立つ
- 仕様書の前提条件に記載されている

**Alternatives Considered**:

- デフォルトのUser-Agent（`Go-http-client/1.1`）を使用: 一部のサーバーでブロックされる可能性がある

### 4. エラーハンドリング戦略

**Decision**: 既存の `models.ErrorInfo` 構造を使用し、エラータイプを拡張する

**Error Categories**:

1. **HTTPエラー（4xx, 5xx）**: HTTPステータスコードとメッセージを含む
2. **ネットワークエラー（DNS、タイムアウト、接続失敗）**: 具体的なエラーメッセージを含む
3. **パースエラー（無効なRSS/Atom形式）**: 既存のパーサーエラーを利用

**Rationale**:

- 仕様書の要件（FR-004, FR-005, FR-008）を満たす
- 既存の `models.ErrorInfo` 構造を維持（依存関係）
- フロントエンドが既にこの構造を理解している

**Alternatives Considered**:

- 新しいエラー構造を作成: 既存のコードとの互換性が失われる

### 5. 並行処理の維持

**Decision**: 既存のgoroutineベースの並行処理構造を維持する

**Current Structure**:

```go
for _, url := range urls {
    go func(u string) {
        // フィード取得とパース
        ch <- result
    }(url)
}
```

**Rationale**:

- 仕様書の依存関係に記載されている（既存の並行処理構造を維持）
- すでにテストされており、動作が保証されている
- HTTP GETを追加するだけで、並行処理のロジックは変更不要

**Alternatives Considered**:

- `sync.WaitGroup` や `errgroup` を使用: 既存のコードを大幅に変更する必要がある

### 6. テスト戦略

**Decision**: HTTPクライアントをインターフェース化してモック可能にする

**Approach**:

1. **Unit Tests**: `httptest.Server` を使用してHTTPレスポンスをモック
2. **Integration Tests**: 実際のRSSフィードURLを使用（公開フィードのみ）
3. **Contract Tests**: 既存のAPIコントラクトを維持

**Rationale**:

- テストの独立性を保つ（外部サーバーに依存しない）
- 仕様書のベストプラクティスチェック（テスト可能な設計）を満たす
- CI/CDパイプラインで安定して実行できる

**Alternatives Considered**:

- 実際のHTTPリクエストのみをテスト: テストが遅く、不安定になる

### 7. メモリ効率（大規模フィード対応）

**Decision**: ストリーミングは行わず、レスポンス全体をメモリに読み込む

**Rationale**:

- `gofeed` ライブラリは文字列またはバイト配列を受け取る設計
- ほとんどのRSSフィードは数MB以下で、Vercel Serverless Functionsのメモリ制限内
- 実装がシンプルで保守しやすい

**Alternatives Considered**:

- ストリーミングパーサー: `gofeed` が直接サポートしておらず、複雑になる
- レスポンスサイズ制限: 仕様書のスコープ外

## Implementation Checklist

- [x] HTTP GETリクエストの実装方法を決定
- [x] タイムアウトとリダイレクト設定を決定
- [x] User-Agentヘッダー戦略を決定
- [x] エラーハンドリング戦略を決定
- [x] 並行処理構造の維持方法を決定
- [x] テスト戦略を決定
- [x] メモリ効率の考慮事項を評価

## Next Steps

Phase 1に進み、以下を作成:

1. **data-model.md**: データモデルの変更（既存のモデルをそのまま使用）
2. **contracts/**: APIコントラクトの確認（変更なし）
3. **quickstart.md**: 開発者向けクイックスタートガイド