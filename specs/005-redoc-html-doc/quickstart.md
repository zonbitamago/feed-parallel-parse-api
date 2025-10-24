# Quickstart: Redoc HTML Doc

## 1. Redoc CLI のインストール

```sh
npm install -g redoc-cli
```

または

```sh
npx redoc-cli bundle contracts/openapi.yaml -o contracts/api-docs/index.html
```

## 2. API 定義書の自動生成（CI/CD 例）

- CI/CD ワークフローで以下コマンドを実行

```sh
npx redoc-cli bundle contracts/openapi.yaml -o contracts/api-docs/index.html
```

## 3. 参照方法

- 生成された `contracts/api-docs/index.html` をブラウザで開く
- 参照手順・運用ルールは README 等に明記

## 4. トラブルシュート

- openapi.yaml が不正な場合、Redoc CLI はエラーを返す
- CI/CD でエラー通知されるように設定

---

- 詳細な運用・カスタマイズは [Redoc 公式ドキュメント](https://github.com/Redocly/redoc) を参照
