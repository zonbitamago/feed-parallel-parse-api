# Tasks: API応答にfeedUrlフィールド追加によるマッチング精度改善

**Feature**: 001-fix-feedurl-api-mismatch
**Input**: Design documents from `/specs/001-fix-feedurl-api-mismatch/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: ✅ **TDD必須** - [Constitution（憲法）](../../.specify/memory/constitution.md)によりTest-Driven Developmentが絶対遵守

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## 🎯 t-wada式TDD原則（必読）

このタスクリストは**t-wada式Test-Driven Development**に完全準拠します。

### テスト駆動開発の本質

> **テストが仕様**: テストコードが要求仕様の実行可能なドキュメントとなる
>
> **1行のプロダクションコードも、失敗するテストなしには書かない**

### Red-Green-Refactorサイクル（絶対遵守）

1. **🔴 Red（失敗するテストを書く）**
   - 新しい機能のテストを書く
   - テストが失敗することを確認する（正しく失敗することを確認）
   - コンパイルエラーも「Red」に含まれる

2. **✅ Green（テストを通す）**
   - 最小限のコードでテストを通す
   - 3つの手法から選択:
     - **仮実装（Fake It）**: まず定数を返す → 徐々に変数化（不安なとき）
     - **明白な実装（Obvious Implementation）**: シンプルな操作はそのまま実装（自信があるとき）
     - **三角測量（Triangulation）**: 2つ以上のテストから一般化（抽象化の方向性が不明なとき）
   - 品質は問わない、まず動かす

3. **♻️ Refactor（リファクタリング）**
   - テストを通したまま、コードの品質を向上させる
   - 重複を排除、意図を明確にする
   - テストコードもリファクタリング対象

### ベイビーステップ（小さく確実に進む）

- **5-10分で完了するサイクル**を回す
- **頻繁なコミット**: Red→Green→Refactor の各フェーズでコミット
- **TODOリスト**: このtasks.mdがTODOリスト - 次にやることを1つずつ消化

### 参考資料

- 和田卓人『テスト駆動開発』（オーム社）
- Kent Beck『Test Driven Development: By Example』
- [Constitution（憲法）](../../.specify/memory/constitution.md) - プロジェクト全体のTDD原則

---

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

**Web app**:
- Backend: `pkg/models/`, `pkg/services/`, `tests/unit/`, `tests/integration/`, `tests/contract/`
- Frontend: `frontend/src/types/`, `frontend/src/hooks/`, `frontend/src/services/`, `frontend/tests/integration/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 環境確認と既存テストの実行

- [x] T001 既存のBackendテストを実行し、全テストが合格することを確認: `go test ./tests/unit/... -v`
- [x] T002 [P] 既存のFrontendテストを実行し、全テストが合格することを確認: `cd frontend && npm test`
- [x] T003 [P] ブランチ`001-fix-feedurl-api-mismatch`にチェックアウト済みであることを確認

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: この機能には特別なFoundational要件なし（既存インフラを使用）

**⚠️ SKIP**: 既存の型定義、テストフレームワーク、API構造を再利用するため、Phase 2はスキップ

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - フィード登録後の記事表示 (Priority: P1) 🎯 MVP

**Goal**: ユーザーがRSSフィードを登録したとき、システムはそのフィードの全記事を登録直後に表示する

**Independent Test**: 任意のRSSフィードURL（例: https://feeds.rebuild.fm/rebuildfm）を登録し、そのフィードの記事が5秒以内に記事リストに表示されることを確認する

**TDD Strategy**: Red-Green-Refactor サイクルを厳守（Constitution要件）

### 🔴 Red Phase: Tests for User Story 1（失敗するテストを先に書く）

> **テストが仕様**: これらのテストコードが要求仕様の実行可能なドキュメントとなる

**CRITICAL**: これらのテストは実装前に書き、失敗することを確認する
- 1行のプロダクションコードも、失敗するテストなしには書かない
- テストが失敗することを確認 = 正しく失敗することを確認（コンパイルエラーも「Red」）

**Red Phase の意義**:
- テストがない状態で実装すると、テストが実装に引きずられる
- テストを先に書くことで、「あるべき姿」を明確にする
- 失敗を確認することで、テスト自体が正しいことを検証

- [x] T004 [P] [US1] Backend: RSSFeedモデルにFeedURLフィールドが存在することをテスト `tests/unit/rss_model_test.go`（Red - コンパイルエラーを期待）
- [x] T005 [P] [US1] Backend: feedToRSSFeed関数がfeed.FeedLinkからFeedURLを設定することをテスト `tests/unit/rss_service_test.go`（Red - フィールド不在エラーを期待）
- [x] T006 [P] [US1] Backend: feed.FeedLinkが空の場合、リクエストURLにフォールバックすることをテスト `tests/unit/rss_service_test.go`（Red - ロジック未実装エラーを期待）
- [x] T007 [P] [US1] Frontend: RSSFeed型にfeedUrlフィールドが存在することをテスト `frontend/src/types/api.test.ts`（新規作成、Red - TypeScriptコンパイルエラーを期待）
- [x] T008 [P] [US1] Frontend: useFeedAPIフックがfeedUrlを使用してマッチングすることをテスト `frontend/src/hooks/useFeedAPI.test.ts`（Red - マッチング失敗を期待）

**Checkpoint**: 全テストが期待通り失敗することを確認（Red完了）
- ✅ コンパイルエラーまたはアサーション失敗を確認
- ✅ テストが正しく失敗することで、テスト自体の正当性を検証
- ❌ テストが通ってしまった場合、テストが間違っている

---

### ✅ Green Phase: Implementation for User Story 1（最小限の実装でテストを通す）

> **品質は問わない、まず動かす**: 最小限のコードでテストを通す。リファクタリングは次のフェーズで。

**CRITICAL**: 各実装後に対応するテストが通ることを確認

**実装手法の選択（t-wada式TDD）**:

1. **仮実装（Fake It）** - 不安なとき
   - まず定数を返す（例: `FeedURL = "https://example.com/rss"`）
   - テストを追加しながら徐々に変数化・一般化
   - つまずいたらこの手法に戻る

2. **明白な実装（Obvious Implementation）** - 自信があるとき ⭐️ 推奨
   - シンプルな操作はそのまま実装
   - フィールド追加、単純なマッピングはこれで十分
   - T009-T015は全て明白な実装で進められる

3. **三角測量（Triangulation）** - 抽象化の方向性が不明なとき
   - 2つ以上のテストから一般化を導く
   - 今回は使用しない（要件が明確なため）

**今回の推奨**: T009-T015は全て**明白な実装**で進める（シンプルなフィールド追加とマッピング）

#### Backend実装

- [x] T009 [US1] Backend: `pkg/models/rss.go`にFeedURLフィールド追加（`FeedURL string \`json:"feedUrl"\``）→ T004テスト合格を確認【明白な実装】
- [x] T010 [US1] Backend: `pkg/services/rss_service.go`のfeedToRSSFeed関数でfeed.FeedLinkからFeedURLを設定 → T005テスト合格を確認【明白な実装】
- [x] T011 [US1] Backend: `pkg/services/rss_service.go`でfeed.FeedLinkが空の場合のフォールバックロジック実装 → T006テスト合格を確認【明白な実装】
- [x] T012 [US1] Backend: 全Unit Testsを実行し、既存テスト含め全て合格することを確認: `go test ./tests/unit/... -v`

#### Frontend実装

- [x] T013 [P] [US1] Frontend: `frontend/src/types/api.ts`のRSSFeedインターフェースにfeedUrlフィールド追加 → T007テスト合格を確認【明白な実装】
- [x] T014 [US1] Frontend: `frontend/src/hooks/useFeedAPI.ts`のfindMatchingFeed関数で`f.link`を`f.feedUrl`に変更 → T008テスト合格を確認【明白な実装】
- [x] T015 [US1] Frontend: `frontend/src/hooks/useFeedAPI.ts`のconsole.warnメッセージを更新（`feeds.map(f => f.feedUrl)`）
- [x] T016 [US1] Frontend: 全Unit Testsを実行し、既存テスト含め全て合格することを確認: `cd frontend && npm test`

**Checkpoint**: 全テストが合格（Green完了）

- ✅ 全テストが合格することを確認
- ✅ コードの品質は問わない（次のRefactorフェーズで改善）
- ⚠️ つまずいた場合は「仮実装」に切り替える

---

### ♻️ Refactor Phase: Code Quality Improvement（コード品質向上）

> **テストを通したまま、コードの品質を向上させる**: リファクタリングは動作を変えずに構造を改善

**Refactor Phase の原則**:

- **重複を排除**: DRY（Don't Repeat Yourself）原則
- **意図を明確にする**: 変数名、関数名を改善
- **テストコードもリファクタリング対象**: テストの可読性も重要
- **小さく頻繁に**: 大きな変更は避け、小さく改善を繰り返す

**チェック項目**:

1. **重複コード**: 同じロジックが複数箇所にないか
2. **命名**: 変数名・関数名が意図を明確に表現しているか
3. **複雑度**: 関数が大きすぎないか（1関数1責務）
4. **型安全性（Frontend）**: `any`型を使っていないか
5. **エラーハンドリング（Backend）**: エラーが適切に処理されているか

- [x] T017 [P] [US1] Backend: コードレビュー - 重複コード、変数名、エラーハンドリングを確認
- [x] T018 [P] [US1] Frontend: コードレビュー - 重複コード、変数名、型安全性を確認
- [x] T019 [US1] Backend: 必要に応じてリファクタリング（テストを通したまま）
- [x] T020 [US1] Frontend: 必要に応じてリファクタリング（テストを通したまま）
- [x] T021 [US1] Backend + Frontend: 全テスト実行し、リファクタリング後も全て合格することを確認

**Checkpoint**: Refactor完了 - User Story 1のコア機能完成

- ✅ テストが全て合格したまま品質が向上
- ✅ コードの意図が明確になり、保守性が向上
- ⚠️ テストが失敗した場合、リファクタリングを巻き戻す

---

### 📋 Integration Tests for User Story 1

- [x] T022 [P] [US1] Frontend: `frontend/tests/integration/searchFlow.test.tsx`のMSWモックに`feedUrl`フィールド追加
- [x] T023 [US1] Frontend: 統合テストを実行し、フィードマッチングが成功することを確認: `cd frontend && npm test searchFlow.test.tsx`
- [x] T024 [P] [US1] Backend: API契約テスト `tests/contract/parse_api_test.go`でfeedUrlフィールドの存在を検証（新規テストケース追加）
- [x] T025 [US1] Backend: 契約テストを実行: `go test ./tests/contract/... -v`

**Checkpoint**: User Story 1の統合テスト完了

---

### 🧪 Manual Testing for User Story 1

- [ ] T026 [US1] ローカル環境でBackendを起動: `go run api/parse.go`（またはVercel devコマンド）
- [ ] T027 [US1] ローカル環境でFrontendを起動: `cd frontend && npm run dev`
- [ ] T028 [US1] 手動テスト: Rebuild.fm（https://feeds.rebuild.fm/rebuildfm）を登録し、記事が5秒以内に表示されることを確認
- [ ] T029 [US1] 手動テスト: 既に2つのフィードを登録している状態で3つ目のフィードを登録し、3つ全ての記事が正しく表示されることを確認
- [ ] T030 [US1] 手動テスト: 50件の記事を持つRSSフィードを登録し、50件全てが表示されることを確認

**Checkpoint**: ✅ **User Story 1完全に機能 - MVP達成！**

---

## Phase 4: User Story 2 - 正しいフィードタイトルの表示 (Priority: P2)

**Goal**: ユーザーがRSSフィードを登録したとき、システムは各記事の横に正しいフィードタイトル（RSSメタデータから取得）を表示する

**Independent Test**: 異なるタイトルを持つ3つのフィードを登録し、各記事が正しいフィードタイトルバッジを表示することを確認する

**Note**: この機能はUser Story 1のインフラを再利用（追加実装なし）

### Verification for User Story 2

- [ ] T031 [US2] 既存のコードレビュー: `frontend/src/hooks/useFeedAPI.ts`のupdateSubscriptionWithTitle関数がfeed.titleを正しく設定していることを確認
- [ ] T032 [US2] 既存のコードレビュー: `frontend/src/hooks/useFeedAPI.ts`のtransformArticles関数がfeedTitleを記事に設定していることを確認
- [ ] T033 [US2] 既存テストの確認: `frontend/src/hooks/useFeedAPI.test.ts`でフィードタイトルマッピングがテストされていることを確認

### 🧪 Manual Testing for User Story 2

- [ ] T034 [US2] 手動テスト: Rebuild.fm（https://feeds.rebuild.fm/rebuildfm）を登録し、全ての記事がフィードタイトル"Rebuild"を表示することを確認
- [ ] T035 [US2] 手動テスト: 5つの異なるフィードを登録し、各記事がその元フィードのタイトルを正確に表示することを確認

**Checkpoint**: ✅ **User Story 2完全に機能**

---

## Phase 5: User Story 3 - フィードURL正規化との互換性 (Priority: P3)

**Goal**: API応答に実際のRSSフィードURL（feedUrl）が含まれる場合、フロントエンドのURL正規化ロジック（末尾スラッシュ、http/https、www prefixの違いを処理）と互換性がある

**Independent Test**: 様々なURL形式（末尾スラッシュあり/なし、http vs https）でフィードを登録し、マッチングが正しく動作することを確認する

**Note**: この機能はPR #17のURL正規化ロジックを再利用（追加実装なし）

### 🔴 Red Phase: Tests for User Story 3

- [ ] T036 [P] [US3] Frontend: URL正規化テスト - 末尾スラッシュの違いでマッチング成功を確認 `frontend/src/hooks/useFeedAPI.test.ts`（新規テストケース）
- [ ] T037 [P] [US3] Frontend: URL正規化テスト - プロトコル（http/https）の違いでマッチング成功を確認 `frontend/src/hooks/useFeedAPI.test.ts`（新規テストケース）

### ✅ Green Phase: Implementation for User Story 3

- [ ] T038 [US3] 既存のURL正規化ロジック確認: `frontend/src/utils/urlNormalizer.ts`の実装を確認（変更不要）
- [ ] T039 [US3] 既存のURL正規化テスト確認: `frontend/src/utils/urlNormalizer.test.ts`に10テストケースが存在することを確認（変更不要）
- [ ] T040 [US3] T036, T037のテストを実行し、既存のnormalizeUrl関数で合格することを確認

### 🧪 Manual Testing for User Story 3

- [ ] T041 [US3] 手動テスト: APIがfeedUrl="https://example.com/rss/"を返し、ユーザーが"https://example.com/rss"（末尾スラッシュなし）を登録した場合にマッチング成功を確認
- [ ] T042 [US3] 手動テスト: APIがfeedUrl="http://example.com/feed"を返し、ユーザーが"https://example.com/feed"を登録した場合にマッチング成功を確認

**Checkpoint**: ✅ **User Story 3完全に機能**

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 全ユーザーストーリーに影響する改善

### Code Quality

- [x] T043 [P] Backend: Linter実行（存在する場合）: `golint ./pkg/...`
- [x] T044 [P] Frontend: Linter実行: `cd frontend && npm run lint`
- [x] T045 [P] Frontend: 型チェック: `cd frontend && npm run build`（TypeScriptコンパイルエラーがないことを確認）

### Test Coverage

- [ ] T046 [P] Backend: テストカバレッジ確認: `go test ./tests/... -cover`（新規コード100%を目標）
- [ ] T047 [P] Frontend: テストカバレッジ確認: `cd frontend && npm test -- --coverage`（新規コード100%を目標）

### Documentation

- [ ] T048 [P] API契約書の最終確認: `specs/001-fix-feedurl-api-mismatch/contracts/api-schema.json`がfeedUrlフィールドを正しく反映していることを確認
- [ ] T049 [P] Quickstartガイドの検証: `specs/001-fix-feedurl-api-mismatch/quickstart.md`の手順を実行し、正しく動作することを確認

### Final Validation

- [x] T050 Backend + Frontend: 全テストを最終実行し、全て合格することを確認（Backend + Frontend）
- [ ] T051 実際のRSSフィード（最低5種類）で手動テストを実行し、100%の記事表示成功率を確認
- [ ] T052 コンソールエラーがゼロであることを確認（特に「フィードマッチング失敗」エラー）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: SKIPPED - using existing infrastructure
- **User Stories (Phase 3-5)**: Can start immediately after Setup
  - User Story 1 (P1) - MVP: Start first, complete before US2/US3
  - User Story 2 (P2): Can start after US1, but benefits from US1 completion
  - User Story 3 (P3): Can start after US1, minimal additional work
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - Start immediately after Setup
- **User Story 2 (P2)**: Verification only, relies on US1 infrastructure
- **User Story 3 (P3)**: Verification only, relies on US1 infrastructure + PR #17 URL normalization

### Within Each User Story (TDD Cycle)

**CRITICAL**: 憲法で定められたRed-Green-Refactorサイクルを厳守

1. **Red**: 失敗するテストを先に書く（T004-T008）
2. **Green**: 最小限の実装でテストを通す（T009-T016）
3. **Refactor**: コード品質を向上（T017-T021）
4. **Integration**: 統合テスト追加（T022-T025）
5. **Manual**: 手動テスト実行（T026-T030）

### Parallel Opportunities

#### Setup Phase (Phase 1)
- T001, T002, T003: All can run in parallel

#### User Story 1 - Red Phase
- T004, T005, T006: Backend tests can run in parallel (different test functions)
- T007, T008: Frontend tests can run in parallel with Backend tests

#### User Story 1 - Green Phase
- T009, T010, T011: Sequential (依存関係あり)
- T013: Can run in parallel with T009-T011 (different codebase)
- T014, T015: Sequential (同じファイル)

#### User Story 1 - Refactor Phase
- T017, T018: Can run in parallel (different codebases)
- T019, T020: Can run in parallel (different codebases)

#### User Story 1 - Integration Tests
- T022, T024: Can run in parallel (different test files)
- T023, T025: Sequential (テスト実行は個別に確認)

#### User Story 3 - Red Phase
- T036, T037: Can run in parallel (different test cases)

#### Polish Phase
- T043, T044, T045, T046, T047, T048, T049: All can run in parallel

---

## Parallel Example: User Story 1

### Red Phase（テストを並列で書く）
```bash
# Launch all test writing tasks together:
Task: "[US1] Backend: RSSFeedモデルにFeedURLフィールドが存在することをテスト tests/unit/rss_model_test.go"
Task: "[US1] Backend: feedToRSSFeed関数がfeed.FeedLinkからFeedURLを設定することをテスト tests/unit/rss_service_test.go"
Task: "[US1] Backend: feed.FeedLinkが空の場合、リクエストURLにフォールバックすることをテスト tests/unit/rss_service_test.go"
Task: "[US1] Frontend: RSSFeed型にfeedUrlフィールドが存在することをテスト frontend/src/types/api.test.ts"
Task: "[US1] Frontend: useFeedAPIフックがfeedUrlを使用してマッチングすることをテスト frontend/src/hooks/useFeedAPI.test.ts"

# Result: 全テストが失敗することを確認（Red完了）
```

### Green Phase（Backend/Frontend並列実装可能）
```bash
# Backend implementation:
Task: "[US1] Backend: pkg/models/rss.goにFeedURLフィールド追加"
Task: "[US1] Backend: pkg/services/rss_service.goのfeedToRSSFeed関数でfeed.FeedLinkからFeedURLを設定"

# Frontend implementation (can run in parallel with Backend):
Task: "[US1] Frontend: frontend/src/types/api.tsのRSSFeedインターフェースにfeedUrlフィールド追加"
Task: "[US1] Frontend: frontend/src/hooks/useFeedAPI.tsのfindMatchingFeed関数でf.linkをf.feedUrlに変更"

# Result: 全テストが合格（Green完了）
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) - 推奨アプローチ

1. ✅ Complete Phase 1: Setup（T001-T003）
2. ⏭️ Skip Phase 2: Foundational（既存インフラ使用）
3. ✅ Complete Phase 3: User Story 1（T004-T030）
   - Red → Green → Refactor → Integration → Manual
4. ✅ **STOP and VALIDATE**: User Story 1を独立してテスト
5. 🚀 **Deploy/Demo if ready** - これでMVP完成！

### Incremental Delivery

1. Setup → User Story 1 → Test independently → **Deploy/Demo (MVP!)**
2. Add User Story 2 → Test independently → Deploy/Demo
3. Add User Story 3 → Test independently → Deploy/Demo
4. Polish & Cross-Cutting → Final Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With 2 developers:

1. **Developer A + B**: Complete Setup together (T001-T003)
2. **Developer A + B**: User Story 1 - Red Phase together (T004-T008)
3. **Developer A**: User Story 1 - Backend Green (T009-T012)
   **Developer B**: User Story 1 - Frontend Green (T013-T016) ← PARALLEL
4. **Developer A + B**: User Story 1 - Refactor + Integration + Manual (T017-T030)
5. **Developer A**: User Story 2 verification (T031-T035)
   **Developer B**: User Story 3 tests + verification (T036-T042) ← PARALLEL
6. **Developer A + B**: Polish together (T043-T052)

---

## Notes

### TDD実践のポイント

- **TDD必須**: [Constitution（憲法）](../../.specify/memory/constitution.md)により、Red-Green-Refactorサイクルを絶対遵守
- **ベイビーステップ**: 5-10分で完了するサイクルを回す（52タスクに細分化済み）
- **TODOリスト運用**: このtasks.mdがTODOリスト - チェックボックスを順に消化
- **watchモード禁止**: `npm test`（1回限り実行）を使用し、CPU負荷を抑える

### タスク管理

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] label**: Maps task to specific user story for traceability
- **Stop at any checkpoint**: 各チェックポイントで独立検証可能
- **Estimated total time**: 約2-3時間（quickstart.md参照）

### コミット戦略（頻繁なコミット）

**Red-Green-Refactor の各フェーズでコミット**:

```bash
# Red Phase（失敗するテストを書く）
git add tests/unit/rss_model_test.go
git commit -m "test(backend): [US1] RSSFeedモデルにFeedURLフィールドテスト追加（Red）"

# Green Phase（最小限の実装でテストを通す）
git add pkg/models/rss.go
git commit -m "feat(backend): [US1] RSSFeedモデルにFeedURLフィールド追加（Green）"

# Refactor Phase（コード品質を向上）
git add pkg/models/rss.go pkg/services/rss_service.go
git commit -m "refactor(backend): [US1] RSSFeed関連コードのリファクタリング（Refactor）"
```

**コミットメッセージの形式**:

- `test:` - Red Phase（テスト追加）
- `feat:` - Green Phase（機能実装）
- `refactor:` - Refactor Phase（品質向上）
- `[US1]`, `[US2]`, `[US3]` - User Story識別子
- `（Red）`, `（Green）`, `（Refactor）` - TDDフェーズ明記

**参考文献**:

- 和田卓人『テスト駆動開発』（オーム社）第1章「仮実装」
- Kent Beck『Test Driven Development: By Example』
- [Constitution（憲法）](../../.specify/memory/constitution.md) - プロジェクトTDD原則

---

## Task Summary

**Total Tasks**: 52
- Phase 1 (Setup): 3 tasks
- Phase 2 (Foundational): SKIPPED
- Phase 3 (User Story 1): 27 tasks (Red: 5, Green: 8, Refactor: 5, Integration: 4, Manual: 5)
- Phase 4 (User Story 2): 5 tasks
- Phase 5 (User Story 3): 7 tasks
- Phase 6 (Polish): 10 tasks

**Parallel Opportunities**: 20+ tasks marked [P] can run in parallel
**Independent Test Criteria**: Each user story has clear acceptance criteria and manual test steps
**Suggested MVP Scope**: Phase 1 + Phase 3 (User Story 1 only) = 30 tasks, 約2時間

**Format Validation**: ✅ ALL tasks follow the required checklist format with checkbox, ID, optional [P] marker, optional [Story] label, and file paths
