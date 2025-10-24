# タスク一覧: Redoc HTML Doc

## フェーズ 1: セットアップ

- [x] T001 Redoc CLI を npm でインストールする（グローバルまたは devDependencies）
- [x] T002 contracts/api-docs/ ディレクトリを作成する

## フェーズ 2: 基盤構築

- [x] T003 openapi.yaml のバリデーション CI ステップを追加・確認（contracts/openapi.yaml）
- [x] T004 既存の openapi-generator による HTML 生成処理を削除（.github/workflows/）

## フェーズ 3: [US1] Redoc で API 定義書生成（P1）

- [x] T005 [US1] Redoc CLI で HTML API 定義書を自動生成する CI ステップを追加（.github/workflows/）
- [x] T006 [US1] 生成 HTML を contracts/api-docs/index.html に格納する
- [x] T007 [P] [US1] 生成 HTML の主要ブラウザ表示確認テストを追加（tests/contract/）
- [x] T008 [US1] 生成失敗時に CI でエラー通知する処理を追加

## フェーズ 4: [US2] API 定義書参照性向上（P2）

- [x] T009 [US2] README に API 定義書参照手順を明記（README.md, contracts/api-docs/README.md）
- [x] T010 [US2] 参照手順の独立テストを追加（tests/contract/）

## 最終フェーズ: 仕上げ・横断的対応

- [x] T011 Redoc CLI/CI 運用のクイックスタート手順を quickstart.md に記載
- [x] T012 主要ファイル・ディレクトリ構成を data-model.md に反映
- [x] T013 仕様・運用・参照ルールの最終レビュー

## 依存関係

- フェーズ 1→2→3（[US1]）→4（[US2]）→ 最終フェーズ

## 並列実行例

- T007, T010 は他タスクと並列実行可能

## 実装方針

- MVP: フェーズ 1〜3（[US1] Redoc による API 定義書自動生成まで）
- 段階的リリース: フェーズ 4 以降は追加価値・改善
