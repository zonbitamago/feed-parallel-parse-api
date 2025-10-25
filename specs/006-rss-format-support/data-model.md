# Data Model: RSS フォーマット対応

## Entity: Feed

- format_type: string ("rss1.0" | "rss2.0" | "atom")
- xml_data: string (raw XML)

## Entity: ParsedEntry

- title: string
- link: string
- published_at: string (ISO8601)
- summary: string

## Validation Rules

- format_type は 3 種類のいずれかのみ許容
- 必須要素（title, link, published_at）は各形式で必ず抽出
- 文字コードは UTF-8 限定
- 1 リクエスト最大 1MB
