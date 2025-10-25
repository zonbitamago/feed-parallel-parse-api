# Quickstart: RSS フォーマット対応

1. `go get github.com/mmcdole/gofeed` で依存追加
2. `src/services/rss_service.go` にパース処理を実装
3. `tests/unit/rss_service_test.go` で各形式のテストケース作成
4. `go test ./...` で全テストが通ることを確認
5. サポート外/不正なフィードはエラーとなることを確認
