# Tasks: 購読フィード識別表示の改善

**Input**: Design documents from `/specs/008-feed-url-display/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: テストタスクは必須です（憲法のt-wadaスタイルTDDに準拠）

**Organization**: タスクはUser Storyごとにグループ化され、各Storyが独立して実装・テスト可能です。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: このタスクが属するUser Story（US1, US2, US3）
- 説明には正確なファイルパスを含む

## Path Conventions

このプロジェクトはWeb applicationで、以下の構造を使用：

- フロントエンド: `frontend/src/`
- テスト: `frontend/tests/`、`frontend/src/**/*.test.ts(x)`

---

## Phase 1: Setup（共有インフラストラクチャ）

**目的**: プロジェクト初期化と基本構造の確認

- [x] T001 開発環境の確認（Node.js 18以上、依存関係インストール済み）
- [x] T002 開発サーバーの起動確認（npm run dev）
- [x] T003 [P] テスト実行環境の確認（npm test）
- [x] T004 [P] 既存のSubscriptionモデルとContextの理解（frontend/src/types/models.ts、frontend/src/contexts/SubscriptionContext.tsx）

---

## Phase 2: Foundational（必須の前提条件）

**目的**: すべてのUser Storyの実装前に完了する必要があるコアインフラストラクチャ

**⚠️ 重要**: このフェーズが完了するまで、User Storyの作業は開始できません

- [x] T005 Subscription型にcustomTitleフィールドを追加（frontend/src/types/models.ts）
- [x] T006 [P] getDisplayTitle()ヘルパー関数を追加（frontend/src/types/models.ts）
- [x] T007 [P] hasCustomTitle()ヘルパー関数を追加（frontend/src/types/models.ts）
- [x] T008 [P] validateCustomTitle()ヘルパー関数を追加（frontend/src/types/models.ts）
- [x] T009 localStorage読み込み時のマイグレーション処理を追加（frontend/src/services/storage.ts）
- [x] T010 [P] タイトルユーティリティファイルを作成（frontend/src/utils/titleUtils.ts）
- [x] T011 [P] タイトルユーティリティのテストを作成（frontend/src/utils/titleUtils.test.ts）

**Checkpoint**: 基盤準備完了 - User Storyの実装を並列で開始可能

---

## Phase 3: User Story 1 - フィードタイトルの自動取得と表示 (Priority: P1) 🎯 MVP

**Goal**: RSSフィード追加時にフィードタイトルを自動取得し、購読リストに表示する。URLではなくタイトルで各フィードを識別できるようにする。

**Independent Test**: 複数のRSSフィードを購読し、それぞれのフィードタイトルが購読リストに表示され、URLではなくタイトルで識別できることを確認。

### Tests for User Story 1（t-wadaスタイルTDD: Red） ⚠️

> **重要: これらのテストを最初に書き、実装前に失敗することを確認してください**

- [ ] T012 [P] [US1] titleUtilsのユニットテストを実装（frontend/src/utils/titleUtils.test.ts）- decodeHTMLEntities
- [ ] T013 [P] [US1] titleUtilsのユニットテストを実装（frontend/src/utils/titleUtils.test.ts）- stripHTMLTags
- [ ] T014 [P] [US1] titleUtilsのユニットテストを実装（frontend/src/utils/titleUtils.test.ts）- sanitizeFeedTitle
- [ ] T015 [P] [US1] titleUtilsのユニットテストを実装（frontend/src/utils/titleUtils.test.ts）- truncateTitle
- [ ] T016 [US1] models.tsのヘルパー関数テストを実装（frontend/src/types/models.test.ts）- getDisplayTitle優先順位テスト
- [ ] T017 [P] [US1] storageのマイグレーションテストを実装（frontend/src/services/storage.test.ts）- customTitle正規化
- [ ] T018 [US1] テストを実行してすべて失敗することを確認（Red）

### Implementation for User Story 1（t-wadaスタイルTDD: Green）

- [ ] T019 [P] [US1] decodeHTMLEntities()を実装（frontend/src/utils/titleUtils.ts）
- [x] T020 [P] [US1] stripHTMLTags()を実装（frontend/src/utils/titleUtils.ts）
- [x] T021 [US1] sanitizeFeedTitle()を実装（frontend/src/utils/titleUtils.ts）- T019とT020に依存
- [x] T022 [P] [US1] truncateTitle()を実装（frontend/src/utils/titleUtils.ts）
- [x] T023 [US1] useFeedAPI.tsでフィード取得時にtitleを更新（frontend/src/hooks/useFeedAPI.ts）
- [x] T024 [US1] FeedContainerでフィード取得後にSubscriptionのtitleを永続化（frontend/src/containers/FeedContainer.tsx）
- [x] T025 [US1] FeedManagerでgetDisplayTitle()を使用してタイトルを表示（frontend/src/components/FeedManager/FeedManager.tsx）
- [x] T026 [US1] テストを実行してすべて成功することを確認（Green）

### Refactor for User Story 1（t-wadaスタイルTDD: Refactor）

- [x] T027 [US1] titleUtilsのコード品質を向上（重複排除、意図の明確化）
- [x] T028 [US1] useFeedAPI.tsのタイトル更新ロジックをリファクタリング
- [x] T029 [US1] FeedContainerのuseEffectを最適化（不要な再レンダリング防止）
- [x] T030 [US1] テストを実行してすべて成功することを確認（Refactorでテストが壊れていないことを確認）

### Integration Test for User Story 1

- [x] T031 [US1] 統合テストを作成（frontend/tests/integration/feedTitleFlow.test.tsx）- フィード追加→タイトル表示確認
- [x] T032 [US1] リロード後の永続化を確認する統合テストを追加
- [x] T033 [US1] HTMLエンティティを含むタイトルの統合テストを追加

**Checkpoint**: この時点で、User Story 1は完全に機能し、独立してテスト可能です。URLではなくタイトルでフィードを識別できます。

---

## Phase 4: User Story 2 - フィード表示名の手動編集 (Priority: P2)

**Goal**: ユーザーが自動取得されたフィードタイトルを編集し、カスタム名を設定できるようにする。変更は永続化され、次回アクセス時も保持される。

**Independent Test**: フィードの表示名を編集し、その変更が保存され、ページリロード後も編集した名前が表示されることを確認。

### Tests for User Story 2（t-wadaスタイルTDD: Red） ⚠️

> **重要: これらのテストを最初に書き、実装前に失敗することを確認してください**

- [ ] T034 [P] [US2] validateCustomTitle()のユニットテストを実装（frontend/src/types/models.test.ts）- 空文字エラー
- [ ] T035 [P] [US2] validateCustomTitle()のユニットテストを実装（frontend/src/types/models.test.ts）- 200文字超過エラー
- [ ] T036 [P] [US2] validateCustomTitle()のユニットテストを実装（frontend/src/types/models.test.ts）- 正常ケース
- [ ] T037 [P] [US2] FeedManagerの編集UIコンポーネントテストを実装（frontend/src/components/FeedManager/FeedManager.test.tsx）- 編集モード切り替え
- [ ] T038 [P] [US2] FeedManagerの編集UIコンポーネントテストを実装（frontend/src/components/FeedManager/FeedManager.test.tsx）- 保存処理
- [ ] T039 [P] [US2] FeedManagerの編集UIコンポーネントテストを実装（frontend/src/components/FeedManager/FeedManager.test.tsx）- キャンセル処理
- [ ] T040 [US2] テストを実行してすべて失敗することを確認（Red）

### Implementation for User Story 2（t-wadaスタイルTDD: Green）

- [ ] T041 [US2] FeedContainerにhandleUpdateCustomTitle()を実装（frontend/src/containers/FeedContainer.tsx）
- [ ] T042 [US2] FeedManagerのPropsにonUpdateCustomTitleを追加（frontend/src/components/FeedManager/FeedManager.tsx）
- [ ] T043 [US2] FeedManagerに編集状態管理用stateを追加（frontend/src/components/FeedManager/FeedManager.tsx）
- [ ] T044 [P] [US2] handleStartEdit()を実装（frontend/src/components/FeedManager/FeedManager.tsx）
- [ ] T045 [P] [US2] handleSaveEdit()を実装（frontend/src/components/FeedManager/FeedManager.tsx）
- [ ] T046 [P] [US2] handleCancelEdit()を実装（frontend/src/components/FeedManager/FeedManager.tsx）
- [ ] T047 [US2] 購読リスト表示部分に編集モードUIを追加（frontend/src/components/FeedManager/FeedManager.tsx）- 編集input、保存/キャンセルボタン
- [ ] T048 [US2] 購読リスト表示部分に編集ボタンを追加（frontend/src/components/FeedManager/FeedManager.tsx）
- [ ] T049 [US2] キーボード操作を実装（Enter: 保存、Escape: キャンセル）（frontend/src/components/FeedManager/FeedManager.tsx）
- [ ] T050 [US2] テストを実行してすべて成功することを確認（Green）

### Refactor for User Story 2（t-wadaスタイルTDD: Refactor）

- [ ] T051 [US2] FeedManagerの編集ハンドラーをカスタムフックに抽出（frontend/src/hooks/useEditableTitle.ts）- オプショナル
- [ ] T052 [US2] FeedManagerのコンポーネント構造をリファクタリング（編集UI部分を別コンポーネントに分離）- オプショナル
- [ ] T053 [US2] エラーハンドリングの一貫性を向上（frontend/src/components/FeedManager/FeedManager.tsx）
- [ ] T054 [US2] テストを実行してすべて成功することを確認（Refactorでテストが壊れていないことを確認）

### Integration Test for User Story 2

- [ ] T055 [US2] 統合テストを追加（frontend/tests/integration/feedTitleFlow.test.tsx）- カスタムタイトル編集フロー
- [ ] T056 [US2] 統合テストを追加（frontend/tests/integration/feedTitleFlow.test.tsx）- 空文字バリデーションエラー
- [ ] T057 [US2] 統合テストを追加（frontend/tests/integration/feedTitleFlow.test.tsx）- キャンセル操作

**Checkpoint**: この時点で、User Stories 1と2の両方が独立して機能します。ユーザーはタイトルを自動取得でき、必要に応じて編集もできます。

---

## Phase 5: User Story 3 - フィード追加時のタイトルプレビュー (Priority: P3)

**Goal**: 新しいフィードを追加する際に、取得されるフィードタイトルを事前にプレビューで確認できるようにする。

**Independent Test**: フィード追加フォームにURLを入力し、フィードを追加する前にタイトルのプレビューが表示されることを確認。

### Tests for User Story 3（t-wadaスタイルTDD: Red） ⚠️

> **重要: これらのテストを最初に書き、実装前に失敗することを確認してください**

- [ ] T058 [P] [US3] useFeedPreview()カスタムフックのテストを実装（frontend/src/hooks/useFeedPreview.test.ts）- プレビュー取得成功
- [ ] T059 [P] [US3] useFeedPreview()カスタムフックのテストを実装（frontend/src/hooks/useFeedPreview.test.ts）- プレビュー取得失敗
- [ ] T060 [P] [US3] FeedManagerのプレビュー表示テストを実装（frontend/src/components/FeedManager/FeedManager.test.tsx）- タイトルプレビュー表示
- [ ] T061 [P] [US3] FeedManagerのプレビュー表示テストを実装（frontend/src/components/FeedManager/FeedManager.test.tsx）- エラーメッセージ表示
- [ ] T062 [US3] テストを実行してすべて失敗することを確認（Red）

### Implementation for User Story 3（t-wadaスタイルTDD: Green）

- [ ] T063 [US3] useFeedPreview()カスタムフックを作成（frontend/src/hooks/useFeedPreview.ts）- URL入力でプレビュー取得
- [ ] T064 [US3] FeedManagerにuseFeedPreview()を統合（frontend/src/components/FeedManager/FeedManager.tsx）
- [ ] T065 [US3] フィード追加フォームにプレビュー表示UIを追加（frontend/src/components/FeedManager/FeedManager.tsx）
- [ ] T066 [US3] プレビューのローディング状態とエラー状態を表示（frontend/src/components/FeedManager/FeedManager.tsx）
- [ ] T067 [US3] テストを実行してすべて成功することを確認（Green）

### Refactor for User Story 3（t-wadaスタイルTDD: Refactor）

- [ ] T068 [US3] useFeedPreview()のデバウンス処理を最適化（不要なAPI呼び出しを削減）
- [ ] T069 [US3] プレビューUIのスタイリングを改善（frontend/src/components/FeedManager/FeedManager.tsx）
- [ ] T070 [US3] テストを実行してすべて成功することを確認（Refactorでテストが壊れていないことを確認）

### Integration Test for User Story 3

- [ ] T071 [US3] 統合テストを追加（frontend/tests/integration/feedTitleFlow.test.tsx）- プレビュー表示→フィード追加フロー
- [ ] T072 [US3] 統合テストを追加（frontend/tests/integration/feedTitleFlow.test.tsx）- 無効なURLでのプレビューエラー

**Checkpoint**: すべてのUser Storyが独立して機能します。ユーザーはプレビュー確認→タイトル自動取得→必要に応じて編集、という完全なフローを利用できます。

---

## Phase 6: Polish & Cross-Cutting Concerns

**目的**: 複数のUser Storyに影響する改善

- [ ] T073 [P] アクセシビリティの改善（aria-label、role属性の追加）- frontend/src/components/FeedManager/FeedManager.tsx
- [ ] T074 [P] エラーメッセージの統一（frontend/src/types/models.ts、frontend/src/components/FeedManager/FeedManager.tsx）
- [ ] T075 長いタイトルの表示最適化（CSS ellipsis、hover時の全文表示）- frontend/src/components/FeedManager/FeedManager.tsx
- [ ] T076 [P] quickstart.mdの手順を実行して検証（specs/008-feed-url-display/quickstart.md）
- [ ] T077 React.memoでFeedManagerコンポーネントを最適化（不要な再レンダリング防止）
- [ ] T078 [P] カバレッジレポートを確認（100%目標）- npm run test:coverage
- [ ] T079 [P] コードレビュー準備（コメント追加、TODO削除、コンソールログ削除）
- [ ] T080 最終的な統合テストを実行してすべて成功することを確認

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存関係なし - すぐに開始可能
- **Foundational (Phase 2)**: Setupの完了に依存 - すべてのUser Storyをブロック
- **User Stories (Phase 3-5)**: すべてFoundationalフェーズの完了に依存
  - User Storyは並列で進行可能（スタッフがいる場合）
  - または優先順位順に順次進行（P1 → P2 → P3）
- **Polish (Final Phase)**: 必要なすべてのUser Storyの完了に依存

### User Story Dependencies

- **User Story 1 (P1)**: Foundational完了後に開始可能 - 他Storyへの依存なし
- **User Story 2 (P2)**: Foundational完了後に開始可能 - US1のSubscriptionモデル拡張に依存するが、独立してテスト可能
- **User Story 3 (P3)**: Foundational完了後に開始可能 - US1のタイトル取得ロジックに依存するが、独立してテスト可能

### Within Each User Story（t-wadaスタイルTDD）

- **Red**: テストを最初に書き、失敗することを確認
- **Green**: 最小限のコードでテストを通す（仮実装、明白な実装、三角測量）
- **Refactor**: テストを通したまま、コード品質を向上
- モデルの後にサービス
- サービスの後にコンポーネント
- コア実装の後に統合
- 次の優先度に進む前にStoryを完了

### Parallel Opportunities

- すべてのSetupタスク（[P]マーク付き）は並列実行可能
- すべてのFoundationalタスク（[P]マーク付き）はPhase 2内で並列実行可能
- Foundationalフェーズ完了後、すべてのUser Storyを並列開始可能（チーム容量が許せば）
- User Story内のすべてのテスト（[P]マーク付き）は並列実行可能（Red フェーズ）
- User Story内の実装タスク（[P]マーク付き）は並列実行可能（Green フェーズ）
- 異なるUser Storyは異なるチームメンバーが並列で作業可能

---

## Parallel Example: User Story 1

```bash
# User Story 1のすべてのテストを一緒に起動（Red フェーズ）:
Task: "titleUtilsのユニットテストを実装 - decodeHTMLEntities"
Task: "titleUtilsのユニットテストを実装 - stripHTMLTags"
Task: "titleUtilsのユニットテストを実装 - sanitizeFeedTitle"
Task: "titleUtilsのユニットテストを実装 - truncateTitle"
Task: "storageのマイグレーションテストを実装"

# User Story 1のユーティリティ実装を一緒に起動（Green フェーズ）:
Task: "decodeHTMLEntities()を実装"
Task: "stripHTMLTags()を実装"
Task: "truncateTitle()を実装"
```

---

## Implementation Strategy

### MVP First (User Story 1のみ)

1. Phase 1を完了: Setup
2. Phase 2を完了: Foundational（重要 - すべてのStoryをブロック）
3. Phase 3を完了: User Story 1（t-wadaスタイルTDD: Red → Green → Refactor）
4. **停止して検証**: User Story 1を独立してテスト
5. 準備できていればデプロイ/デモ

### Incremental Delivery

1. Setup + Foundational完了 → 基盤準備完了
2. User Story 1追加 → 独立してテスト → デプロイ/デモ（MVP！）
3. User Story 2追加 → 独立してテスト → デプロイ/デモ
4. User Story 3追加 → 独立してテスト → デプロイ/デモ
5. 各Storyは前のStoryを壊すことなく価値を追加

### Parallel Team Strategy

複数の開発者がいる場合:

1. チームで一緒にSetup + Foundationalを完了
2. Foundational完了後:
   - 開発者A: User Story 1
   - 開発者B: User Story 2（US1のモデル拡張完了を待つ）
   - 開発者C: User Story 3（US1のAPI統合完了を待つ）
3. Storyは独立して完了し、統合

### TDD Commit Strategy

憲法に従ったコミット戦略:

```bash
# Red フェーズ
git commit -m "test: タイトルユーティリティのテストを追加（Red）"

# Green フェーズ
git commit -m "feat: タイトルユーティリティを実装（Green）"

# Refactor フェーズ
git commit -m "refactor: タイトルユーティリティの重複を排除（Refactor）"
```

---

## Notes

- [P]タスク = 異なるファイル、依存関係なし
- [Story]ラベル = 特定のUser Storyにタスクをマッピング（トレーサビリティ）
- 各User Storyは独立して完了・テスト可能
- t-wadaスタイルTDD: Red → Green → Refactor サイクルを厳守
- 実装前にテストが失敗することを確認
- 各タスクまたは論理的なグループの後にコミット
- 任意のチェックポイントで停止してStoryを独立して検証
- 避けるべき: 曖昧なタスク、同一ファイルの競合、Storyの独立性を壊す横断的な依存関係
- カバレッジ目標: 新規コード100%、プロジェクト全体80%以上
- ベビーステップ: 各タスクは5-10分で完了可能なサイズ