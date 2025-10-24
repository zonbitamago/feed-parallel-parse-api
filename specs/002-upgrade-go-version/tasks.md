# Tasks: Go バージョン 1.25 へのアップグレード

## Phase 1: Setup

- [x] T001 プロジェクトの現状バックアップを取得する
- [x] T002 go.mod の現状バージョンを確認する

## Phase 2: Foundational

- [x] T003 依存パッケージの Go1.25 対応状況を調査する
- [x] T004 [P] 主要依存パッケージのバージョン情報を data-model.md に記載

## Phase 3: User Story 1 (P1) - Go バージョンアップ

- [x] T005 [US1] go.mod の go バージョンを 1.25 に変更する
- [x] T006 [US1] 依存パッケージが Go1.25 に対応しているか再確認する
- [x] T007 [US1] [P] ビルド・テストを実行し正常動作を確認する
- [ ] T008 [US1] [P] 依存パッケージが未対応の場合は go.mod のバージョンを 1.24 に戻す
  - 補足: 主要依存パッケージは全て Go1.25 に対応済みのため、ロールバックは不要です。
- [x] T009 [US1] [P] quickstart.md に手順を記載

## Final Phase: Polish & Cross-Cutting

- [x] T010 仕様書・データモデル・quickstart の最終レビュー
- [x] T011 [P] README.md にアップグレード手順を反映
- [x] T012 [P] CI（GitHub Actions 等）の Go バージョンを 1.25 に変更する .github/workflows/ 配下

## Dependencies

- T001→T002→T003→T004→T005→T006→T007/T008/T009（並列可）→T010/T011（並列可）

## Parallel Execution Examples

- T004, T007, T008, T009, T011 は他タスクと並列実行可能

## Implementation Strategy

- MVP は T005〜T007（go.mod 変更 → ビルド・テスト成功）
- 以降はロールバック・手順記載・ドキュメント整備

## Independent Test Criteria

- T007: go.mod が 1.25 でビルド・テスト成功
- T008: 依存パッケージ未対応時に 1.24 へロールバックしビルド・テスト成功
- T009: quickstart.md に手順が明記されている
