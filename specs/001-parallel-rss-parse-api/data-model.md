# データモデル: 並列 RSS パース API

## RSSFeed

- タイトル: string
- リンク: string
- 記事一覧: []Article

## Article

- タイトル: string
- リンク: string
- 公開日: string
- 概要: string

## ParseRequest

- RSS URL リスト: []string

## ParseResponse

- フィード一覧: []RSSFeed
- エラー情報: []ErrorInfo

## ErrorInfo

- URL: string
- エラー内容: string
