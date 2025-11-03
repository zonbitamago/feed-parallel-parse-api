# Tasks: 購読フィード0件時のインポート機能有効化

**Feature**: 001-enable-import-zero-feeds
**Input**: Design documents from `/specs/001-enable-import-zero-feeds/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

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

- **Web app**: `frontend/src/`, `frontend/tests/`
- This feature modifies frontend only

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: プロジェクト初期化と既存コードの確認

- [ ] T001 プロジェクト構造を確認（frontend/src/components/FeedManager/）
- [ ] T002 既存のImportExportButtonsコンポーネントを確認（frontend/src/components/FeedManager/ImportExportButtons.tsx）
- [ ] T003 既存のFeedManagerコンポーネントを確認（frontend/src/components/FeedManager/FeedManager.tsx）

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 既存テストの確認とテスト環境の準備

**⚠️ CRITICAL**: この変更はテストファースト（TDD）で実装する必要がある

- [ ] T004 既存のImportExportButtonsテストを確認（frontend/src/components/FeedManager/__tests__/ImportExportButtons.test.tsx）
- [ ] T005 既存のFeedManagerテストを確認（frontend/src/components/FeedManager/__tests__/FeedManager.test.tsx）
- [ ] T006 テスト環境が正常に動作することを確認（npm test）

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 初回利用時のフィードインポート (Priority: P1) 🎯 MVP

**Goal**: 購読フィード0件の状態でインポートボタンを表示し、クリック可能にする

**Independent Test**: 購読フィード0件の状態でインポートボタンをクリックし、JSONファイルを選択することで、フィードリストが正常にインポートされることを確認できる

**TDD Strategy**: Red-Green-Refactor サイクルを厳守（Constitution要件）

### 🔴 Red Phase: Tests for User Story 1（失敗するテストを先に書く）

> **テストが仕様**: これらのテストコードが要求仕様の実行可能なドキュメントとなる

**CRITICAL**: これらのテストは実装前に書き、失敗することを確認する

- 1行のプロダクションコードも、失敗するテストなしには書かない
- テストが失敗することを確認 = 正しく失敗することを確認（TypeScriptコンパイルエラーも「Red」）

**Red Phase の意義**:

- テストがない状態で実装すると、テストが実装に引きずられる
- テストを先に書くことで、「あるべき姿」を明確にする
- 失敗を確認することで、テスト自体が正しいことを検証

- [ ] T007 [P] [US1] ImportExportButtonsに`subscriptionCount`プロップが必要なテストを追加 in frontend/src/components/FeedManager/__tests__/ImportExportButtons.test.tsx（Red - TypeScriptコンパイルエラーを期待）
- [ ] T008 [P] [US1] 購読フィード0件時にインポートボタンが表示されるテストを追加 in frontend/src/components/FeedManager/__tests__/ImportExportButtons.test.tsx（Red - アサーション失敗を期待）
- [ ] T009 [P] [US1] 購読フィード0件時にインポートボタンがクリック可能なテストを追加 in frontend/src/components/FeedManager/__tests__/ImportExportButtons.test.tsx（Red - アサーション失敗を期待）
- [ ] T010 [P] [US1] FeedManagerが0件時にImportExportButtonsを表示するテストを追加 in frontend/src/components/FeedManager/__tests__/FeedManager.test.tsx（Red - アサーション失敗を期待）

**Checkpoint**: 全テストが期待通り失敗することを確認（Red完了）

- ✅ TypeScriptコンパイルエラーまたはアサーション失敗を確認
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
   - 単純なProps追加、条件分岐はこれで十分

3. **三角測量（Triangulation）** - 抽象化の方向性が不明なとき
   - 2つ以上のテストから一般化を導く
   - 複雑なビジネスロジックで使用

**今回の推奨**: **明白な実装（Obvious Implementation）** - Props追加と条件分岐はシンプルな操作

- [ ] T011 [US1] ImportExportButtonsPropsに`subscriptionCount: number`を追加 in frontend/src/components/FeedManager/ImportExportButtons.tsx → T007テスト合格を確認【明白な実装】
- [ ] T012 [US1] ImportExportButtonsコンポーネントで`subscriptionCount`プロップを受け取る in frontend/src/components/FeedManager/ImportExportButtons.tsx → T008テスト合格を確認【明白な実装】
- [ ] T013 [US1] FeedManagerで`subscriptions.length > 0`条件を削除 in frontend/src/components/FeedManager/FeedManager.tsx → T010テスト合格を確認【明白な実装】
- [ ] T014 [US1] FeedManagerからImportExportButtonsに`subscriptionCount={subscriptions.length}`を渡す in frontend/src/components/FeedManager/FeedManager.tsx → T009, T010テスト合格を確認【明白な実装】
- [ ] T015 [US1] 全テストを実行し、既存テスト含め全て合格することを確認（npm test）

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
2. **命名**: 変数名・関数名が意図を明確に表現しているか（`subscriptionCount`は適切か）
3. **複雑度**: 関数が大きすぎないか（1関数1責務）
4. **型安全性**: `any`型を使っていないか
5. **エラーハンドリング**: エラーが適切に処理されているか

- [ ] T016 [P] [US1] コードレビュー - Props型定義、変数名、コンポーネント構造を確認
- [ ] T017 [US1] 必要に応じてリファクタリング（テストを通したまま） - classNameの可読性、型定義の一貫性
- [ ] T018 [US1] 全テスト実行し、リファクタリング後も全て合格することを確認（npm test）

**Checkpoint**: Refactor完了 - User Story 1のコア機能完成

- ✅ テストが全て合格したまま品質が向上
- ✅ コードの意図が明確になり、保守性が向上
- ⚠️ テストが失敗した場合、リファクタリングを巻き戻す

---

## Phase 4: User Story 2 - エクスポート機能の適切な無効化 (Priority: P2)

**Goal**: 購読フィード0件の状態でエクスポートボタンを無効化（disabled）し、視覚的フィードバックを提供する

**Independent Test**: 購読フィード0件の状態でエクスポートボタンが無効化され、1件以上の状態では有効化されることを確認できる。視覚的フィードバック（スタイル変更）も確認可能。

**TDD Strategy**: Red-Green-Refactor サイクルを厳守（Constitution要件）

### 🔴 Red Phase: Tests for User Story 2

- [ ] T019 [P] [US2] 購読フィード0件時にエクスポートボタンがdisabled状態のテストを追加 in frontend/src/components/FeedManager/__tests__/ImportExportButtons.test.tsx（Red - アサーション失敗を期待）
- [ ] T020 [P] [US2] 購読フィード0件時にエクスポートボタンに`opacity-50`クラスが適用されるテストを追加 in frontend/src/components/FeedManager/__tests__/ImportExportButtons.test.tsx（Red - アサーション失敗を期待）
- [ ] T021 [P] [US2] 購読フィード0件時にエクスポートボタンに`cursor-not-allowed`クラスが適用されるテストを追加 in frontend/src/components/FeedManager/__tests__/ImportExportButtons.test.tsx（Red - アサーション失敗を期待）
- [ ] T022 [P] [US2] 購読フィード1件以上の時にエクスポートボタンが有効化されるテストを追加 in frontend/src/components/FeedManager/__tests__/ImportExportButtons.test.tsx（Red - アサーション失敗を期待）

**Checkpoint**: 全テストが期待通り失敗することを確認（Red完了）

---

### ✅ Green Phase: Implementation for User Story 2

**今回の推奨**: **明白な実装（Obvious Implementation）** - disabled属性と条件付きclassNameの追加

- [ ] T023 [US2] エクスポートボタンに`disabled={subscriptionCount === 0}`を追加 in frontend/src/components/FeedManager/ImportExportButtons.tsx → T019, T022テスト合格を確認【明白な実装】
- [ ] T024 [US2] エクスポートボタンのclassNameに条件分岐を追加（0件時: `opacity-50 cursor-not-allowed`, 1件以上: `hover:bg-blue-700`） in frontend/src/components/FeedManager/ImportExportButtons.tsx → T020, T021テスト合格を確認【明白な実装】
- [ ] T025 [US2] 全テストを実行し、既存テスト含め全て合格することを確認（npm test）

**Checkpoint**: 全テストが合格（Green完了）

---

### ♻️ Refactor Phase: Code Quality Improvement

- [ ] T026 [P] [US2] コードレビュー - className文字列の可読性、条件分岐のロジックを確認
- [ ] T027 [US2] 必要に応じてリファクタリング（テストを通したまま） - テンプレートリテラルの整形、条件式の明確化
- [ ] T028 [US2] 全テスト実行し、リファクタリング後も全て合格することを確認（npm test）

**Checkpoint**: Refactor完了 - User Story 2完成

**Checkpoint**: この時点で、User Story 1とUser Story 2の両方が独立して動作することを確認

---

## Phase 5: User Story 3 - アクセシビリティ対応 (Priority: P3)

**Goal**: スクリーンリーダーやキーボード操作を使用するユーザーが、インポート/エクスポート機能の状態を理解できる

**Independent Test**: スクリーンリーダーでボタンの状態（有効/無効）が正しく読み上げられ、キーボード操作でボタンにフォーカスできることを確認できる

**TDD Strategy**: Red-Green-Refactor サイクルを厳守（Constitution要件）

### 🔴 Red Phase: Tests for User Story 3

- [ ] T029 [P] [US3] スクリーンリーダーでエクスポートボタンの無効状態を検証するテストを追加 in frontend/src/components/FeedManager/__tests__/ImportExportButtons.test.tsx（Red - アサーション失敗を期待）
- [ ] T030 [P] [US3] キーボード操作（Tab、Enter）でボタンにフォーカスできることを検証するテストを追加 in frontend/src/components/FeedManager/__tests__/ImportExportButtons.test.tsx（Red - アサーション失敗を期待）

**Checkpoint**: 全テストが期待通り失敗することを確認（Red完了）

---

### ✅ Green Phase: Implementation for User Story 3

**今回の推奨**: **明白な実装（Obvious Implementation）** - disabled属性で十分（aria-disabled不要）

- [ ] T031 [US3] disabled属性がスクリーンリーダーで正しく読み上げられることを確認（実装は既存のdisabled属性で対応済み） → T029テスト合格を確認【明白な実装】
- [ ] T032 [US3] キーボード操作のアクセシビリティを確認（実装は既存のbutton要素で対応済み） → T030テスト合格を確認【明白な実装】
- [ ] T033 [US3] 全テストを実行し、既存テスト含め全て合格することを確認（npm test）

**Checkpoint**: 全テストが合格（Green完了）

---

### ♻️ Refactor Phase: Code Quality Improvement

- [ ] T034 [P] [US3] コードレビュー - アクセシビリティ属性、セマンティックHTMLを確認
- [ ] T035 [US3] 必要に応じてリファクタリング（テストを通したまま） - フォーカススタイルの改善（必要に応じて）
- [ ] T036 [US3] 全テスト実行し、リファクタリング後も全て合格することを確認（npm test）

**Checkpoint**: Refactor完了 - User Story 3完成

**Checkpoint**: すべてのユーザーストーリーが独立して機能することを確認

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 複数のユーザーストーリーに影響する改善

- [ ] T037 [P] FeedManagerテストに追加のエッジケーステストを追加（購読フィードが0件から1件に変わる瞬間） in frontend/src/components/FeedManager/__tests__/FeedManager.test.tsx
- [ ] T038 [P] リスト折りたたみ時のボタン非表示を確認するテストを追加 in frontend/src/components/FeedManager/__tests__/FeedManager.test.tsx
- [ ] T039 全テストを実行し、すべてのテストが合格することを確認（npm test）
- [ ] T040 カバレッジレポートを生成し、新規コード100%カバレッジを確認（npm test -- --coverage）
- [ ] T041 TypeScript型チェックを実行し、エラーがないことを確認（npm run build）
- [ ] T042 ESLintを実行し、警告がないことを確認（npm run lint）
- [ ] T043 開発サーバーで手動テストを実行し、すべての機能が正常に動作することを確認（npm run dev）

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
- **User Story 2 (P2)**: Can start after User Story 1 completion - Depends on `subscriptionCount` prop from US1
- **User Story 3 (P3)**: Can start after User Story 2 completion - Depends on `disabled` attribute from US2

### Within Each User Story

- Tests MUST be written and FAIL before implementation（Red-Green-Refactorサイクル）
- Props/型定義の変更 → コンポーネント実装 → テスト合格確認
- Refactorは全テスト合格後に実施

### Parallel Opportunities

- All Setup tasks can run in parallel（T001-T003）
- All Foundational tasks can run in parallel（T004-T006）
- Within each user story's Red phase, all test tasks marked [P] can run in parallel
- コードレビュータスク（T016, T026, T034）は並列実行可能（異なるファイル）

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (Red Phase):
Task: "ImportExportButtonsに`subscriptionCount`プロップが必要なテストを追加 in frontend/src/components/FeedManager/__tests__/ImportExportButtons.test.tsx"
Task: "購読フィード0件時にインポートボタンが表示されるテストを追加 in frontend/src/components/FeedManager/__tests__/ImportExportButtons.test.tsx"
Task: "購読フィード0件時にインポートボタンがクリック可能なテストを追加 in frontend/src/components/FeedManager/__tests__/ImportExportButtons.test.tsx"
Task: "FeedManagerが0件時にImportExportButtonsを表示するテストを追加 in frontend/src/components/FeedManager/__tests__/FeedManager.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup（T001-T003）
2. Complete Phase 2: Foundational（T004-T006）
3. Complete Phase 3: User Story 1（T007-T018）
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Sequential Team Strategy

With single developer（推奨）:

1. Complete Setup + Foundational
2. User Story 1（P1） → 完了してから次へ
3. User Story 2（P2） → 完了してから次へ
4. User Story 3（P3） → 完了してから次へ
5. Polish & Cross-Cutting Concerns

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
git add frontend/src/components/FeedManager/__tests__/*
git commit -m "test(FeedManager): [US1] 購読フィード0件時のインポートボタン表示テスト追加（Red）"

# Green Phase（最小限の実装でテストを通す）
git add frontend/src/components/FeedManager/ImportExportButtons.tsx
git commit -m "feat(ImportExportButtons): [US1] subscriptionCountプロップ追加（Green）"

# Refactor Phase（コード品質を向上）
git add frontend/src/components/FeedManager/ImportExportButtons.tsx
git commit -m "refactor(ImportExportButtons): [US1] className可読性向上（Refactor）"
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
