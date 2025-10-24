# Research: OpenAPI API Doc CI

## Decision: 技術選定・運用方針

- OpenAPI ファイルはリポジトリ内で一元管理し、API インターフェースを定義する
- CI（GitHub Actions）で OpenAPI Generator 等を用いて API 定義書（HTML 等）を自動生成する
- 定義書生成時に OpenAPI ファイルの妥当性を検証し、エラーは CI で通知する
- 複数バージョンの API 定義がある場合は、最新コミットのバージョンのみ定義書生成対象とする

## Rationale: なぜこの選択か

- OpenAPI は業界標準であり、API 仕様の一元管理・自動ドキュメント生成に最適
- CI による自動化で、ドキュメントの最新性・品質を担保できる
- バージョン管理をシンプルにし、運用負荷を低減

## Alternatives considered

- 全バージョン分の定義書生成（運用負荷・管理コスト増大のため不採用）
- 手動で API 定義書を作成（自動化・品質担保の観点から不採用）
- 他の API 定義フォーマット（Swagger, RAML 等）（OpenAPI が最も普及しているため不採用）
