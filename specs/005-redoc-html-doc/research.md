# Research: Redoc HTML Doc

## Decision: Redoc CLI を採用し、openapi-generator による HTML 生成を廃止

- Redoc CLI は OpenAPI 3.0/3.1 対応であり、視認性・保守性に優れる
- npm で容易に導入でき、CI/CD 環境でも利用実績が多い
- 公式テンプレートやカスタマイズ性も高い

## Rationale

- Redoc は API ドキュメントの可読性・UX に定評があり、開発者・利用者双方にとって利便性が高い
- CI/CD 自動化との親和性も高く、既存の openapi-generator よりも運用・保守コストが低減できる

## Alternatives considered

- openapi-generator: HTML 出力は可能だが、Redoc ほどの視認性・カスタマイズ性はない
- Swagger UI: インタラクティブ性は高いが、静的 HTML 生成やデザイン面で Redoc に劣る
- Stoplight: 有償・SaaS 依存のため除外

---

## Best Practices

- Redoc CLI は npm でグローバルインストール、または npx で都度実行
- CI/CD では `npx redoc-cli bundle openapi.yaml -o api-docs/index.html` などで自動生成
- 生成物は `contracts/api-docs/` など明示的なディレクトリに格納
- 参照手順・運用ルールは README 等で明記

---

## Patterns

- API 仕様変更時は必ず CI/CD で自動再生成
- 生成失敗時は CI でエラー通知
- 主要ブラウザでの表示確認を推奨
