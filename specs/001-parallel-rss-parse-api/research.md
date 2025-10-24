# リサーチ: 並列 RSS パース API

## 言語/バージョン

- 決定: Go 最新版（1.21 以降）
- 理由: 並列処理・WebAPI 開発に強く、Vercel でもサポート
- 他案: Python, Node.js など

## 主要依存ライブラリ

- 決定: testify（テスト）、goroutine（並列）、net/http（標準 HTTP）、encoding/xml（RSS パース）
- 理由: Go 標準機能＋コミュニティ実績の高いライブラリ
- 他案: echo, chi（Web フレームワーク）、feedparser（外部）

## テスト

- 決定: testify
- 理由: モック・アサーションが充実し、外部 API のテストに最適
- 他案: 標準 testing のみ

## Vercel デプロイ

- 決定: Vercel（Go サーバーレス）
- 理由: クラウドデプロイ・スケーラビリティ・CI/CD が容易
- 他案: AWS Lambda, GCP Cloud Functions

## その他

- ストレージ不要（メモリのみ）
- パフォーマンス目標: 10 件 5 秒以内、50 件 10 秒以内
- 制約: <10 秒返却、メモリ消費抑制
- スケール: 1 リクエスト最大 100 件
