# Tasks: コードベース全体のリファクタリング

**Feature**: 015-codebase-refactoring
**Input**: Design documents from `/specs/015-codebase-refactoring/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅

**Tests**: ✅ **TDD必須** - [Constitution（憲法）](../../.specify/memory/constitution.md)によりTest-Driven Developmentが絶対遵守

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## 🎯 t-wada式TDD原則（必読）- リファクタリング特化版

このタスクリストは**t-wada式Test-Driven Development**の **Refactorフェーズ** に特化しています。

### リファクタリングとTDDの関係

> **リファクタリング = TDDサイクルの「Refactor」フェーズ**
>
> **テストを通したまま、コードの品質を向上させる**

### Red-Green-Refactorサイクル（リファクタリング時）

このリファクタリングでは、TDDサイクルは以下のように適用されます：

1. **🔴 Red（失敗するテスト）** ← **既に完了**
   - 既存のテストが既に存在
   - リファクタリング前のテストは全て合格している状態

2. **✅ Green（テストを通す）** ← **既に完了**
   - 既存のコードが既にテストをパス
   - 機能は正常に動作している状態

3. **♻️ Refactor（リファクタリング）** ← **これから実施**
   - **テストを通したまま、コードの品質を向上させる**
   - 重複を排除、意図を明確にする
   - 既存機能の動作は変更しない（破壊的変更なし）
   - **リファクタリング後も全テストが合格することを保証**

### リファクタリングの原則

1. **既存テストの保護**:
   - リファクタリング中も既存のテストが全て合格し続ける
   - テストが失敗した場合、リファクタリングを巻き戻す

2. **小さく頻繁に**:
   - 1つの変更ごとにテスト実行
   - 5-10分で完了する小さなステップ

3. **機能を変更しない**:
   - 外部から見た動作は同じまま
   - 内部構造のみを改善

### ベイビーステップ（小さく確実に進む）

- **5-10分で完了するサイクル**を回す
- **頻繁なテスト実行**: 各タスク完了後に `npm test` または `go test`
- **頻繁なコミット**: 1つの改善ごとにコミット
- **TODOリスト**: このtasks.mdがTODOリスト - 次にやることを1つずつ消化

### 参考資料

- 和田卓人『テスト駆動開発』（オーム社）第3章「リファクタリング」
- Martin Fowler『Refactoring』
- [Constitution（憲法）](../../.specify/memory/constitution.md) - プロジェクト全体のTDD原則

---

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/`, `cmd/server/`, `pkg/`
- Paths shown below use actual project structure from plan.md

---

## Phase 1: Setup & Prerequisites（前提確認）

**Purpose**: リファクタリング前の環境確認と既存テストの実行

**⚠️ CRITICAL**: リファクタリング開始前に、既存のテストが全て合格することを確認

- [x] T001 既存のフロントエンドテストを全て実行し、合格することを確認 (`npm test` in frontend/)
- [x] T002 既存のバックエンドテストを全て実行し、合格することを確認 (`go test ./...` from repository root)
- [x] T003 現在のコードカバレッジを記録し、ベースラインとする（frontend: `npm test -- --coverage`, backend: `go test -cover ./...`）

**Checkpoint**: 全テスト合格、カバレッジベースライン記録完了

- ✅ フロントエンドテスト全合格
- ✅ バックエンドテスト全合格
- ✅ カバレッジベースライン記録済み
- ⚠️ テストが失敗している場合、リファクタリングを開始しない

---

## Phase 2: User Story 1 - API層の保守性向上 (Priority: P1) 🎯

**Goal**: API層のエラーハンドリング改善とコード重複排除（約70行削減）

**Independent Test**: frontend/src/services/feedAPI.ts のユニットテストを実行し、各エラー種別が正しく分類されることを確認

**TDD Strategy**: Refactorフェーズ - テストを通したまま、コードの品質を向上させる

### ♻️ Refactor Phase: API層の改善

**Refactor Phase の原則**:
- **テストを通したまま**: 各変更後に `npm test` を実行
- **重複を排除**: 約70行のコード重複を削除
- **型安全性向上**: ErrorType enum を導入

**チェック項目**:
1. **重複コード**: parseFeeds() と fetchFeedTitle() の共通ロジック
2. **型安全性**: FeedAPIError に型プロパティを追加
3. **エラー種別**: timeout、network、parse、abort を enum で定義

#### Step 1: ErrorType enum の定義

- [x] T004 [P] [US1] FeedAPIErrorType enum を定義 in frontend/src/services/feedAPI.ts（timeout, network, parse, abort）
- [x] T005 [US1] FeedAPIError クラスに type プロパティを追加 in frontend/src/services/feedAPI.ts
- [x] T006 [US1] npm test を実行し、既存テスト全て合格することを確認

**Checkpoint**: ErrorType enum 定義完了、既存テスト全合格

#### Step 2: 共通ユーティリティ関数の作成

- [x] T007 [P] [US1] feedAPIUtils.ts ファイルを新規作成 in frontend/src/services/feedAPIUtils.ts
- [x] T008 [US1] createFeedAPIRequest<T>() 関数を実装（ジェネリック型、AbortController、タイムアウト処理を含む）in frontend/src/services/feedAPIUtils.ts
- [x] T009 [US1] npm test を実行し、既存テスト全て合格することを確認

**Checkpoint**: 共通ユーティリティ関数作成完了、既存テスト全合格

#### Step 3: parseFeeds() のリファクタリング

- [ ] T010 [US1] parseFeeds() を createFeedAPIRequest() を使用するように変更 in frontend/src/services/feedAPI.ts
- [ ] T011 [US1] npm test を実行し、parseFeeds() のテストが全て合格することを確認
- [ ] T012 [US1] parseFeeds() 内の重複コードを削除（約35行削減見込み）

**Checkpoint**: parseFeeds() リファクタリング完了、テスト全合格

#### Step 4: fetchFeedTitle() のリファクタリング

- [ ] T013 [P] [US1] fetchFeedTitle() を createFeedAPIRequest() を使用するように変更 in frontend/src/services/feedAPI.ts
- [ ] T014 [US1] npm test を実行し、fetchFeedTitle() のテストが全て合格することを確認
- [ ] T015 [US1] fetchFeedTitle() 内の重複コードを削除（約35行削減見込み）

**Checkpoint**: fetchFeedTitle() リファクタリング完了、テスト全合格

#### Step 5: 最終検証

- [ ] T016 [US1] npm test を実行し、フロントエンド全テストが合格することを確認
- [ ] T017 [US1] コードレビュー - 重複コード削減、型安全性向上、エラーハンドリング明確化を確認
- [ ] T018 [US1] コードカバレッジを測定し、ベースライン以上であることを確認（`npm test -- --coverage`）

**Checkpoint**: User Story 1 完了 - API層の保守性向上

- ✅ ErrorType enum 導入完了
- ✅ 共通ユーティリティ関数作成完了
- ✅ 約70行のコード重複削減
- ✅ 全テスト合格、カバレッジ維持

---

## Phase 3: User Story 2 - 状態管理の簡素化 (Priority: P1)

**Goal**: フィードプレビューとArticleContextの状態管理を一元化し、不整合を防止

**Independent Test**: frontend/src/hooks/useFeedPreview.ts と frontend/src/contexts/ArticleContext.tsx のテストを実行し、状態遷移が正しく動作することを確認

**TDD Strategy**: Refactorフェーズ - テストを通したまま、状態管理を改善

### ♻️ Refactor Phase: 状態管理の改善

#### Step 1: useFeedPreview.ts の状態一元化

- [ ] T019 [P] [US2] PreviewState 型を定義（Discriminated Union: idle, loading, success, error）in frontend/src/hooks/useFeedPreview.ts
- [ ] T020 [US2] useFeedPreview フックを PreviewState 型を使用するように変更 in frontend/src/hooks/useFeedPreview.ts
- [ ] T021 [US2] npm test を実行し、useFeedPreview のテストが全て合格することを確認
- [ ] T022 [US2] 複数の状態変数（isLoadingPreview, previewTitle, previewError）を PreviewState に統合

**Checkpoint**: useFeedPreview.ts リファクタリング完了、テスト全合格

#### Step 2: FeedManager.tsx の更新

- [ ] T023 [US2] FeedManager.tsx を PreviewState 型に対応するように更新 in frontend/src/components/FeedManager/FeedManager.tsx
- [ ] T024 [US2] npm test を実行し、FeedManager のテストが全て合格することを確認

**Checkpoint**: FeedManager.tsx 更新完了、テスト全合格

#### Step 3: ArticleContext.tsx の filterArticles() 一元化

- [ ] T025 [P] [US2] ArticleContext.tsx の reducer 内で filterArticles() が呼ばれている箇所を特定 in frontend/src/contexts/ArticleContext.tsx
- [ ] T026 [US2] 共通のフィルタリング処理を抽象化し、reducer 内で一元管理 in frontend/src/contexts/ArticleContext.tsx
- [ ] T027 [US2] npm test を実行し、ArticleContext のテストが全て合格することを確認
- [ ] T028 [US2] SET_ARTICLES、SET_SEARCH_QUERY、SET_SELECTED_FEED の3箇所で filterArticles() 呼び出しが共通化されていることを確認

**Checkpoint**: ArticleContext.tsx リファクタリング完了、テスト全合格

#### Step 4: 最終検証

- [ ] T029 [US2] npm test を実行し、フロントエンド全テストが合格することを確認
- [ ] T030 [US2] コードレビュー - 状態管理の一貫性、型安全性を確認
- [ ] T031 [US2] コードカバレッジを測定し、ベースライン以上であることを確認

**Checkpoint**: User Story 2 完了 - 状態管理の簡素化

- ✅ PreviewState 型導入完了
- ✅ useFeedPreview.ts リファクタリング完了
- ✅ ArticleContext.tsx リファクタリング完了
- ✅ 全テスト合格、カバレッジ維持

---

## Phase 4: User Story 3 - useEffectの複雑度削減 (Priority: P2)

**Goal**: FeedContainer.tsxの8個のuseEffectをカスタムフックに集約し、可読性40%向上

**Independent Test**: frontend/src/containers/FeedContainer.tsx のテストを実行し、フィード同期ロジックが正しく動作することを確認

**TDD Strategy**: Refactorフェーズ - テストを通したまま、useEffectを集約

### ♻️ Refactor Phase: useEffect集約

#### Step 1: useFeedSync() カスタムフックの作成

- [ ] T032 [P] [US3] useFeedSync.ts ファイルを新規作成 in frontend/src/hooks/useFeedSync.ts
- [ ] T033 [US3] useFeedSync() フックの骨組みを実装（subscriptions, articles を引数に取る）in frontend/src/hooks/useFeedSync.ts
- [ ] T034 [US3] FeedContainer.tsx の1つ目のuseEffectをuseFeedSync()に移行 in frontend/src/hooks/useFeedSync.ts
- [ ] T035 [US3] npm test を実行し、FeedContainer のテストが合格することを確認

**Checkpoint**: useFeedSync() 作成開始、1つ目のuseEffect移行完了

#### Step 2: 残りのuseEffectを段階的に移行

- [ ] T036 [US3] FeedContainer.tsx の2つ目〜4つ目のuseEffectをuseFeedSync()に移行 in frontend/src/hooks/useFeedSync.ts
- [ ] T037 [US3] npm test を実行し、FeedContainer のテストが合格することを確認
- [ ] T038 [US3] FeedContainer.tsx の5つ目〜8つ目のuseEffectをuseFeedSync()に移行 in frontend/src/hooks/useFeedSync.ts
- [ ] T039 [US3] npm test を実行し、FeedContainer のテストが合格することを確認

**Checkpoint**: 全8個のuseEffect移行完了、テスト全合格

#### Step 3: FeedContainer.tsx の更新

- [ ] T040 [US3] FeedContainer.tsx でuseFeedSync()を呼び出すように変更 in frontend/src/containers/FeedContainer.tsx
- [ ] T041 [US3] eslint-disable コメントを削除 in frontend/src/containers/FeedContainer.tsx
- [ ] T042 [US3] npm test を実行し、FeedContainer のテストが全て合格することを確認

**Checkpoint**: FeedContainer.tsx 更新完了、テスト全合格

#### Step 4: 最終検証

- [ ] T043 [US3] npm test を実行し、フロントエンド全テストが合格することを確認
- [ ] T044 [US3] FeedContainer.tsx の行数を測定し、可読性が40%向上していることを確認（目安: 8個のuseEffect分の行数削減）
- [ ] T045 [US3] コードカバレッジを測定し、ベースライン以上であることを確認

**Checkpoint**: User Story 3 完了 - useEffectの複雑度削減

- ✅ useFeedSync() カスタムフック作成完了
- ✅ 8個のuseEffect集約完了
- ✅ FeedContainer.tsx 可読性40%向上
- ✅ 全テスト合格、カバレッジ維持

---

## Phase 5: User Story 4 - パフォーマンス最適化 (Priority: P2)

**Goal**: SearchBar.tsxのdebounce機能を改善し、FeedManager.tsxのuseMemo依存配列を最適化

**Independent Test**: SearchBar.tsx と FeedManager.tsx のテストを実行し、パフォーマンス改善を確認

**TDD Strategy**: Refactorフェーズ - テストを通したまま、パフォーマンスを最適化

### ♻️ Refactor Phase: パフォーマンス最適化

#### Step 1: useDebounce() カスタムフックの作成

- [ ] T046 [P] [US4] useDebounce.ts ファイルを新規作成 in frontend/src/hooks/useDebounce.ts
- [ ] T047 [US4] useDebounce<T>(value: T, delay: number) 関数を実装 in frontend/src/hooks/useDebounce.ts
- [ ] T048 [US4] npm test を実行し、useDebounce のテストが合格することを確認（必要に応じてテスト追加）

**Checkpoint**: useDebounce() 作成完了

#### Step 2: SearchBar.tsx の debounce 改善

- [ ] T049 [US4] SearchBar.tsx で useDebounce() を使用するように変更 in frontend/src/components/SearchBar/SearchBar.tsx
- [ ] T050 [US4] npm test を実行し、SearchBar のテストが全て合格することを確認
- [ ] T051 [US4] 親コンポーネントで onSearch を useCallback でメモ化（必要に応じて）

**Checkpoint**: SearchBar.tsx debounce改善完了、テスト全合格

#### Step 3: FeedManager.tsx の useMemo 依存配列最適化

- [ ] T052 [P] [US4] FeedManager.tsx の subscriptionListItems useMemo の依存配列を分析 in frontend/src/components/FeedManager/FeedManager.tsx
- [ ] T053 [US4] 不要な依存を削除し、必要最小限の依存のみに絞り込み in frontend/src/components/FeedManager/FeedManager.tsx
- [ ] T054 [US4] useFeedTitleEdit フックから返される関数をメモ化（必要に応じて）
- [ ] T055 [US4] npm test を実行し、FeedManager のテストが全て合格することを確認

**Checkpoint**: FeedManager.tsx useMemo最適化完了、テスト全合格

#### Step 4: 最終検証

- [ ] T056 [US4] npm test を実行し、フロントエンド全テストが合格することを確認
- [ ] T057 [US4] React DevTools Profiler でパフォーマンス測定（SearchBar debounce動作確認、FeedManager 再レンダリング削減確認）
- [ ] T058 [US4] コードカバレッジを測定し、ベースライン以上であることを確認

**Checkpoint**: User Story 4 完了 - パフォーマンス最適化

- ✅ useDebounce() カスタムフック作成完了
- ✅ SearchBar.tsx debounce改善完了
- ✅ FeedManager.tsx useMemo最適化完了
- ✅ 全テスト合格、カバレッジ維持

---

## Phase 6: User Story 5 - バックエンド設定の柔軟性向上 (Priority: P3)

**Goal**: logger設計改善とCORS設定の環境変数化

**Independent Test**: cmd/server/main.go のテストを実行し、環境変数から設定が正しく読み込まれることを確認

**TDD Strategy**: Refactorフェーズ - テストを通したまま、バックエンド設定を改善

### ♻️ Refactor Phase: バックエンド設定改善

#### Step 1: logger設計改善

- [ ] T059 [P] [US5] logger定義をinit()関数に移動 in cmd/server/main.go
- [ ] T060 [US5] go test ./... を実行し、バックエンドテストが全て合格することを確認
- [ ] T061 [US5] テストファイルでの logger 初期化チェックを削除（必要に応じて）

**Checkpoint**: logger設計改善完了、テスト全合格

#### Step 2: CORS設定の環境変数化

- [ ] T062 [P] [US5] CORS_ALLOWED_ORIGINS 環境変数から読み込むロジックを実装 in cmd/server/main.go
- [ ] T063 [US5] デフォルト値 "*" を設定（環境変数が未設定の場合）
- [ ] T064 [US5] カンマ区切りで複数ORIGIN指定に対応
- [ ] T065 [US5] go test ./... を実行し、バックエンドテストが全て合格することを確認

**Checkpoint**: CORS設定環境変数化完了、テスト全合格

#### Step 3: 最終検証

- [ ] T066 [US5] go test ./... を実行し、バックエンド全テストが合格することを確認
- [ ] T067 [US5] go test -cover ./... を実行し、カバレッジがベースライン以上であることを確認
- [ ] T068 [US5] コードレビュー - logger設計、CORS設定の柔軟性を確認

**Checkpoint**: User Story 5 完了 - バックエンド設定の柔軟性向上

- ✅ logger設計改善完了
- ✅ CORS設定環境変数化完了
- ✅ 全テスト合格、カバレッジ維持

---

## Phase 7: User Story 6 - コード品質向上 (Priority: P3)

**Goal**: useFeedAPI.ts の関数分離、エラーメッセージ一元管理、変数名明確化

**Independent Test**: 各変更後にテストを実行し、既存機能が正常動作することを確認

**TDD Strategy**: Refactorフェーズ - テストを通したまま、コード品質を向上

### ♻️ Refactor Phase: コード品質向上

#### Step 1: useFeedAPI.ts の関数分離

- [ ] T069 [P] [US6] findMatchingFeed() を feedAPIUtils.ts に移動 in frontend/src/services/feedAPIUtils.ts
- [ ] T070 [P] [US6] transformArticles() を feedAPIUtils.ts に移動 in frontend/src/services/feedAPIUtils.ts
- [ ] T071 [US6] useFeedAPI.ts を更新し、feedAPIUtils からインポート in frontend/src/hooks/useFeedAPI.ts
- [ ] T072 [US6] npm test を実行し、useFeedAPI のテストが全て合格することを確認

**Checkpoint**: useFeedAPI.ts 関数分離完了、テスト全合格

#### Step 2: エラーメッセージ一元管理

- [ ] T073 [P] [US6] errorMessages.ts を拡充し、全エラーメッセージを定数として定義 in frontend/src/constants/errorMessages.ts
- [ ] T074 [US6] FeedManager.tsx 内のエラーメッセージ文字列を errorMessages から参照 in frontend/src/components/FeedManager/FeedManager.tsx
- [ ] T075 [US6] その他コンポーネント内のエラーメッセージを errorMessages から参照（必要に応じて）
- [ ] T076 [US6] npm test を実行し、全テストが合格することを確認

**Checkpoint**: エラーメッセージ一元管理完了、テスト全合格

#### Step 3: 変数名明確化

- [ ] T077 [P] [US6] updatedSubscriptions → subscriptionsWithFetchedTitles に変数名変更 in frontend/src/hooks/useFeedAPI.ts
- [ ] T078 [US6] その他不明確な変数名を明確化（必要に応じて）
- [ ] T079 [US6] npm test を実行し、全テストが合格することを確認

**Checkpoint**: 変数名明確化完了、テスト全合格

#### Step 4: 最終検証

- [ ] T080 [US6] npm test を実行し、フロントエンド全テストが合格することを確認
- [ ] T081 [US6] コードレビュー - 関数分離、エラーメッセージ一元管理、変数名明確化を確認
- [ ] T082 [US6] コードカバレッジを測定し、ベースライン以上であることを確認

**Checkpoint**: User Story 6 完了 - コード品質向上

- ✅ useFeedAPI.ts 関数分離完了
- ✅ エラーメッセージ一元管理完了
- ✅ 変数名明確化完了
- ✅ 全テスト合格、カバレッジ維持

---

## Phase 8: Polish & 最終検証

**Purpose**: 全体の最終検証とドキュメント更新

- [ ] T083 [P] npm test を実行し、フロントエンド全テストが合格することを確認
- [ ] T084 [P] go test ./... を実行し、バックエンド全テストが合格することを確認
- [ ] T085 npm test -- --coverage を実行し、カバレッジがベースライン以上であることを確認
- [ ] T086 go test -cover ./... を実行し、カバレッジがベースライン以上であることを確認
- [ ] T087 コードレビュー - 14箇所のリファクタリングが全て完了していることを確認
- [ ] T088 Success Criteria の達成確認（SC-001〜SC-010）
- [ ] T089 [P] README.md の更新（必要に応じて、技術スタック、コマンドなど）
- [ ] T090 SPECIFICATION.md の更新（リファクタリング内容を反映）

**Checkpoint**: リファクタリング完了 - 全体検証完了

- ✅ 全テスト合格（フロントエンド + バックエンド）
- ✅ カバレッジがベースライン以上
- ✅ 14箇所のリファクタリング完了
- ✅ Success Criteria 達成
- ✅ ドキュメント更新完了

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - MUST complete first（既存テストの確認）
- **User Stories (Phase 2-7)**: 各ユーザーストーリーは独立して実装可能
  - 優先度順に実施推奨: US1(P1) → US2(P1) → US3(P2) → US4(P2) → US5(P3) → US6(P3)
  - 並列実施も可能（複数開発者がいる場合）
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Setup完了後に開始可能 - 他のストーリーに依存なし
- **US2 (P1)**: Setup完了後に開始可能 - 他のストーリーに依存なし
- **US3 (P2)**: Setup完了後に開始可能 - 他のストーリーに依存なし
- **US4 (P2)**: Setup完了後に開始可能 - 他のストーリーに依存なし
- **US5 (P3)**: Setup完了後に開始可能 - 他のストーリーに依存なし
- **US6 (P3)**: US1完了後に開始推奨（feedAPIUtils.ts を使用するため）

### Parallel Opportunities

- US1, US2, US3, US4, US5は並列実施可能（異なるファイルを変更）
- US6はUS1完了後に開始推奨だが、並列実施も可能
- 各ユーザーストーリー内で [P] マークのタスクは並列実施可能

---

## Implementation Strategy

### MVP First (User Story 1 & 2 のみ)

1. Complete Phase 1: Setup（既存テスト確認）
2. Complete Phase 2: User Story 1（API層リファクタリング）
3. Complete Phase 3: User Story 2（状態管理簡素化）
4. **STOP and VALIDATE**: テスト実行、動作確認
5. 優先度P1の改善完了

### Incremental Delivery

1. Setup → US1 → US2（P1完了）→ 検証
2. US3 → US4（P2完了）→ 検証
3. US5 → US6（P3完了）→ 検証
4. Polish & 最終検証

### Parallel Team Strategy

複数の開発者がいる場合:

1. チームでSetup完了
2. Setup完了後:
   - Developer A: US1（API層）
   - Developer B: US2（状態管理）
   - Developer C: US3（useEffect）
3. 各ストーリー完了後に統合テスト

---

## Notes

### TDD実践のポイント（リファクタリング特化）

- **Refactorフェーズ**: Red-Green-Refactorの「Refactor」フェーズを実施
- **既存テストの保護**: リファクタリング中も全テストが合格し続ける
- **小さく頻繁に**: 1つの変更ごとにテスト実行（5-10分サイクル）
- **watchモード禁止**: `npm test`（1回限り実行）を使用し、CPU負荷を抑える

### タスク管理

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] label**: Maps task to specific user story for traceability
- **各チェックポイント**: 独立検証可能、テスト全合格を確認
- **機能を変更しない**: リファクタリングは外部から見た動作を変えない

### コミット戦略（頻繁なコミット）

**Refactorフェーズのコミット**:

```bash
# 各リファクタリング完了時
git add [変更ファイル]
git commit -m "refactor([scope]): [US#] [リファクタリング内容]（Refactor）"

# 例
git commit -m "refactor(api): [US1] API呼び出しロジックをcreateFeedAPIRequest()に集約（Refactor）"
git commit -m "refactor(state): [US2] PreviewStateをDiscriminated Unionに変更（Refactor）"
git commit -m "refactor(hooks): [US3] 8個のuseEffectをuseFeedSync()に集約（Refactor）"
```

**コミットメッセージの形式**:

- `refactor:` - Refactor Phase（リファクタリング）
- `[US1]`, `[US2]`, `[US3]` - User Story識別子
- `（Refactor）` - TDDフェーズ明記

### Success Criteria 確認（Phase 8で検証）

- **SC-001**: API層のコード重複が約70行削減 ✅
- **SC-002**: FeedContainer.tsxのuseEffectが8個→1個に集約、可読性40%向上 ✅
- **SC-003**: useFeedPreview.tsの状態管理が単一オブジェクトに統一 ✅
- **SC-004**: SearchBar.tsxのdebounce機能が正しく動作 ✅
- **SC-005**: 全テストケース（npm test, go test）が合格 ✅
- **SC-006**: コードカバレッジがベースライン以上 ✅
- **SC-007**: エラーメッセージが一元管理 ✅
- **SC-008**: CORS設定が環境変数で制御可能 ✅
- **SC-009**: logger設計改善、テスト時初期化チェック不要 ✅
- **SC-010**: 変数名明確化、コードレビュー時質問件数減少 ✅

**参考文献**:

- 和田卓人『テスト駆動開発』（オーム社）第3章「リファクタリング」
- Martin Fowler『Refactoring』
- [Constitution（憲法）](../../.specify/memory/constitution.md) - プロジェクトTDD原則
