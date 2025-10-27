---
description: "FrontendテストのCI統合 - 実装タスクリスト"
---

# Tasks: FrontendテストのCI統合

**Input**: Design documents from `/specs/001-frontend-ci-tests/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: この機能では既存のFrontendテストスイート（Vitest）を活用するため、新規テストコードの作成は不要です。

**Organization**: タスクはUser Storyごとにグループ化され、各ストーリーを独立して実装・テスト可能にします。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: このタスクが属するUser Story（例: US1, US2, US3）
- 説明には正確なファイルパスを含める

## Path Conventions

このプロジェクトはWeb application構造（frontend + backend/api）を採用しています：
- **CI設定**: `.github/workflows/`
- **Frontend**: `frontend/src/`, `frontend/tests/`
- **Backend**: `api/`, `pkg/`

---

## Phase 1: Setup（共有インフラストラクチャ）

**Purpose**: 既存のCI設定ファイルの確認と、実装に必要な前提条件の検証

- [x] T001 既存のCI設定ファイル`.github/workflows/ci.yml`を確認し、現在のBackendテスト設定を理解する
- [x] T002 Frontendテストスイート（`frontend/tests/`）が正常に実行できることをローカル環境で確認（`cd frontend && npm test`）
- [x] T003 [P] Node.js 20.x LTSがローカル環境にインストールされていることを確認（`node --version`）

---

## Phase 2: Foundational（ブロッキング前提条件）

**Purpose**: すべてのUser Storyの実装に必要な基盤設定

**⚠️ CRITICAL**: このフェーズが完了するまで、どのUser Story作業も開始できません

- [x] T004 研究ドキュメント（research.md）を読み、GitHub Actions CI設定のベストプラクティスを理解する
- [x] T005 quickstart.mdを読み、実装手順と期待される動作を理解する

**Checkpoint**: 基盤準備完了 - User Story実装を並列開始可能

---

## Phase 3: User Story 1 - 開発者による変更の品質保証 (Priority: P1) 🎯 MVP

**Goal**: プルリクエスト作成時にFrontendテストを自動実行し、結果をPRに表示する

**Independent Test**: プルリクエストを作成し、CIパイプラインでFrontendテストが実行され、結果がプルリクエストに表示されることで独立してテスト可能

### Implementation for User Story 1

- [x] T006 [US1] `.github/workflows/ci.yml`を編集: 既存の`build-test`ジョブ名を`backend-test`に変更し、`name: Backend Tests (Go)`を追加
- [x] T007 [US1] `.github/workflows/ci.yml`を編集: `backend-test`ジョブに`timeout-minutes: 10`を追加（FR-007: タイムアウト設定）
- [x] T008 [US1] `.github/workflows/ci.yml`に新規ジョブ`frontend-test`を追加: `name: Frontend Tests (Vitest)`, `runs-on: ubuntu-latest`, `timeout-minutes: 10`を設定
- [x] T009 [US1] `frontend-test`ジョブに`actions/checkout@v3`ステップを追加
- [x] T010 [US1] `frontend-test`ジョブに`actions/setup-node@v4`ステップを追加: `node-version: '20'`, `cache: 'npm'`, `cache-dependency-path: frontend/package-lock.json`を設定
- [x] T011 [US1] `frontend-test`ジョブに`npm ci`実行ステップを追加: `working-directory: frontend`を設定
- [x] T012 [US1] `frontend-test`ジョブに`npm test`実行ステップを追加: `working-directory: frontend`を設定
- [x] T013 [US1] 変更をコミットし、feature branchにpush（`git add .github/workflows/ci.yml && git commit -m "feat: add frontend tests to CI" && git push`）
- [x] T014 [US1] GitHubでプルリクエストを作成し、CIが自動実行されることを確認（FR-001, FR-002, SC-001）
- [x] T015 [US1] プルリクエストページでFrontendテストの実行ログを確認し、テスト結果（成功/失敗）が表示されることを検証（FR-003, FR-004, SC-004）
- [x] T016 [US1] CIの実行時間が5分以内であることを確認（SC-002）

**Checkpoint**: この時点で、User Story 1は完全に機能し、独立してテスト可能です

---

## Phase 4: User Story 2 - メインブランチへのマージ前の品質ゲート (Priority: P2)

**Goal**: Frontendテストが成功した場合のみプルリクエストのマージを許可する

**Independent Test**: テストが失敗しているプルリクエストのマージを試み、マージがブロックされることで独立してテスト可能

### Implementation for User Story 2

- [x] T017 [US2] GitHub WebUIでリポジトリのSettings → Branchesに移動
- [x] T018 [US2] 保護対象ブランチ（`main`または`001-parallel-rss-parse-api`）のBranch protection rulesを編集
- [x] T019 [US2] "Require status checks to pass before merging"を有効化
- [x] T020 [US2] "Require branches to be up to date before merging"を有効化（推奨）
- [x] T021 [US2] ステータスチェック検索ボックスで`Backend Tests (Go)`と`Frontend Tests (Vitest)`を必須チェックに追加
- [x] T022 [US2] Branch protection rulesを保存
- [x] T023 [US2] テスト成功時: 既存のプルリクエストで"Merge pull request"ボタンが有効になることを確認（FR-006の正常系）
- [x] T024 [US2] テスト失敗時シミュレーション: わざと失敗するテストを追加（例: `frontend/tests/ci-test-failure.test.ts`）し、プルリクエストを更新
- [x] T025 [US2] プルリクエストで"Merge pull request"ボタンがブロックされ、"Required status check has failed"メッセージが表示されることを確認（FR-006, SC-003）
- [x] T026 [US2] 失敗テストを削除し、CIが再実行されてマージが再び可能になることを確認
- [x] T027 [US2] Branch protection設定により、テスト失敗時のマージが確実にブロックされることを文書化（quickstart.mdまたはREADME.md）

**Checkpoint**: この時点で、User Story 1とUser Story 2の両方が独立して動作します

---

## Phase 5: User Story 3 - テスト実行履歴の追跡 (Priority: P3)

**Goal**: 過去のプルリクエストとコミットのFrontendテスト実行結果を確認できる

**Independent Test**: 過去のプルリクエストを確認し、各コミットでのテスト実行履歴と結果が記録されていることで独立してテスト可能

### Implementation for User Story 3

- [ ] T028 [US3] GitHub WebUIで過去のプルリクエストを開き、"Checks"タブで`frontend-test`ジョブの実行履歴が表示されることを確認
- [ ] T029 [US3] 同じプルリクエストで複数回コミットを行い、各コミットごとにCI実行結果が記録されることを確認（FR-004, FR-005）
- [ ] T030 [US3] GitHub ActionsのWorkflow runs履歴（Actions → CI → All workflows）で、Frontendテスト実行の全履歴が確認できることを検証
- [ ] T031 [US3] 各実行の詳細ログが保持され、後から参照可能であることを確認（GitHub Actionsは90日間ログを保持）
- [ ] T032 [US3] プルリクエスト一覧ページで、各PRのテストステータス（✓成功、✗失敗、⏳実行中）が一目で分かることを確認（FR-005）
- [ ] T033 [US3] テスト実行履歴の追跡機能が正常に動作することを文書化（quickstart.mdの「次のステップ」セクション）

**Checkpoint**: すべてのUser Storyが独立して機能します

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 複数のUser Storyに影響する改善

- [ ] T034 [P] README.mdにFrontend CI統合の説明を追加（セットアップ方法へのリンク、成功基準など）
- [ ] T035 [P] quickstart.mdの動作確認セクションを実際に実行し、手順が正確であることを検証
- [ ] T036 トラブルシューティングセクション（quickstart.md）の各項目が実際に発生しうる問題をカバーしていることを確認
- [ ] T037 [P] CLAUDE.mdとCopilot instructions（`.github/copilot-instructions.md`）がCI設定の変更を反映していることを確認（既にupdate-agent-context.shで更新済み）
- [ ] T038 成功基準（SC-001〜SC-005）がすべて満たされていることを最終検証
- [ ] T039 Edge Cases（spec.md記載）への対応状況を確認し、必要に応じて文書化（CI環境エラー時の挙動など）
- [ ] T040 quickstart.mdのセットアップ手順を最初から実行し、15分以内に完了することを確認

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし - すぐに開始可能
- **Foundational (Phase 2)**: Setupの完了に依存 - すべてのUser Storyをブロック
- **User Stories (Phase 3-5)**: すべてFoundationalフェーズの完了に依存
  - User Storyは並列実行可能（スタッフがいる場合）
  - または優先順位順に順次実行（P1 → P2 → P3）
- **Polish (Final Phase)**: 実装したいすべてのUser Storyの完了に依存

### User Story Dependencies

- **User Story 1 (P1)**: Foundational (Phase 2)後に開始可能 - 他のストーリーに依存しない
- **User Story 2 (P2)**: User Story 1の完了に依存（CI設定が存在する必要がある） - ただし独立してテスト可能
- **User Story 3 (P3)**: User Story 1の完了に依存（CI実行履歴が必要） - ただし独立してテスト可能

### Within Each User Story

User Story 1（P1）:
- T006-T012: CI設定ファイルの編集（順次実行、同じファイルを編集）
- T013: コミット&プッシュ（T006-T012の完了後）
- T014-T016: 検証タスク（T013の完了後、並列実行可能）

User Story 2（P2）:
- T017-T022: Branch protection設定（順次実行、GitHub WebUI操作）
- T023-T027: 検証タスク（T022の完了後、順次実行）

User Story 3（P3）:
- T028-T033: すべて検証タスク（並列実行可能）

### Parallel Opportunities

- **Phase 1 Setup**: T001, T002, T003 は独立しているが、所要時間が短いため並列化の効果は限定的
- **Phase 2 Foundational**: T004とT005は並列読み込み可能
- **User Stories**: US2とUS3は、US1完了後に並列で開始可能（ただし、US2はGitHub WebUI操作、US3は検証のみ）
- **Phase 6 Polish**: T034, T035, T037 は並列実行可能（異なるファイル）

---

## Parallel Example: User Story 1

```bash
# User Story 1の検証タスクを並列実行:
# （ただし、実際にはT014の完了を待ってからT015, T016を実行する必要がある）

# CI設定ファイル編集（T006-T012）は同一ファイルを編集するため順次実行
# T013: コミット&プッシュ後、以下を確認:

Task T014: "GitHubでプルリクエストを作成し、CIが自動実行されることを確認"
# ↓ T014完了後、並列実行可能:
Task T015: "プルリクエストページでFrontendテストの実行ログを確認"
Task T016: "CIの実行時間が5分以内であることを確認"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational（CRITICAL - すべてのストーリーをブロック）
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: User Story 1を独立してテスト
5. 準備ができたらデプロイ/デモ

### Incremental Delivery

1. Setup + Foundational完了 → 基盤準備完了
2. User Story 1追加 → 独立してテスト → デプロイ/デモ（MVP!）
3. User Story 2追加 → 独立してテスト → デプロイ/デモ
4. User Story 3追加 → 独立してテスト → デプロイ/デモ
5. 各ストーリーは、以前のストーリーを壊すことなく価値を追加

### Parallel Team Strategy

複数の開発者がいる場合:

1. チーム全体でSetup + Foundationalを完了
2. Foundational完了後:
   - Developer A: User Story 1（最優先）
   - Developer B: User Story 1完了を待機 → User Story 2開始
   - Developer C: User Story 1完了を待機 → User Story 3開始（またはUser Story 2と並行）
3. ストーリーは独立して完了し、統合される

**注意**: User Story 2とUser Story 3はUser Story 1に依存するため、完全な並列実行は不可。ただし、US1完了後はUS2とUS3を並列で進めることが可能。

---

## Notes

- [P] タスク = 異なるファイル、依存関係なし
- [Story] ラベルは、タスクを特定のUser Storyにマッピングしてトレーサビリティを確保
- 各User Storyは独立して完了・テスト可能であるべき
- 各タスクまたは論理的なグループの後にコミット
- どのチェックポイントでも停止し、ストーリーを独立して検証可能
- 避けるべきこと: 曖昧なタスク、同じファイルの競合、独立性を損なうストーリー間の依存関係

---

## Task Count Summary

- **Total Tasks**: 40
- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 2 tasks
- **Phase 3 (User Story 1 - P1)**: 11 tasks
- **Phase 4 (User Story 2 - P2)**: 11 tasks
- **Phase 5 (User Story 3 - P3)**: 6 tasks
- **Phase 6 (Polish)**: 7 tasks

## Parallel Opportunities Identified

- Phase 1: 限定的（タスク時間が短い）
- Phase 2: T004 || T005（ドキュメント読み込み）
- Phase 3: T015 || T016（検証タスク）
- Phase 6: T034 || T035 || T037（異なるファイル編集）

## Independent Test Criteria

- **US1**: プルリクエスト作成でCI自動実行、結果表示
- **US2**: テスト失敗時にマージブロック、成功時に許可
- **US3**: 過去のPRとコミットのテスト実行履歴を確認可能

## Suggested MVP Scope

**MVP = User Story 1のみ**（Phase 1 + Phase 2 + Phase 3）
- 合計16タスク（Setup 3 + Foundational 2 + US1 11）
- これだけで、プルリクエスト作成時の自動Frontendテスト実行という主要な価値を提供
- FR-001〜FR-005, FR-007, FR-008, SC-001, SC-002, SC-004を満たす
