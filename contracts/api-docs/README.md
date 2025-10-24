# API 定義書参照方法

このディレクトリには自動生成された API 定義 HTML（OpenAPI ベース）が格納されています。

## 参照手順

1. `contracts/api-docs/index.html` をブラウザで開くことで、最新の API 定義書を閲覧できます。
2. API 仕様変更時は CI/CD により自動で再生成・更新されます。

## 運用ポイント

- チームメンバーは常に `contracts/api-docs/index.html` を参照してください。
- 最新化は GitHub Actions のワークフローで担保されています。
- 仕様変更時は `contracts/openapi.yaml` を修正し、プッシュしてください。

---

**この README は API 定義書の参照性向上のために追加されています。**
