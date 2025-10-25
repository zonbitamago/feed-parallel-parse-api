# Tasks: RSS フォーマット対応

## Phase 1: Setup

- [x] T001 プロジェクトに gofeed 依存を追加する（go.mod）
- [x] T002 src/services/rss_service.go の雛形を作成
- [x] T003 tests/unit/rss_service_test.go の雛形を作成

## Phase 2: Foundational

- [x] T004 Feed/ParsedEntry モデルを src/models/rss.go に定義
- [x] T005 パース共通インターフェースを src/services/rss_service.go に定義

## Phase 3: User Story 1 - 複数 RSS 形式のパース (P1)

- [x] T006 [P] [US1] RSS1.0 パース処理を src/services/rss_service.go に実装
- [x] T007 [P] [US1] RSS2.0 パース処理を src/services/rss_service.go に実装
- [x] T008 [P] [US1] Atom パース処理を src/services/rss_service.go に実装
- [x] T009 [P] [US1] 各形式のパース単体テストを tests/unit/rss_service_test.go に実装
- [x] T010 [US1] /parse エンドポイントの OpenAPI 仕様を contracts/openapi.yaml に記述

## Phase 4: User Story 2 - 不正な形式の検出 (P2)

- [x] T011 [US2] サポート外/不正なフィード入力時のエラー処理を src/services/rss_service.go に実装
- [x] T012 [US2] エラー時のテストケースを tests/unit/rss_service_test.go に追加
- [x] T013 [US2] エラー応答仕様を contracts/openapi.yaml に記述

## Phase 5: Polish & Cross-Cutting

- [x] T014 README/quickstart.md に導入・利用手順を記載
- [x] T015 パフォーマンス・制約条件のテストを tests/integration/performance_test.go に追加
- [x] T016 コード・仕様・テストの最終レビュー

## Dependencies

- User Story 1（T006-T010）完了後に User Story 2（T011-T013）を着手
- Setup/Foundational は全ストーリーの前提

## Parallel Execution Examples

- T006, T007, T008 は同時並行可能（異なるパース処理）
- T009, T010 は T006-T008 完了後に並行可能
- T011, T012, T013 は User Story 2 内で並行可能

## Implementation Strategy

- まず User Story 1（P1）を MVP とし、RSS/Atom 主要 3 形式のパースとテストを最優先で実装
- User Story 2（P2）は MVP 後に着手
- 各タスクは独立してテスト可能な単位で分割
