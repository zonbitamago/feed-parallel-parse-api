# Tasks: アプリ内インタラクティブチュートリアル

**Feature**: 017-in-app-tutorial
**Input**: Design documents from `/specs/017-in-app-tutorial/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

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
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/`, `backend/src/`
- This feature: Frontend only (`frontend/src/`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: driver.jsのインストールと型定義確認

- [ ] T001 driver.jsをインストール: `cd frontend && npm install driver.js`
- [ ] T002 [P] TypeScript型定義の確認: `npx tsc --noEmit`でdriver.jsの型が利用可能か確認
- [ ] T003 [P] tutorialSteps.tsの作成（TDD不要、定数定義のみ）: `frontend/src/constants/tutorialSteps.ts`に7ステップのTutorialStep[]定義

**Checkpoint**: driver.jsインストール完了、型定義利用可能

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 既存の`useLocalStorage`フックの確認（ユーザーストーリー実装の前提）

**⚠️ CRITICAL**: すべてのユーザーストーリーが`useLocalStorage`フックに依存するため、Phase 2で確認必須

- [ ] T004 既存のuseLocalStorage.tsを確認: `frontend/src/hooks/useLocalStorage.ts`が存在し、正しく動作することを確認

**Checkpoint**: useLocalStorageフック確認完了 - ユーザーストーリー実装開始可能

---

## Phase 3: User Story 1 - 初回訪問時の自動チュートリアル表示 (Priority: P1) 🎯 MVP

**Goal**: 新規ユーザーがアプリを初めて訪問したとき（購読フィード0件）、自動的にインタラクティブなチュートリアルが表示され、7ステップで使い方を学べる

**Independent Test**:
1. localStorageを削除（`rss_reader_tutorial_seen`）
2. フィードが0件の状態でページリロード
3. チュートリアルが自動表示され、7ステップすべてを完了またはスキップできる
4. 完了後、localStorageに`true`が保存される
5. ページリロードで再度自動表示されない

**TDD Strategy**: Red-Green-Refactor サイクルを厳守（Constitution要件）

### 🔴 Red Phase: Tests for US1（失敗するテストを先に書く）

> **テストが仕様**: これらのテストコードが要求仕様の実行可能なドキュメントとなる

**CRITICAL**: これらのテストは実装前に書き、失敗することを確認する

- 1行のプロダクションコードも、失敗するテストなしには書かない
- テストが失敗することを確認 = 正しく失敗することを確認（コンパイルエラーも「Red」）

**Red Phase の意義**:
- テストがない状態で実装すると、テストが実装に引きずられる
- テストを先に書くことで、「あるべき姿」を明確にする
- 失敗を確認することで、テスト自体が正しいことを検証

- [ ] T005 [P] [US1] useTutorialフックのテスト作成（Red）: `frontend/src/hooks/useTutorial.test.ts`作成、4つのテストケース実装（初回訪問時true、startTutorial後localStorage保存、2回目訪問時false、resetTutorialでクリア）、全テスト失敗を確認（`useTutorial.ts`未実装のためimportエラー期待）

**Checkpoint**: 全テストが期待通り失敗することを確認（Red完了）

### ✅ Green Phase: Minimum Implementation for US1（テストを通す）

> **最小限のコードでテストを通す**: 品質は問わない、まず動かす

- [ ] T006 [US1] useTutorialフックの実装（Green）: `frontend/src/hooks/useTutorial.ts`作成、useLocalStorage活用、driver()関数呼び出し、TUTORIAL_STEPS渡し、全テスト成功を確認

**Checkpoint**: 全テストがパス（Green完了）

### ♻️ Refactor Phase: Code Quality Improvement for US1

> **テストを通したまま、コードの品質を向上させる**

- [ ] T007 [US1] useTutorialフックのリファクタリング（Refactor）: 重複排除、命名改善、マジックストリング削除（`TUTORIAL_STORAGE_KEY`、`PROGRESS_TEXT`定数化）、コメント追加、テスト維持を確認

**Checkpoint**: リファクタリング完了、テスト維持確認

### App.tsx Integration for US1

**Next Red-Green-Refactor Cycle**: App.tsxへの統合

#### 🔴 Red: App.tsx Integration Tests

- [ ] T008 [P] [US1] App.tsxへの統合テスト作成（Red）: `frontend/src/App.test.tsx`更新、3つのテストケース追加（フィード0件時チュートリアル自動表示、フィード1件以上時非表示、localStorage既存時非表示）、driver.jsモック化、全テスト失敗を確認

**Checkpoint**: App.tsx統合テストが期待通り失敗（Red完了）

#### ✅ Green: App.tsx Integration Implementation

- [ ] T009 [US1] App.tsxにuseTutorial統合（Green）: driver.css インポート（`import 'driver.js/dist/driver.css'`）、useTutorial呼び出し、useEffectで初回表示ロジック実装（`subscriptions.length === 0 && shouldShowTutorial`）、全テスト成功を確認

**Checkpoint**: App.tsx統合テスト全パス（Green完了）

### Manual Testing & Selector Verification for US1

- [ ] T010 [US1] CSSセレクターの実装確認と修正: ローカル環境起動（`npm run dev`）、DevToolsで各ステップの実際の要素を検査、`tutorialSteps.ts`のセレクター更新、手動テストでチュートリアル表示確認

### Responsive Testing for US1

- [ ] T011 [P] [US1] レスポンシブ対応の確認: デスクトップ（1920px）、タブレット（768px）、モバイル（375px）でテスト、ポップアップ位置調整（`side`, `align`）

### US1 Final Integration Test

- [ ] T012 [US1] Phase 3（US1）の統合テスト: フィード0件で新規ブラウザ起動、チュートリアル自動表示確認、7ステップすべて進行、localStorage確認、ページリロードで再表示されないことを確認

**US1 Definition of Done**:
- [x] すべてのテストがパス
- [x] useTutorialフックのカバレッジ100%
- [x] 初回訪問時にチュートリアル自動表示
- [x] 7ステップすべて表示可能
- [x] localStorageに状態保存
- [x] TypeScript型チェックパス
- [x] ESLint警告ゼロ

**US1 MVP Ready**: この時点でMVP（Minimum Viable Product）として価値提供可能

---

## Phase 4: User Story 2 - ヘルプボタンからのチュートリアル再表示 (Priority: P2)

**Goal**: 既存ユーザーがアプリのヘッダーに表示されたヘルプボタンをクリックすることで、いつでもチュートリアルを再開できる

**Independent Test**:
1. アプリのヘッダーにヘルプボタン（アイコン付き）が表示される
2. ヘルプボタンをクリック
3. チュートリアルが最初のステップから開始される
4. US1と同じフローで操作可能

**TDD Strategy**: Red-Green-Refactor サイクル

### 🔴 Red Phase: Tests for US2

- [ ] T013 [P] [US2] ヘルプボタンのテスト作成（Red）: `frontend/src/App.test.tsx`更新、3つのテストケース追加（ヘッダーにヘルプボタン表示、クリックでstartTutorial呼び出し、ツールチップ「ヘルプ」表示）、全テスト失敗を確認

**Checkpoint**: ヘルプボタンテストが期待通り失敗（Red完了）

### ✅ Green Phase: Minimum Implementation for US2

- [ ] T014 [US2] ヘルプボタンの実装（Green）: `frontend/src/App.tsx`のヘッダーにボタン追加、HelpCircleIcon（SVG）、onClick={startTutorial}、aria-label="チュートリアルを表示"、全テスト成功を確認

**Checkpoint**: ヘルプボタンテスト全パス（Green完了）

### ♻️ Refactor Phase: UI Polish for US2

- [ ] T015 [P] [US2] ヘルプボタンのスタイリング（Refactor）: TailwindCSSクラス適用、ホバー効果、フォーカス表示、レスポンシブ配置

- [ ] T016 [P] [US2] ツールチップの実装: title属性またはTailwindCSS tooltipで「ヘルプ」または「チュートリアルを表示」を表示

### US2 Integration Test

- [ ] T017 [US2] Phase 4（US2）の統合テスト: ヘルプボタンクリック、チュートリアル表示確認、既にチュートリアル完了済みでも表示可能、全ステップ進行可能

**US2 Definition of Done**:
- [x] ヘルプボタンがヘッダーに表示
- [x] クリックでチュートリアル開始
- [x] ツールチップ表示
- [x] すべてのテストがパス

---

## Phase 5: User Story 3 - レスポンシブ対応とモバイル最適化 (Priority: P3)

**Goal**: チュートリアルがデスクトップ、タブレット、スマートフォンのすべてのデバイスで適切に表示される

**Independent Test**:
1. 4つの画面サイズ（320px、768px、1024px、1920px）でチュートリアル表示
2. すべてのステップでポップアップが画面内に収まる
3. テキストが読みやすい
4. ボタンがタッチ操作可能なサイズ

**TDD Strategy**: 手動テスト中心（E2Eテストは将来的にPlaywrightで追加可能）

### Manual Responsive Testing

- [ ] T018 [P] [US3] モバイル（320px-767px）での表示確認: ポップアップが画面内に収まるか、テキスト読みやすいか、ボタンがタッチ操作可能か、必要に応じて`side`, `align`調整

- [ ] T019 [P] [US3] タブレット（768px-1023px）での表示確認: 横向き・縦向き両方、ポップアップ位置調整

- [ ] T020 [P] [US3] デスクトップ（1024px以上）での表示確認: 大画面でのポップアップ配置、ハイライトが見やすいか

### Custom Styling

- [ ] T021 [P] [US3] driver.jsのカスタムスタイリング: TailwindCSSクラスの適用方法確認、`popoverClass`, `activeElement`スタイル、テーマカラーの適用

### US3 Integration Test

- [ ] T022 [US3] Phase 5（US3）の統合テスト: 4つの画面サイズ（320px, 768px, 1024px, 1920px）でテスト、すべてのステップで画面内表示、レスポンシブ動作確認

**US3 Definition of Done**:
- [x] 全画面サイズで適切に表示
- [x] カスタムスタイルが適用
- [x] TailwindCSSのテーマカラー統一

---

## Phase 6: User Story 4 - アクセシビリティ対応 (Priority: P3)

**Goal**: チュートリアルがスクリーンリーダーユーザーやキーボード操作のみのユーザーでも利用できる

**Independent Test**:
1. キーボードのみ（マウス不使用）で全ステップ完了
2. スクリーンリーダー（NVDA、JAWS、VoiceOver）で各ステップの説明が正しく読み上げられる
3. axe DevToolsで警告ゼロ

**TDD Strategy**: 手動テスト + アクセシビリティ監査

### ARIA Attributes Research

- [ ] T023 [P] [US4] driver.jsのARIA属性確認: デフォルトのARIA属性を調査、不足している属性の特定、カスタマイズ方法の確認

### ARIA Customization (if needed)

- [ ] T024 [P] [US4] ARIA属性のカスタマイズ（必要な場合）: `role="dialog"`, `aria-labelledby`, `aria-describedby`をdriver.jsの設定オプションで追加、Chrome Accessibility Tree確認

### Manual Accessibility Testing

- [ ] T025 [P] [US4] キーボード操作のテスト: Tabキーでフォーカス移動、Enterキーで次へ、Escapeキーで終了、手動テスト実施

- [ ] T026 [P] [US4] スクリーンリーダーテスト: NVDA（Windows）またはVoiceOver（Mac）で読み上げ確認、各ステップのタイトル・説明が読み上げられるか、ボタンの役割が明確か

### US4 Integration Test

- [ ] T027 [US4] Phase 6（US4）の統合テスト: キーボードのみで全ステップ完了、スクリーンリーダーで音声確認、axe DevToolsで検証

**US4 Definition of Done**:
- [x] ARIA属性が適切に設定
- [x] キーボードのみで操作可能
- [x] スクリーンリーダーで読み上げ可能
- [x] axe DevTools で警告ゼロ

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: エッジケースの処理、パフォーマンス最適化、ドキュメント更新

### Edge Cases

- [ ] T028 [P] エッジケースのテスト追加: ウィンドウリサイズ中の動作、対象要素が存在しない場合、localStorage無効時の動作、複数タブでの動作

### Error Handling

- [ ] T029 [P] エラーハンドリングの実装: driver.js初期化失敗時のフォールバック、console.errorでログ出力、ユーザーにエラーを表示しない（サイレント失敗）

### Performance Testing

- [ ] T030 [P] パフォーマンステスト: Lighthouseでパフォーマンス測定、初回読み込み時間の影響確認（+200ms以内）、バンドルサイズ確認（+5-7kb）

### Documentation

- [ ] T031 [P] SPECIFICATION.md更新: セクション9（UI/UX設計）にチュートリアル機能を追加

- [ ] T032 [P] README.md更新（必要な場合）: 新機能セクションにチュートリアル機能を追加、使い方を説明

### Final Integration Test

- [ ] T033 最終統合テスト: 新規ブラウザで全フロー実行、ヘルプボタンから再表示、キーボード操作、スクリーンリーダー、モバイル・デスクトップ両方

**Phase 7 Definition of Done**:
- [x] すべてのエッジケースをカバー
- [x] エラーハンドリング実装
- [x] パフォーマンス基準クリア
- [x] ドキュメント更新完了
- [x] 最終統合テスト完了

---

## Dependencies & Execution Strategy

### User Story Dependencies

```
Phase 1: Setup (T001-T003)
    ↓
Phase 2: Foundational (T004)
    ↓
Phase 3: US1 (T005-T012) ✅ MVP - 独立して実装・テスト可能
    ↓ (US1完了後)
Phase 4: US2 (T013-T017) - US1に依存（useTutorialフック使用）
    ↓ (US2完了後、並列実行可能↓)
Phase 5: US3 (T018-T022) ━━┓
                            ┣━━ 並列実行可能
Phase 6: US4 (T023-T027) ━━┛
    ↓ (US3, US4完了後)
Phase 7: Polish (T028-T033)
```

### Parallel Execution Opportunities

#### Phase 1: Setup
- T002 (型定義確認) と T003 (tutorialSteps.ts作成) は並列実行可能

#### Phase 3: US1
- T005 (useTutorialテスト) と T008 (App.tsxテスト) は並列実行可能（異なるファイル）
- T010 (セレクター確認) と T011 (レスポンシブ確認) は並列実行可能

#### Phase 4: US2
- T015 (スタイリング) と T016 (ツールチップ) は並列実行可能

#### Phase 5 & Phase 6: 完全並列
- Phase 5（US3）とPhase 6（US4）は完全に独立しており、並列実行可能

#### Phase 7: Polish
- T028 (エッジケース)、T029 (エラーハンドリング)、T030 (パフォーマンス)、T031 (SPEC更新)、T032 (README更新) はすべて並列実行可能

### MVP Implementation Strategy

**MVP Scope**: User Story 1のみ（T001-T012）

**Rationale**:
- US1単独で価値提供可能（新規ユーザーのオンボーディング）
- 最小限の実装で主要機能を検証
- US2-US4は段階的に追加可能

**MVP Timeline**: 1-1.5日（quickstart.mdのPhase 2.1に対応）

**Incremental Delivery**:
1. MVP: US1（初回表示）
2. Iteration 2: US1 + US2（ヘルプボタン）
3. Iteration 3: US1 + US2 + US3 + US4（レスポンシブ + アクセシビリティ）
4. Final: All + Polish

---

## Summary

- **Total Tasks**: 33
- **US1 (MVP)**: 8 tasks (T005-T012)
- **US2**: 5 tasks (T013-T017)
- **US3**: 5 tasks (T018-T022)
- **US4**: 5 tasks (T023-T027)
- **Setup + Foundational**: 4 tasks (T001-T004)
- **Polish**: 6 tasks (T028-T033)

**Parallel Opportunities**: 17 tasks marked with [P]

**Independent Test Criteria**:
- ✅ US1: 初回訪問時に自動表示され、7ステップ完了可能
- ✅ US2: ヘルプボタンからいつでも再表示可能
- ✅ US3: 全画面サイズで適切に表示
- ✅ US4: キーボード+スクリーンリーダーで操作可能

**Suggested MVP Scope**: User Story 1のみ（T001-T012）

**Format Validation**: ✅ All 33 tasks follow checklist format (checkbox, ID, [P]/[Story] labels, file paths)

**Ready for `/speckit.implement`**: このtasks.mdに従って実装を開始できます
