---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Feature**: [###-feature-name]
**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

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
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

<!-- 
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.
  
  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/
  
  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment
  
  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with [framework] dependencies
- [ ] T003 [P] Configure linting and formatting tools

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 Setup database schema and migrations framework
- [ ] T005 [P] Implement authentication/authorization framework
- [ ] T006 [P] Setup API routing and middleware structure
- [ ] T007 Create base models/entities that all stories depend on
- [ ] T008 Configure error handling and logging infrastructure
- [ ] T009 Setup environment configuration management

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

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

- [ ] T010 [P] [US1] [テスト内容] in tests/[path]（Red - [期待する失敗]を期待）
- [ ] T011 [P] [US1] [テスト内容] in tests/[path]（Red - [期待する失敗]を期待）

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
   - まず定数を返す
   - テストを追加しながら徐々に変数化・一般化
   - つまずいたらこの手法に戻る

2. **明白な実装（Obvious Implementation）** - 自信があるとき ⭐️ 推奨
   - シンプルな操作はそのまま実装
   - 単純なCRUD、フィールド追加、マッピングはこれで十分

3. **三角測量（Triangulation）** - 抽象化の方向性が不明なとき
   - 2つ以上のテストから一般化を導く
   - 複雑なビジネスロジックで使用

**今回の推奨**: [推奨手法を明記]

- [ ] T012 [P] [US1] [実装内容] in src/[path] → T010テスト合格を確認【[推奨手法]】
- [ ] T013 [US1] [実装内容] in src/[path] → T011テスト合格を確認【[推奨手法]】
- [ ] T014 [US1] 全テストを実行し、既存テスト含め全て合格することを確認

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
4. **型安全性**: `any`型を使っていないか
5. **エラーハンドリング**: エラーが適切に処理されているか

- [ ] T015 [P] [US1] コードレビュー - 重複コード、変数名、エラーハンドリングを確認
- [ ] T016 [US1] 必要に応じてリファクタリング（テストを通したまま）
- [ ] T017 [US1] 全テスト実行し、リファクタリング後も全て合格することを確認

**Checkpoint**: Refactor完了 - User Story 1のコア機能完成

- ✅ テストが全て合格したまま品質が向上
- ✅ コードの意図が明確になり、保守性が向上
- ⚠️ テストが失敗した場合、リファクタリングを巻き戻す

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [ ] T018 [P] [US2] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T019 [P] [US2] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for User Story 2

- [ ] T020 [P] [US2] Create [Entity] model in src/models/[entity].py
- [ ] T021 [US2] Implement [Service] in src/services/[service].py
- [ ] T022 [US2] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] T023 [US2] Integrate with User Story 1 components (if needed)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [ ] T024 [P] [US3] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T025 [P] [US3] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for User Story 3

- [ ] T026 [P] [US3] Create [Entity] model in src/models/[entity].py
- [ ] T027 [US3] Implement [Service] in src/services/[service].py
- [ ] T028 [US3] Implement [endpoint/feature] in src/[location]/[file].py

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] Additional unit tests (if requested) in tests/unit/
- [ ] TXXX Security hardening
- [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Contract test for [endpoint] in tests/contract/test_[name].py"
Task: "Integration test for [user journey] in tests/integration/test_[name].py"

# Launch all models for User Story 1 together:
Task: "Create [Entity1] model in src/models/[entity1].py"
Task: "Create [Entity2] model in src/models/[entity2].py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

### TDD実践のポイント

- **TDD必須**: [Constitution（憲法）](../../.specify/memory/constitution.md)により、Red-Green-Refactorサイクルを絶対遵守
- **ベイビーステップ**: 5-10分で完了するサイクルを回す（タスクは細分化済み）
- **TODOリスト運用**: このtasks.mdがTODOリスト - チェックボックスを順に消化
- **watchモード禁止**: `npm test`（1回限り実行）を使用し、CPU負荷を抑える

### タスク管理

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] label**: Maps task to specific user story for traceability
- **Stop at any checkpoint**: 各チェックポイントで独立検証可能
- Each user story should be independently completable and testable
- Verify tests fail before implementing

### コミット戦略（頻繁なコミット）

**Red-Green-Refactor の各フェーズでコミット**:

```bash
# Red Phase（失敗するテストを書く）
git add tests/[path]
git commit -m "test([scope]): [US#] [テスト内容]（Red）"

# Green Phase（最小限の実装でテストを通す）
git add src/[path]
git commit -m "feat([scope]): [US#] [実装内容]（Green）"

# Refactor Phase（コード品質を向上）
git add src/[path]
git commit -m "refactor([scope]): [US#] [リファクタリング内容]（Refactor）"
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
