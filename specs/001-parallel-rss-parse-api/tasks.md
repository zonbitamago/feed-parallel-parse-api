---
description: "並列RSSパースAPIの実装タスクリスト"
---

# タスク: 並列 RSS パース API

**Input**: specs/001-parallel-rss-parse-api/
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

## Phase 1: Setup（プロジェクト初期化）

- [x] T001 プロジェクト構成作成（src/, tests/, contracts/）
- [x] T002 Go モジュール初期化（go mod init）
- [x] T003 [P] testify インストール（テスト用）
- [x] T004 Vercel CLI インストール

---

## Phase 2: Foundational（全ユーザーストーリー共通の基盤）

- [x] T005 RSSFeed, Article, ParseRequest, ParseResponse, ErrorInfo モデル作成（src/models/）
- [x] T006 [P] サービス層の雛形作成（src/services/rss_service.go）
- [x] T007 API エンドポイント雛形作成（src/api/parse.go）
- [x] T008 [P] ログ出力・エラーハンドリング基盤（src/lib/log.go, src/lib/error.go）

---

## Phase 3: ユーザーストーリー 1 - 複数 RSS 取得 (P1)

**Goal**: 複数 RSS URL を受け取り、並列でパースしまとめて返却
**Independent Test**: 複数 URL 送信で全 RSS 内容がまとめて返却される

- [x] T011 [P] [US1] モデルテスト（tests/unit/rss_model_test.go）
- [x] T012 [P] [US1] サービステスト（tests/unit/rss_service_test.go）
- [x] T013 [P] [US1] API コントラクトテスト（tests/contract/parse_api_test.go）
- [x] T009 [P] [US1] RSS パースロジック実装（src/services/rss_service.go）
- [x] T010 [P] [US1] /parse エンドポイント実装（src/api/parse.go）

---

## Phase 4: ユーザーストーリー 2 - 大量 URL 対応 (P2)

**Goal**: 50 件以上の URL でもタイムアウトせず返却
**Independent Test**: 50 件以上送信で全結果が一定時間内に返却

- [x] T015 [P] [US2] パフォーマンステスト（tests/integration/performance_test.go）
- [x] T016 [P] [US2] エラー・タイムアウトテスト（tests/integration/error_test.go）
- [x] T014 [P] [US2] 並列処理最適化（src/services/rss_service.go）

---

## Phase 5: ユーザーストーリー 3 - レスポンス整形 (P3)

**Goal**: 統一フォーマット（JSON 配列）で返却
**Independent Test**: 返却データが仕様通りの JSON 形式

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T021 [P] CI/CD 設定（.github/workflows/ci.yml）
- [x] T022 [P] コードリファクタ・最終レビュー

---

## 依存関係・並列実行例

- Phase 1, 2 は並列可能
- 各ユーザーストーリーは独立して実装・テスト可能
- テストは各実装と並行して進行可能

## 実装戦略

- MVP はユーザーストーリー 1（複数 RSS 取得）
- 以降、段階的に P2, P3, Polish へ拡張
