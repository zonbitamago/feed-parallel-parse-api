# Tasks: 購読フィード一覧の折りたたみ機能

**Input**: Design documents from `/specs/010-improve-feed-article-access/`
**Prerequisites**: plan.md (完了), spec.md (完了), research.md (完了), data-model.md (完了), quickstart.md (完了)

**Tests**: このプロジェクトはTDD憲法に従い、すべての実装前にテストを作成します。

**Organization**: タスクはユーザーストーリー別に整理され、各ストーリーを独立して実装・テスト可能にします。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: このタスクが属するユーザーストーリー（US1, US2, US3）
- 説明には正確なファイルパスを含む

## Path Conventions

このプロジェクトはWebアプリケーション構造を使用：
- **Frontend**: `frontend/src/`, `frontend/tests/`
- Tests included: すべて

---

## Phase 1: Setup（共有インフラ）

**Purpose**: プロジェクト初期化と基本構造の確認

- [x] T001 TDDワークフローの確認（Red-Green-Refactorサイクル）
- [x] T002 [P] 開発環境のセットアップ確認（Node.js 18+, npm install完了）
- [x] T003 [P] テスト環境の動作確認（`npm run test` が成功）

---

## Phase 2: Foundational（すべてのストーリーをブロックする前提条件）

**Purpose**: すべてのユーザーストーリーに必要なコアインフラ

**⚠️ CRITICAL**: このフェーズが完了するまで、ユーザーストーリー実装は開始できません

- [x] T004 既存のlocalStorage使用パターンの確認（`frontend/src/services/storage.ts`と`frontend/src/hooks/useLocalStorage.ts`）
- [x] T005 [P] 既存のFeedManagerコンポーネント構造の理解（`frontend/src/components/FeedManager/FeedManager.tsx`）
- [x] T006 [P] 既存のカスタムフックパターンの確認（`frontend/src/hooks/useFeedTitleEdit.ts`）

**Checkpoint**: 基盤準備完了 - ユーザーストーリー実装を並列開始可能

---

## Phase 3: User Story 1 - 購読一覧を折りたたんで記事を優先表示 (Priority: P1) 🎯 MVP

**Goal**: ページ読み込み時に購読一覧がデフォルトで折りたたまれ、記事一覧がファーストビューに表示される

**Independent Test**: ページ読み込み時に購読一覧が折りたたまれており、記事一覧がファーストビューに表示されることを確認するだけで、この機能単独でテスト可能

**Acceptance Scenarios**:
1. 20件のフィードを購読している状態でページを開くと、購読一覧は折りたたまれた状態で表示され、記事一覧がファーストビューに表示される
2. 購読一覧が折りたたまれている状態で「購読フィードを表示」ボタンをクリックすると、購読一覧が展開され全フィードが表示される
3. 購読一覧が展開されている状態で「購読フィードを隠す」ボタンをクリックすると、購読一覧が再び折りたたまれる

### Tests for User Story 1 (TDD: Red Phase)

> **RED PHASE**: これらのテストを先に書き、FAILすることを確認してから実装に進む

- [x] T007 [P] [US1] カスタムフックのユニットテスト作成：`frontend/src/hooks/useSubscriptionListCollapse.test.ts`
  - デフォルトで折りたたまれている状態を検証
  - toggle()で状態が切り替わることを検証
  - expand()とcollapse()の動作を検証
  - **期待結果**: テストが全てFAIL（実装がまだ存在しないため）

- [ ] T008 [P] [US1] FeedManagerコンポーネントのユニットテスト追加：`frontend/src/components/FeedManager/FeedManager.test.tsx`
  - 折りたたみボタンが表示されることを検証
  - 折りたたまれた状態では購読一覧が非表示であることを検証
  - 展開ボタンをクリックすると購読一覧が表示されることを検証
  - aria-expanded属性が正しく設定されることを検証
  - **期待結果**: テストが全てFAIL

### Implementation for User Story 1 (TDD: Green Phase)

> **GREEN PHASE**: テストを通すための最小限の実装

- [x] T009 [US1] useSubscriptionListCollapseカスタムフックの実装：`frontend/src/hooks/useSubscriptionListCollapse.ts`
  - `useLocalStorage`を使用してisCollapsed状態を管理（キー: `rss_reader_subscriptions_collapsed`、デフォルト: `true`）
  - toggle, expand, collapse関数を実装（useCallbackでメモ化）
  - 型定義をTypeScript strict modeに準拠させる
  - **期待結果**: T007のテストが全てPASS

- [ ] T010 [US1] FeedManagerコンポーネントに折りたたみUIを追加：`frontend/src/components/FeedManager/FeedManager.tsx`
  - useSubscriptionListCollapseフックをインポート
  - 購読件数と折りたたみトグルボタンを追加（既存の購読件数表示の横に配置）
  - トグルボタンにaria-expanded, aria-controls, aria-label属性を追加
  - 条件付きレンダリング実装（`{!isCollapsed && subscriptions.length > 0 && <div>...</div>}`）
  - TailwindCSSのtransitionクラスでアニメーション追加（300ms以内）
  - **期待結果**: T008のテストが全てPASS

### Refactor for User Story 1 (TDD: Refactor Phase)

> **REFACTOR PHASE**: テストを通したまま、コード品質を向上

- [ ] T011 [US1] useSubscriptionListCollapseのリファクタリング
  - useCallbackの依存配列を確認
  - 型定義の明確化
  - コメントの追加（日本語）
  - **期待結果**: T007のテストが引き続きPASS、カバレッジ100%

- [ ] T012 [US1] FeedManagerコンポーネントのリファクタリング
  - 不要な再レンダリングの防止（React.memoの検討）
  - アクセシビリティの最終確認（WAI-ARIA準拠）
  - TailwindCSSクラスの最適化
  - **期待結果**: T008のテストが引き続きPASS、カバレッジ100%

**Checkpoint**: User Story 1が完全に機能し、独立してテスト可能な状態

---

## Phase 4: User Story 2 - 折りたたみ状態の永続化 (Priority: P2)

**Goal**: ユーザーの好みの表示状態（折りたたみ/展開）を記憶し、次回訪問時にも同じ状態で表示

**Independent Test**: 折りたたみ状態を変更し、ページをリロードして同じ状態が維持されることを確認

**Acceptance Scenarios**:
1. 購読一覧を折りたたんだ状態でページをリロードすると、折りたたまれた状態のままである
2. 購読一覧を展開した状態でページをリロードすると、展開された状態のままである
3. 初回訪問のユーザーがページを開くと、購読一覧はデフォルトで折りたたまれている

### Tests for User Story 2 (TDD: Red Phase)

> **RED PHASE**: localStorageの永続化をテスト

- [ ] T013 [P] [US2] localStorage永続化のユニットテスト追加：`frontend/src/hooks/useSubscriptionListCollapse.test.ts`
  - localStorageに状態を保存することを検証
  - ページリロード後に状態を復元することを検証（localStorage.setItemをモック）
  - localStorage無効環境でもエラーなく動作することを検証
  - **期待結果**: テストがFAIL（永続化実装がまだ不十分な可能性）

### Implementation for User Story 2 (TDD: Green Phase)

> **GREEN PHASE**: useLocalStorageが既に永続化を実装済みのため、テスト追加のみ

- [ ] T014 [US2] useLocalStorageの動作確認：`frontend/src/hooks/useLocalStorage.ts`
  - 既存実装がlocalStorage永続化を正しく処理していることを確認
  - エラーハンドリング（try-catch）が適切に実装されていることを確認
  - **期待結果**: T013のテストが全てPASS（既存実装で対応済み）

### Refactor for User Story 2 (TDD: Refactor Phase)

- [ ] T015 [US2] localStorage永続化のエラーハンドリング強化
  - エラーログの改善（より詳細なメッセージ）
  - エッジケースの追加テスト（localStorage容量超過など）
  - **期待結果**: T013のテストが引き続きPASS

**Checkpoint**: User Story 1とUser Story 2が両方とも独立して動作

---

## Phase 5: User Story 3 - 購読件数の視覚的表示 (Priority: P3)

**Goal**: 購読一覧が折りたたまれている状態でも、現在何件のフィードを購読しているかを把握できる

**Independent Test**: 購読一覧が折りたたまれている状態で、購読件数が表示されることを確認

**Acceptance Scenarios**:
1. 15件のフィードを購読しており購読一覧が折りたたまれている状態で、「購読中: 15件」のような表示がされる
2. 購読一覧が折りたたまれている状態で新しいフィードを1件追加すると、購読件数の表示が「16件」に更新される
3. 購読一覧が展開されている状態でも、購読件数が表示される

### Tests for User Story 3 (TDD: Red Phase)

- [ ] T016 [P] [US3] 購読件数表示のユニットテスト追加：`frontend/src/components/FeedManager/FeedManager.test.tsx`
  - 折りたたみ状態でも購読件数が表示されることを検証
  - 購読数の変化に応じて表示が更新されることを検証
  - 購読数0件の場合の表示を検証
  - **期待結果**: テストがFAIL（購読件数表示がまだ不十分な可能性）

### Implementation for User Story 3 (TDD: Green Phase)

- [ ] T017 [US3] FeedManagerに購読件数表示を追加：`frontend/src/components/FeedManager/FeedManager.tsx`
  - 既存の「購読中: X/100件」表示を確認
  - 折りたたみ状態でも常に表示されることを確認
  - 購読数0件の場合の表示を調整
  - **期待結果**: T016のテストが全てPASS（既存実装で対応済みの可能性）

### Refactor for User Story 3 (TDD: Refactor Phase)

- [ ] T018 [US3] 購読件数表示のUI改善
  - TailwindCSSクラスの最適化
  - レスポンシブデザインの確認
  - **期待結果**: T016のテストが引き続きPASS

**Checkpoint**: すべてのユーザーストーリーが独立して機能

---

## Phase 6: Integration Testing（統合テスト）

**Purpose**: ユーザーストーリー間の統合と全体フローのテスト

### Integration Tests (TDD: Red Phase)

- [ ] T019 [P] 統合テスト作成：`frontend/tests/integration/subscriptionCollapseFlow.test.tsx`
  - 折りたたみ状態でもフィード追加が可能であることを検証
  - 展開状態でフィードを削除しても状態が維持されることを検証
  - 購読数0件の場合も折りたたみボタンが表示されることを検証
  - **期待結果**: テストがFAIL

### Integration Implementation (TDD: Green Phase)

- [ ] T020 統合テストの修正と実装調整
  - 統合テストが通るよう必要な調整を実施
  - エッジケースの処理確認
  - **期待結果**: T019のテストが全てPASS

---

## Phase 7: Polish & Cross-Cutting Concerns（磨き上げと横断的関心事）

**Purpose**: 複数のユーザーストーリーに影響する改善

- [ ] T021 [P] TypeScript型チェックの実行：`npm run build`
  - すべての型エラーがないことを確認
  - strict modeでのコンパイルが成功することを確認
  - **期待結果**: ビルド成功、型エラー0件

- [ ] T022 [P] ESLintの実行：`npm run lint`
  - すべてのリンター警告を修正
  - コーディング規約に準拠
  - **期待結果**: 警告0件

- [ ] T023 [P] テストカバレッジの確認：`npm run test -- --coverage`
  - 新規コード100%カバレッジを確認
  - カバレッジレポートを確認
  - **期待結果**: useSubscriptionListCollapse.ts, FeedManager.tsxのカバレッジ100%

- [ ] T024 [P] パフォーマンステスト
  - 折りたたみ/展開アニメーションが300ms以内であることを確認
  - React DevTools Profilerで再レンダリングを確認
  - **期待結果**: パフォーマンス目標達成

- [ ] T025 [P] アクセシビリティテスト
  - キーボードナビゲーション（Tab, Enter, Space）の確認
  - スクリーンリーダー対応の確認（aria属性）
  - **期待結果**: WAI-ARIA完全準拠

- [ ] T026 [P] クロスブラウザテスト
  - Chrome, Firefox, Safari, Edgeでの動作確認
  - モバイルビューポートでの動作確認
  - **期待結果**: すべてのブラウザで正常動作

- [ ] T027 quickstart.mdの手動テスト実行
  - quickstart.mdの手動テスト手順をすべて実行
  - 期待される動作を確認
  - **期待結果**: すべての手動テストがPASS

- [ ] T028 [P] ドキュメント更新確認
  - SPECIFICATION.mdの更新が必要か確認（機能追加のため更新必須）
  - README.mdの更新が必要か確認（ユーザー向け機能のため更新推奨）
  - **期待結果**: ドキュメント更新計画作成

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存関係なし - すぐに開始可能
- **Foundational (Phase 2)**: Setupの完了に依存 - すべてのユーザーストーリーをブロック
- **User Stories (Phase 3-5)**: すべてFoundationalフェーズの完了に依存
  - ユーザーストーリーは並列実行可能（複数開発者の場合）
  - または優先順位順に順次実行（P1 → P2 → P3）
- **Integration Testing (Phase 6)**: すべてのユーザーストーリーの完了に依存
- **Polish (Phase 7)**: すべてのユーザーストーリーとテストの完了に依存

### User Story Dependencies

- **User Story 1 (P1)**: Foundationalフェーズ後に開始可能 - 他のストーリーに依存しない
- **User Story 2 (P2)**: Foundationalフェーズ後に開始可能 - US1に依存（useSubscriptionListCollapseフック使用）
- **User Story 3 (P3)**: Foundationalフェーズ後に開始可能 - US1に依存（FeedManagerコンポーネント改修）

### 各ユーザーストーリー内

- テストを先に書き、FAILすることを確認してから実装
- Red → Green → Refactorのサイクル厳守
- カスタムフック → コンポーネント改修の順序
- コア実装 → 統合の前に
- ストーリー完了後に次の優先順位へ

### Parallel Opportunities

- Setupのすべてのタスク[P]は並列実行可能
- Foundationalのすべてのタスク[P]は並列実行可能（Phase 2内）
- Foundationalフェーズ完了後、すべてのユーザーストーリーを並列開始可能（チーム容量が許せば）
- 各ユーザーストーリー内の[P]タスクは並列実行可能
- 異なるユーザーストーリーは異なるチームメンバーが並列作業可能

---

## Parallel Example: User Story 1

```bash
# User Story 1のすべてのテストを並列起動（TDD Red Phase）:
Task: "Contract test for useSubscriptionListCollapse in frontend/src/hooks/useSubscriptionListCollapse.test.ts"
Task: "Unit test for FeedManager collapse feature in frontend/src/components/FeedManager/FeedManager.test.tsx"

# 実装フェーズは依存関係があるため順次実行:
Task T009 → Task T010 → Task T011 → Task T012
```

---

## Implementation Strategy

### MVP First (User Story 1のみ)

1. Phase 1: Setup を完了
2. Phase 2: Foundational を完了（CRITICAL - すべてのストーリーをブロック）
3. Phase 3: User Story 1 を完了（TDD: Red → Green → Refactor）
4. **STOP and VALIDATE**: User Story 1を独立してテスト
5. 準備ができていればデプロイ/デモ

### Incremental Delivery（段階的デリバリー）

1. Setup + Foundational を完了 → 基盤準備完了
2. User Story 1 を追加 → 独立してテスト → デプロイ/デモ（MVP!）
3. User Story 2 を追加 → 独立してテスト → デプロイ/デモ
4. User Story 3 を追加 → 独立してテスト → デプロイ/デモ
5. 各ストーリーが前のストーリーを壊すことなく価値を追加

### Parallel Team Strategy（並列チーム戦略）

複数の開発者がいる場合：

1. チーム全体でSetup + Foundationalを完了
2. Foundational完了後:
   - Developer A: User Story 1（P1 - 最優先）
   - Developer B: User Story 2（P2 - P1の後またはP1と並行）
   - Developer C: User Story 3（P3 - P1の後またはP1/P2と並行）
3. ストーリーが独立して完了し、統合

---

## TDD Workflow（TDD ワークフロー）

### Red-Green-Refactorサイクル

各タスクで以下のサイクルを厳守：

```
1. RED: テストを書く → テストが失敗することを確認
   ↓
2. GREEN: 最小限の実装でテストを通す
   ↓
3. REFACTOR: テストを通したままコードの品質を向上
   ↓
4. COMMIT: 各フェーズでコミット可能
```

### コミットメッセージ例

```bash
# Red Phase
git commit -m "test: 折りたたみ機能のテストを追加（Red）"

# Green Phase
git commit -m "feat: useSubscriptionListCollapseフックを実装（Green）"

# Refactor Phase
git commit -m "refactor: useCallbackの依存配列を最適化（Refactor）"
```

---

## Notes

- [P] タスク = 異なるファイル、依存関係なし
- [Story] ラベルでタスクを特定のユーザーストーリーにトレース可能
- 各ユーザーストーリーは独立して完了・テスト可能
- 実装前にテストが失敗することを確認
- 各タスクまたは論理的グループ後にコミット
- 各チェックポイントでストーリーを独立して検証
- 避けるべき: 曖昧なタスク、同じファイルの競合、ストーリーの独立性を壊す横断依存関係

---

## 推奨される実装順序

### 単一開発者の場合

```
Phase 1 (Setup)
  → Phase 2 (Foundational)
  → Phase 3 (US1: Red → Green → Refactor)
  → Phase 4 (US2: Red → Green → Refactor)
  → Phase 5 (US3: Red → Green → Refactor)
  → Phase 6 (Integration Testing)
  → Phase 7 (Polish)
```

### 複数開発者の場合

```
全員: Phase 1 + 2
  ↓
Dev A: US1 (T007-T012) | Dev B: 待機 | Dev C: 待機
  ↓ (US1完了後)
Dev A: US2 (T013-T015) | Dev B: US3 (T016-T018) | Dev C: 待機
  ↓ (US2, US3完了後)
全員: Phase 6 (Integration Testing) + Phase 7 (Polish)
```

---

## 総タスク数: 28タスク

- Setup: 3タスク
- Foundational: 3タスク
- User Story 1: 6タスク（Test 2 + Impl 2 + Refactor 2）
- User Story 2: 3タスク（Test 1 + Impl 1 + Refactor 1）
- User Story 3: 3タスク（Test 1 + Impl 1 + Refactor 1）
- Integration Testing: 2タスク
- Polish: 8タスク

**並列実行機会**: 15タスクが[P]マーク付き（53%）

**Independent Test Criteria**:
- US1: ページ読み込み時に購読一覧が折りたたまれており、記事一覧がファーストビューに表示される
- US2: 折りたたみ状態を変更し、ページをリロードして同じ状態が維持される
- US3: 購読一覧が折りたたまれている状態で、購読件数が表示される

**Suggested MVP Scope**: User Story 1のみ（Phase 1-3の完了）

---

## Format Validation

✅ すべてのタスクがチェックリスト形式に従っています：
- Checkbox: `- [ ]`
- Task ID: T001-T028
- [P] marker: 並列実行可能なタスクにのみ付与
- [Story] label: ユーザーストーリーフェーズのタスクにのみ付与（US1, US2, US3）
- Description: 明確なアクションと正確なファイルパス
