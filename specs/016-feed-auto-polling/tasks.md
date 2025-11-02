---

description: "Task list for Feed Auto Polling feature implementation"
---

# Tasks: フィード自動ポーリング機能

**Feature**: 016-feed-auto-polling
**Input**: Design documents from `/specs/016-feed-auto-polling/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

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

- **Web app**: `frontend/src/`
- Paths shown below use frontend structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and verify existing infrastructure

**Independent Test**: すべてのテストが既にパスしていることを確認（既存機能に影響なし）

- [ ] T001 Verify existing project structure matches plan.md (frontend/src/)
- [ ] T002 Verify TypeScript 5.9.3 and React 19.1.1 are installed
- [ ] T003 [P] Run existing tests to establish baseline (npm test)
- [ ] T004 [P] Verify Vitest 4.0.3 with vi.useFakeTimers() support

**Completion Criteria**: 既存テストがすべてパス、開発環境が正常動作

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 全ユーザーストーリーで共通して使用する基盤機能を実装

**Independent Test**: 各ユーティリティ関数が独立してテスト可能

### T005-T010: 記事マージユーティリティ（US1, US2で使用）

- [ ] T005 [P] 🔴 Red: Create articleMerge.test.ts with findNewArticles test cases in frontend/src/utils/articleMerge.test.ts
- [ ] T006 [P] ✅ Green: Implement findNewArticles(latestArticles, currentArticles) in frontend/src/utils/articleMerge.ts
- [ ] T007 [P] ♻️ Refactor: Optimize findNewArticles with Set.has() for O(n+m) complexity
- [ ] T008 [P] 🔴 Red: Add mergeArticles test cases to articleMerge.test.ts
- [ ] T009 [P] ✅ Green: Implement mergeArticles(currentArticles, newArticles) with sortArticlesByDate
- [ ] T010 [P] ♻️ Refactor: Extract duplicate logic, add JSDoc comments

**Independent Test**: `npm test articleMerge.test.ts` がすべてパス

### T011-T016: localStorage管理（US1で使用）

- [ ] T011 [P] 🔴 Red: Create pollingStorage.test.ts with loadPollingConfig test cases in frontend/src/services/pollingStorage.test.ts
- [ ] T012 [P] ✅ Green: Implement loadPollingConfig() returning default config in frontend/src/services/pollingStorage.ts
- [ ] T013 [P] ♻️ Refactor: Add JSON parsing and error handling to loadPollingConfig
- [ ] T014 [P] 🔴 Red: Add savePollingConfig test cases to pollingStorage.test.ts
- [ ] T015 [P] ✅ Green: Implement savePollingConfig(config) with localStorage.setItem
- [ ] T016 [P] ♻️ Refactor: Add try-catch for localStorage errors, extract STORAGE_KEY constant

**Independent Test**: `npm test pollingStorage.test.ts` がすべてパス

**Completion Criteria**: Foundational層のテストカバレッジ100%、すべてのテストがパス

---

## Phase 3: User Story 1 - バックグラウンドで新着記事を自動検出 (Priority: P1)

**Goal**: 10分ごとに自動的に新着記事をチェックし、通知を表示する

**Independent Test**: アプリを開いて10分間放置（vi.advanceTimersByTime使用）し、新着通知が表示される

**Acceptance Criteria**:
1. 10分ごとに自動的にフィードを取得
2. 新着記事が検出されたら通知を表示
3. 新着記事がなければ通知は表示しない
4. オフライン時はポーリング停止

### T017-T025: ArticleContext拡張（状態管理）

- [ ] T017 [US1] 🔴 Red: Add test for SET_PENDING_ARTICLES action in frontend/src/contexts/ArticleContext.test.tsx
- [ ] T018 [US1] ✅ Green: Add pendingArticles, hasNewArticles, newArticlesCount, lastPolledAt to ArticleState in frontend/src/contexts/ArticleContext.tsx
- [ ] T019 [US1] ✅ Green: Implement SET_PENDING_ARTICLES reducer case
- [ ] T020 [US1] ♻️ Refactor: Extract state update logic to helper function
- [ ] T021 [US1] 🔴 Red: Add test for APPLY_PENDING_ARTICLES action
- [ ] T022 [US1] ✅ Green: Implement APPLY_PENDING_ARTICLES reducer case with mergeArticles
- [ ] T023 [US1] ♻️ Refactor: Ensure no duplicate code in reducer
- [ ] T024 [US1] 🔴 Red: Add test for SET_LAST_POLLED_AT action
- [ ] T025 [US1] ✅ Green: Implement SET_LAST_POLLED_AT reducer case

**Independent Test**: `npm test ArticleContext.test.tsx` がすべてパス、新規アクションが正常動作

### T026-T035: useFeedPolling Hook（ポーリングロジック）

- [ ] T026 [US1] 🔴 Red: Create useFeedPolling.test.ts with basic polling test in frontend/src/hooks/useFeedPolling.test.ts
- [ ] T027 [US1] ✅ Green: Create useFeedPolling hook skeleton returning empty PollingState in frontend/src/hooks/useFeedPolling.ts
- [ ] T028 [US1] 🔴 Red: Add test for 10-minute interval polling (vi.advanceTimersByTime)
- [ ] T029 [US1] ✅ Green: Implement setInterval with 10-minute interval calling fetchFeeds
- [ ] T030 [US1] ♻️ Refactor: Extract polling logic to separate function
- [ ] T031 [US1] 🔴 Red: Add test for offline detection (useNetworkStatus integration)
- [ ] T032 [US1] ✅ Green: Add useNetworkStatus check to stop polling when offline
- [ ] T033 [US1] ♻️ Refactor: Ensure clearInterval in useEffect cleanup (memory leak prevention)
- [ ] T034 [US1] 🔴 Red: Add test for new article detection (findNewArticles integration)
- [ ] T035 [US1] ✅ Green: Call findNewArticles and update PollingState when new articles found

**Independent Test**: `npm test useFeedPolling.test.ts` がすべてパス、vi.useFakeTimers()でタイマー動作検証

### T036-T041: FeedContainer統合

- [ ] T036 [US1] 🔴 Red: Add integration test for FeedContainer + useFeedPolling in frontend/src/containers/FeedContainer.test.tsx
- [ ] T037 [US1] ✅ Green: Import and call useFeedPolling in FeedContainer.tsx
- [ ] T038 [US1] ✅ Green: Dispatch SET_PENDING_ARTICLES when pollingState.hasNewArticles is true
- [ ] T039 [US1] ✅ Green: Dispatch SET_LAST_POLLED_AT after polling completes
- [ ] T040 [US1] ♻️ Refactor: Extract polling state synchronization to useEffect
- [ ] T041 [US1] ♻️ Refactor: Add error handling for polling failures (log only, no user notification)

**Independent Test**: `npm test FeedContainer.test.tsx` がパス、ポーリング→Context更新のフローが動作

### T042-T047: 統合テスト（User Story 1 完了確認）

- [ ] T042 [US1] 🔴 Red: Create polling-flow.test.tsx for end-to-end User Story 1 in frontend/tests/integration/polling-flow.test.tsx
- [ ] T043 [US1] 🔴 Red: Add test case: "10分経過→新着検出→pendingArticles更新"
- [ ] T044 [US1] ✅ Green: Verify all components work together in integration test
- [ ] T045 [US1] 🔴 Red: Add test case: "オフライン時はポーリング停止"
- [ ] T046 [US1] ✅ Green: Verify offline detection stops polling
- [ ] T047 [US1] ♻️ Refactor: Extract common test setup to helper function

**Independent Test**: `npm test polling-flow.test.tsx` がパス、User Story 1のAcceptance Scenariosすべてが検証される

**User Story 1 Completion Criteria**:
- [x] 10分ごとのポーリングが動作（vi.advanceTimersByTime検証）
- [x] 新着記事検出時にpendingArticlesが更新される
- [x] オフライン時にポーリングが停止
- [x] テストカバレッジ100%（useFeedPolling, ArticleContext拡張部分）
- [x] メモリリークなし（clearInterval検証）

---

## Phase 4: User Story 2 - 新着記事を手動で反映 (Priority: P1)

**Goal**: 「読み込む」ボタンをクリックして、新着記事を記事一覧に反映する

**Independent Test**: ポーリング機能なしでも、手動でpendingArticlesを注入してテスト可能

**Acceptance Criteria**:
1. 新着通知に「読み込む」ボタンが表示される
2. ボタンクリックで記事一覧の先頭に新着記事が追加される
3. 通知が自動的に消える
4. 手動更新ボタンでも新着記事が反映される

### T048-T056: NewArticlesNotification Component（通知UI）

- [ ] T048 [P] [US2] 🔴 Red: Create NewArticlesNotification.test.tsx with basic rendering test in frontend/src/components/NewArticlesNotification.test.tsx
- [ ] T049 [P] [US2] ✅ Green: Create NewArticlesNotification component skeleton in frontend/src/components/NewArticlesNotification.tsx
- [ ] T050 [P] [US2] 🔴 Red: Add test for "visible=true shows notification, visible=false hides it"
- [ ] T051 [P] [US2] ✅ Green: Implement conditional rendering based on visible prop
- [ ] T052 [P] [US2] 🔴 Red: Add test for count display ("新着記事があります (5件)")
- [ ] T053 [P] [US2] ✅ Green: Display count in notification message
- [ ] T054 [P] [US2] 🔴 Red: Add test for onLoad callback when button clicked
- [ ] T055 [P] [US2] ✅ Green: Add "読み込む" button with onClick={onLoad}
- [ ] T056 [P] [US2] ♻️ Refactor: Add TailwindCSS styling (green theme, consistent with PWA notifications)

**Independent Test**: `npm test NewArticlesNotification.test.tsx` がパス、Props変更で表示/非表示が切り替わる

### T057-T061: アクセシビリティ対応

- [ ] T057 [P] [US2] 🔴 Red: Add test for ARIA attributes (role="status", aria-live="polite")
- [ ] T058 [P] [US2] ✅ Green: Add role="status" and aria-live="polite" to notification div
- [ ] T059 [P] [US2] 🔴 Red: Add test for aria-label on button ("新着記事を読み込む")
- [ ] T060 [P] [US2] ✅ Green: Add aria-label to "読み込む" button
- [ ] T061 [P] [US2] ♻️ Refactor: Add keyboard navigation test (Tab→Enter for button click)

**Independent Test**: axe-core または React Testing Library accessibility testing

### T062-T066: App.tsx統合

- [ ] T062 [US2] 🔴 Red: Add test for NewArticlesNotification rendering in App.test.tsx
- [ ] T063 [US2] ✅ Green: Import and render NewArticlesNotification in App.tsx
- [ ] T064 [US2] ✅ Green: Pass articleState.hasNewArticles as visible prop
- [ ] T065 [US2] ✅ Green: Implement handleLoadNewArticles() dispatching APPLY_PENDING_ARTICLES
- [ ] T066 [US2] ♻️ Refactor: Extract notification props to useMemo for performance

**Independent Test**: `npm test App.test.tsx` がパス、NewArticlesNotificationが表示される

### T067-T071: 統合テスト（User Story 2 完了確認）

- [ ] T067 [US2] 🔴 Red: Add test case to polling-flow.test.tsx: "「読み込む」ボタンクリック→記事反映"
- [ ] T068 [US2] ✅ Green: Verify APPLY_PENDING_ARTICLES merges articles correctly
- [ ] T069 [US2] 🔴 Red: Add test case: "手動更新ボタン→新着記事も反映"
- [ ] T070 [US2] ✅ Green: Verify manual refresh button also applies pending articles
- [ ] T071 [US2] ♻️ Refactor: Extract notification interaction tests to helper

**Independent Test**: `npm test polling-flow.test.tsx` がパス、User Story 2のAcceptance Scenariosすべてが検証される

**User Story 2 Completion Criteria**:
- [x] 新着通知が表示される（緑色、画面上部中央）
- [x] 「読み込む」ボタンで新着記事が記事一覧に反映される
- [x] 通知が自動的に消える
- [x] アクセシビリティ対応完了（ARIA属性、キーボード操作）
- [x] テストカバレッジ100%（NewArticlesNotification）

---

## Phase 5: User Story 3 - ポーリング状態の可視化 (Priority: P2)

**Goal**: 最終ポーリング時刻と次回ポーリングまでの残り時間を表示

**Independent Test**: 静的な時刻表示として、ポーリング機能とは切り離してテスト可能

**Acceptance Criteria**:
1. 「最終取得: 3分前」が表示される
2. 「次回取得まで: 7分」が表示される
3. エラー時は「最終取得: エラー」と表示される

**Note**: この機能はオプション（P2）のため、MVP（User Story 1+2）完了後に実装

### T072-T078: PollingStatus Component（状態表示UI）

- [ ] T072 [P] [US3] 🔴 Red: Create PollingStatus.test.tsx with lastPolledAt display test in frontend/src/components/PollingStatus.test.tsx
- [ ] T073 [P] [US3] ✅ Green: Create PollingStatus component displaying lastPolledAt in frontend/src/components/PollingStatus.tsx
- [ ] T074 [P] [US3] 🔴 Red: Add test for relative time display ("3分前")
- [ ] T075 [P] [US3] ✅ Green: Use date-fns formatDistanceToNow for relative time
- [ ] T076 [P] [US3] 🔴 Red: Add test for "次回取得まで: 7分" display
- [ ] T077 [P] [US3] ✅ Green: Calculate and display time until next poll
- [ ] T078 [P] [US3] ♻️ Refactor: Extract time calculation to custom hook usePollingTimer

### T079-T081: App.tsx統合

- [ ] T079 [US3] ✅ Green: Import and render PollingStatus in App.tsx
- [ ] T080 [US3] ✅ Green: Pass articleState.lastPolledAt as prop
- [ ] T081 [US3] ♻️ Refactor: Add CSS positioning (ヘッダー内または通知の下）

**Independent Test**: `npm test PollingStatus.test.tsx` がパス、時刻が正しく表示される

**User Story 3 Completion Criteria**:
- [x] 最終ポーリング時刻が表示される
- [x] 次回ポーリングまでの残り時間が表示される
- [x] テストカバレッジ100%（PollingStatus）

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: UI/UXの最終調整、パフォーマンス最適化、ドキュメント更新

### T082-T086: アニメーション & スタイリング

- [ ] T082 [P] Add slideDown animation to NewArticlesNotification (Tailwind CSS)
- [ ] T083 [P] Add fade-out transition when notification closes
- [ ] T084 [P] Verify notification z-index (z-40, 他の通知より下）
- [ ] T085 [P] Test responsive design on mobile (Tailwind breakpoints)
- [ ] T086 [P] Add loading indicator during polling (optional)

### T087-T090: パフォーマンス最適化

- [ ] T087 [P] Verify findNewArticles performance with 1000 articles (O(n+m))
- [ ] T088 [P] Add useMemo to expensive calculations in NewArticlesNotification
- [ ] T089 [P] Verify memory usage after 100 polling cycles (no leaks)
- [ ] T090 [P] Profile React DevTools for unnecessary re-renders

### T091-T095: エラーハンドリング & エッジケース

- [ ] T091 [P] Add test for localStorage quota exceeded error
- [ ] T092 [P] Add test for API timeout during polling (10秒タイムアウト)
- [ ] T093 [P] Add test for 100+ new articles (仮想スクロール対応確認)
- [ ] T094 [P] Add test for duplicate article IDs (重複判定確認)
- [ ] T095 [P] Add test for browser tab visibility change (document.visibilitychange)

### T096-T100: ドキュメント & 最終確認

- [ ] T096 Update SPECIFICATION.md with polling feature details (section 14 "今後の拡張案"から削除)
- [ ] T097 Update README.md with polling feature in特徴セクション
- [ ] T098 Update CLAUDE.md Active Technologies (update-agent-context.sh already run)
- [ ] T099 Run full test suite (npm test) and verify 100% coverage for new code
- [ ] T100 Final code review using CLAUDE.md「3. コードレビュー（必須）」セクション（6つの観点: アーキテクチャ、コード品質、セキュリティ、テスト、UI/UX、ドキュメント）

**Completion Criteria**:
- [x] 全テストがパス（既存テスト + 新規テスト）
- [x] カバレッジ100%（新規コード）
- [x] SPECIFICATION.md v1.6 更新完了
- [x] README.md 更新完了
- [x] コードレビュー完了

---

## 🚀 Implementation Strategy

### MVP Scope (Minimum Viable Product)

**User Story 1 + 2 = MVP**:
- バックグラウンドポーリング（US1）
- 新着記事の手動反映（US2）

**Tasks**: T001-T071 (71 tasks)
**Estimated Time**: 6-8時間（TDDサイクル含む）

### Incremental Delivery

1. **Iteration 1**: User Story 1 (T001-T047)
   - 独立してデプロイ可能
   - 新着検出のみ（通知なし）

2. **Iteration 2**: User Story 2 (T048-T071)
   - User Story 1に依存
   - 通知UIと反映機能を追加

3. **Iteration 3**: User Story 3 (T072-T081) - Optional
   - User Story 1+2に依存
   - UX向上のための可視化

4. **Iteration 4**: Polish (T082-T100)
   - 全ユーザーストーリー完了後
   - 品質向上とドキュメント

### Parallel Execution Opportunities

**Phase 2 (Foundational)**: T005-T016すべて並列実行可能（異なるファイル）

**User Story 1**:
- T017-T025 (ArticleContext) と T026-T035 (useFeedPolling) を並列実行可能

**User Story 2**:
- T048-T061 (NewArticlesNotification) を独立して実行可能

**Polish**:
- T082-T095 すべて並列実行可能

---

## 📊 Task Summary

**Total Tasks**: 100

**By Phase**:
- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 12 tasks
- Phase 3 (User Story 1): 31 tasks
- Phase 4 (User Story 2): 24 tasks
- Phase 5 (User Story 3): 10 tasks
- Phase 6 (Polish): 19 tasks

**By User Story**:
- User Story 1 (P1): 31 tasks
- User Story 2 (P1): 24 tasks
- User Story 3 (P2): 10 tasks
- Setup + Foundational + Polish: 35 tasks

**Parallel Opportunities**: 45 tasks marked with [P]

**TDD Cycle**:
- 🔴 Red tasks: 33
- ✅ Green tasks: 33
- ♻️ Refactor tasks: 34

**Independent Test Criteria**:
- User Story 1: アプリを開いて10分放置→新着通知表示
- User Story 2: 「読み込む」ボタン→記事一覧に反映
- User Story 3: 時刻表示が正しく動作

---

## 🎯 Next Steps

1. **Start with Phase 1**: T001-T004 (環境確認)
2. **Build Foundational Layer**: T005-T016 (ユーティリティ関数、localStorage)
3. **Implement MVP**: T017-T071 (User Story 1+2)
4. **Optional Enhancement**: T072-T081 (User Story 3)
5. **Polish & Ship**: T082-T100 (最終調整、ドキュメント)

**最初のタスク**:
```bash
# T001を実行
git status  # ブランチ確認（016-feed-auto-polling）
npm test    # 既存テストがすべてパスすることを確認
```

**TDDサイクル開始**:
```bash
# T005: 🔴 Red
touch frontend/src/utils/articleMerge.test.ts
# テストを書く（失敗することを確認）

# T006: ✅ Green
touch frontend/src/utils/articleMerge.ts
# 最小限の実装でテストを通す

# T007: ♻️ Refactor
# コードの品質を向上（Set.has()で最適化）
```

---

**Happy TDD Coding!** 🚀
