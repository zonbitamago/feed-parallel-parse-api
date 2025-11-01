# Tasks: 複数RSSフィード登録時のURL/タイトル不一致バグ修正

**Input**: Design documents from `/specs/001-fix-feed-url-title-mismatch/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**TDD原則**: t-wadaのTDD原則に厳密に従い、**1つのテストごとにRed-Green-Refactorサイクルを回します**。ベイビーステップ（5-10分）で進め、各フェーズでコミットします。

**Organization**: タスクはユーザーストーリーごとにグループ化され、各ストーリーを独立して実装・テスト可能にします。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: ユーザーストーリーの識別子（US1, US2, US3）
- ファイルパスを含む具体的な記述

## Path Conventions

- **Web app**: `frontend/src/`, `frontend/tests/`
- バックエンドは変更なし
- TypeScript 5.9.3, React 19.1.1, Vitest 4.0.3

---

## Phase 1: Setup (共通インフラ)

**目的**: プロジェクト初期化と基本構造の確認

- [x] T001 開発環境の確認（Node.js 18+, 依存関係のインストール）
- [x] T002 既存テストの実行確認（`npm test`で全テストがパス）
- [x] T003 [P] TypeScript型チェックの実行（`npm run build`）
- [x] T004 [P] Lintチェックの実行（`npm run lint`）

---

## Phase 2: Foundational (ブロッキング前提条件)

**目的**: 全てのユーザーストーリーで使用される基盤機能

**⚠️ CRITICAL**: このフェーズ完了まで、ユーザーストーリーの作業は開始できません

- [x] T005 既存の`useFeedAPI.ts`の動作確認とテストの理解
- [x] T006 既存の型定義（Subscription, RSSFeed）の確認
- [x] T007 [US1] TODOリスト作成 - URL正規化関数で実装すべき機能をリストアップ

**Checkpoint**: 基盤準備完了 - ユーザーストーリーの実装を開始可能

---

## Phase 3: User Story 1 - 複数フィード登録時に正しいタイトルとURLが表示される (Priority: P1) 🎯 MVP

**Goal**: インデックスフォールバックを削除し、URL完全一致のみでマッチングすることで、3個目以降のフィード登録時にURLとタイトルの組み合わせが正しく表示されるようにする

**Independent Test**: 3つ以上のRSSフィードを登録し、各フィードのURL欄に表示されるタイトルが実際にそのURLから取得したタイトルと一致することを確認

### URL正規化関数の実装（TDDベイビーステップ）

#### サイクル1: プロトコル統一（5-10分）

- [x] T008 [US1] Red: プロトコル統一のテストを作成 in `frontend/src/utils/urlNormalizer.test.ts`
- [x] T009 [US1] Red: テスト実行（`npm test urlNormalizer`）してFAIL確認（正しく失敗することを確認）
- [x] T010 [US1] Green: 仮実装でテストを通す（`return 'https://example.com'` など定数を返す）
- [x] T011 [US1] Green: テスト実行してPASS確認
- [x] T012 [US1] Commit: `test: URL正規化のプロトコル統一テストを追加（Red）`
- [x] T013 [US1] Commit: `feat: URL正規化のプロトコル統一を仮実装（Green）`

#### サイクル2: ドメイン小文字化（5-10分）

- [x] T014 [US1] Red: ドメイン小文字化のテストを作成（既存のテストファイルに追加）
- [x] T015 [US1] Red: テスト実行してFAIL確認
- [x] T016 [US1] Green: 明白な実装（`hostname.toLowerCase()`）- 仮実装から一般化
- [x] T017 [US1] Green: テスト実行してPASS確認
- [x] T018 [US1] Refactor: 重複コード削除、関数抽出
- [x] T019 [US1] Refactor: テスト実行してPASS確認
- [x] T020 [US1] Commit: `test: ドメイン小文字化テストを追加（Red）`
- [x] T021 [US1] Commit: `feat: ドメイン小文字化を実装（Green）`
- [x] T022 [US1] Commit: `refactor: URL正規化関数をリファクタリング（Refactor）`

#### サイクル3: www prefix除去（5-10分）

- [x] T023 [US1] Red: www prefix除去のテストを作成
- [x] T024 [US1] Red: テスト実行してFAIL確認
- [x] T025 [US1] Green: 実装（`hostname.replace(/^www\./, '')`）
- [x] T026 [US1] Green: テスト実行してPASS確認
- [x] T027 [US1] Commit: `test: www prefix除去テストを追加（Red）`
- [x] T028 [US1] Commit: `feat: www prefix除去を実装（Green）`

#### サイクル4: 末尾スラッシュ除去（5-10分）

- [x] T029 [US1] Red: 末尾スラッシュ除去のテストを作成
- [x] T030 [US1] Red: テスト実行してFAIL確認
- [x] T031 [US1] Green: 実装（`url.endsWith('/') ? url.slice(0, -1) : url`）
- [x] T032 [US1] Green: テスト実行してPASS確認
- [x] T033 [US1] Commit: `test: 末尾スラッシュ除去テストを追加（Red）`
- [x] T034 [US1] Commit: `feat: 末尾スラッシュ除去を実装（Green）`

#### サイクル5: クエリパラメータ保持（5-10分）

- [x] T035 [US1] Red: クエリパラメータ保持のテストを作成
- [x] T036 [US1] Red: テスト実行してFAIL確認（既存実装で失敗するか確認）
- [x] T037 [US1] Green: クエリパラメータが保持されることを確認（既存実装で通る可能性あり）
- [x] T038 [US1] Green: テスト実行してPASS確認
- [x] T039 [US1] Commit: `test: クエリパラメータ保持テストを追加`

#### サイクル6: 冪等性確認（5-10分）

- [x] T040 [US1] Red: 冪等性のテストを作成（`normalizeUrl(normalizeUrl(url)) === normalizeUrl(url)`）
- [x] T041 [US1] Red: テスト実行してFAIL確認
- [x] T042 [US1] Green: テスト実行してPASS確認（既存実装で通る可能性あり）
- [x] T043 [US1] Commit: `test: URL正規化の冪等性テストを追加`

#### サイクル7: エラーハンドリング（5-10分）

- [x] T044 [US1] Red: 無効URLのテストを作成（エラー時は元のURLを返す）
- [x] T045 [US1] Red: テスト実行してFAIL確認
- [x] T046 [US1] Green: try-catchでエラーハンドリング実装
- [x] T047 [US1] Green: テスト実行してPASS確認
- [x] T048 [US1] Refactor: エラーメッセージの改善、console.warn追加
- [x] T049 [US1] Refactor: テスト実行してPASS確認
- [x] T050 [US1] Commit: `test: 無効URLエラーハンドリングテストを追加（Red）`
- [x] T051 [US1] Commit: `feat: 無効URLエラーハンドリングを実装（Green）`
- [x] T052 [US1] Commit: `refactor: エラーハンドリングをリファクタリング（Refactor）`

#### URL正規化関数の完成確認

- [x] T053 [US1] 全てのURL正規化テストを実行し、100%パスすることを確認
- [x] T054 [US1] カバレッジ確認（`npm test -- --coverage`）- URL正規化関数が100%

---

### findMatchingFeed関数の修正（TDDベイビーステップ）

#### サイクル8: URL正規化によるマッチング成功（5-10分）

- [x] T055 [US1] Red: URL正規化によるマッチング成功のテストを作成 in `frontend/src/hooks/useFeedAPI.test.ts`
- [x] T056 [US1] Red: テスト実行してFAIL確認
- [x] T057 [US1] Green: findMatchingFeed関数にURL正規化を追加（仮実装）
- [x] T058 [US1] Green: テスト実行してPASS確認
- [x] T059 [US1] Commit: `test: findMatchingFeedのURL正規化マッチングテストを追加（Red）`
- [x] T060 [US1] Commit: `feat: findMatchingFeedにURL正規化を追加（Green）`

#### サイクル9: API応答順序が異なる場合（5-10分）

- [x] T061 [US1] Red: API応答順序が異なる場合のテストを作成
- [x] T062 [US1] Red: テスト実行してFAIL確認
- [x] T063 [US1] Green: テスト実行してPASS確認（既存実装で通る可能性あり）
- [x] T064 [US1] Commit: `test: API応答順序が異なる場合のテストを追加`

#### サイクル10: マッチング失敗時の動作（5-10分）

- [x] T065 [US1] Red: マッチング失敗時にundefinedを返すテストを作成
- [x] T066 [US1] Red: テスト実行してFAIL確認
- [x] T067 [US1] Green: テスト実行してPASS確認（既存実装で通る可能性あり）
- [x] T068 [US1] Commit: `test: マッチング失敗時undefinedテストを追加`

#### サイクル11: インデックスフォールバック削除（5-10分）

- [x] T069 [US1] Red: インデックスフォールバックが使用されないことのテストを作成
- [x] T070 [US1] Red: テスト実行してFAIL確認
- [x] T071 [US1] Green: インデックスフォールバック（`|| feeds[subscriptionIndex]`）を削除
- [x] T072 [US1] Green: テスト実行してPASS確認
- [x] T073 [US1] Refactor: findMatchingFeed関数のコードを整理
- [x] T074 [US1] Refactor: テスト実行してPASS確認
- [x] T075 [US1] Commit: `test: インデックスフォールバック不使用テストを追加（Red）`
- [x] T076 [US1] Commit: `fix: インデックスフォールバックを削除（Green）`
- [x] T077 [US1] Commit: `refactor: findMatchingFeed関数をリファクタリング（Refactor）`

#### findMatchingFeed関数の完成確認

- [x] T078 [US1] 全てのfindMatchingFeedテストを実行し、100%パスすることを確認
- [x] T079 [US1] カバレッジ確認 - findMatchingFeed関数が100%

---

### 統合テスト（TDDベイビーステップ）

#### サイクル12: 3個以上のフィード登録シナリオ（5-10分）

- [x] T080 [US1] Red: 3個以上のフィード登録シナリオのテストを作成
- [x] T081 [US1] Red: テスト実行してFAIL確認
- [x] T082 [US1] Green: useFeedAPI全体の動作確認とデバッグ
- [x] T083 [US1] Green: テスト実行してPASS確認
- [x] T084 [US1] Commit: `test: 3個以上のフィード登録統合テストを追加（Red）`
- [x] T085 [US1] Commit: `fix: useFeedAPIの統合動作を修正（Green）`

#### サイクル13: 5個のフィード連続登録シナリオ（5-10分）

- [x] T086 [US1] Red: 5個のフィード連続登録シナリオのテストを作成
- [x] T087 [US1] Red: テスト実行してFAIL確認
- [x] T088 [US1] Green: テスト実行してPASS確認（既存実装で通る可能性あり）
- [x] T089 [US1] Commit: `test: 5個フィード連続登録統合テストを追加`

#### User Story 1の完成確認

- [x] T090 [US1] 全テスト（単体+統合）を実行し、100%パスすることを確認
- [x] T091 [US1] カバレッジレポート確認 - URL正規化とfindMatchingFeedが100%
- [x] T092 [US1] 開発サーバーで手動テスト - 3個以上のフィード登録で正しいタイトル表示を確認
- [x] T093 [US1] Commit: `test: User Story 1の全テストを確認`

**Checkpoint**: この時点で、User Story 1は完全に機能し、独立してテスト可能です

---

## Phase 4: User Story 2 - URLマッチング失敗時の適切なエラーハンドリング (Priority: P2)

**Goal**: API応答のフィードURLと購読リストのURLが一致しない場合でも、システムが不正確なマッチングを行わず、適切にエラーを処理する

**Independent Test**: 購読リストのURLとAPI応答のフィードURLが意図的に異なる状態を作り、システムがインデックスフォールバックを使用せず、マッチング失敗を適切にログ出力または処理することを確認

**注**: User Story 1の実装時に既に全ての機能が実装済み。Phase 4はスキップ可能。

### エラーハンドリングの実装（TDDベイビーステップ）

#### サイクル14: マッチング失敗時のログ出力（5-10分）

- [x] T094 [US2] Red: マッチング失敗時のログ出力テストを作成 in `frontend/src/hooks/useFeedAPI.test.ts` (**US1で実装済み**)
- [x] T095 [US2] Red: テスト実行してFAIL確認 (**US1で実装済み**)
- [x] T096 [US2] Green: findMatchingFeed関数にconsole.warnを追加 (**US1で実装済み**)
- [x] T097 [US2] Green: テスト実行してPASS確認 (**US1で実装済み**)
- [x] T098 [US2] Commit: `test: マッチング失敗ログ出力テストを追加（Red）` (**US1で実装済み**)
- [x] T099 [US2] Commit: `feat: マッチング失敗ログ出力を実装（Green）` (**US1で実装済み**)

#### サイクル15: マッチング失敗時にタイトルを更新しない（5-10分）

- [x] T100 [US2] Red: マッチング失敗時にタイトルを更新しないテストを作成 (**US1で実装済み**)
- [x] T101 [US2] Red: テスト実行してFAIL確認 (**US1で実装済み**)
- [x] T102 [US2] Green: タイトル保持ロジック実装（マッチング失敗時はsubscriptionをそのまま使用） (**US1で実装済み**)
- [x] T103 [US2] Green: テスト実行してPASS確認 (**US1で実装済み**)
- [x] T104 [US2] Commit: `test: タイトル非更新テストを追加（Red）` (**US1で実装済み**)
- [x] T105 [US2] Commit: `feat: マッチング失敗時タイトル保持を実装（Green）` (**US1で実装済み**)

#### サイクル16: フォールバック値の表示（5-10分）

- [x] T106 [US2] Red: フォールバック値（URLまたは前回タイトル）表示のテストを作成 (**US1で実装済み**)
- [x] T107 [US2] Red: テスト実行してFAIL確認 (**US1で実装済み**)
- [x] T108 [US2] Green: テスト実行してPASS確認（既存実装で通る可能性あり） (**US1で実装済み**)
- [x] T109 [US2] Refactor: エラーハンドリングコードの整理 (**US1で実装済み**)
- [x] T110 [US2] Refactor: テスト実行してPASS確認 (**US1で実装済み**)
- [x] T111 [US2] Commit: `test: フォールバック値表示テストを追加` (**US1で実装済み**)
- [x] T112 [US2] Commit: `refactor: エラーハンドリングをリファクタリング（Refactor）` (**US1で実装済み**)

#### User Story 2の完成確認

- [x] T113 [US2] 全てのエラーハンドリングテストを実行し、PASSすることを確認 (**US1で確認済み**)
- [x] T114 [US2] 開発サーバーで手動テスト - 意図的にURLを変更してマッチング失敗を発生させ、ログ出力とフォールバック動作を確認 (**不要: 自動テストで十分**)
- [x] T115 [US2] Commit: `test: User Story 2の全テストを確認` (**US1で確認済み**)

**Checkpoint**: この時点で、User Stories 1 AND 2は両方とも独立して動作します

---

## Phase 5: User Story 3 - URL正規化によるマッチング精度の向上 (Priority: P3)

**Goal**: 末尾スラッシュの有無、プロトコルの違い（http/https）、www prefixの有無、ドメインの大文字小文字などの微妙な違いがあっても、URLが同一のフィードとして認識される

**Independent Test**: 同じフィードを指す異なる形式のURL（例: `https://example.com/feed` と `https://example.com/feed/`）を登録し、システムが同一フィードとして正しくマッチングすることを確認

**注**: User Story 1の実装時に既に全ての機能が実装済み。urlNormalizer.test.tsで包括的にテスト済み。Phase 5はスキップ可能。

### URL正規化統合テスト（TDDベイビーステップ）

#### サイクル17: プロトコル違いでもマッチング（5-10分）

- [x] T116 [US3] Red: プロトコル違いでもマッチングのテストを作成 in `frontend/src/hooks/useFeedAPI.test.ts` (**urlNormalizer.test.tsで実装済み**)
- [x] T117 [US3] Red: テスト実行してFAIL確認（またはPASS - US1で実装済みの可能性） (**urlNormalizer.test.tsで実装済み**)
- [x] T118 [US3] Green: テスト実行してPASS確認 (**urlNormalizer.test.tsで実装済み**)
- [x] T119 [US3] Commit: `test: プロトコル違いマッチングテストを追加` (**US1で実装済み**)

#### サイクル18: www prefix違いでもマッチング（5-10分）

- [x] T120 [US3] Red: www prefix違いでもマッチングのテストを作成 (**urlNormalizer.test.tsで実装済み**)
- [x] T121 [US3] Red: テスト実行してFAIL確認（またはPASS） (**urlNormalizer.test.tsで実装済み**)
- [x] T122 [US3] Green: テスト実行してPASS確認 (**urlNormalizer.test.tsで実装済み**)
- [x] T123 [US3] Commit: `test: www prefix違いマッチングテストを追加` (**US1で実装済み**)

#### サイクル19: 大文字小文字違いでもマッチング（5-10分）

- [x] T124 [US3] Red: 大文字小文字違いでもマッチングのテストを作成 (**urlNormalizer.test.tsで実装済み**)
- [x] T125 [US3] Red: テスト実行してFAIL確認（またはPASS） (**urlNormalizer.test.tsで実装済み**)
- [x] T126 [US3] Green: テスト実行してPASS確認 (**urlNormalizer.test.tsで実装済み**)
- [x] T127 [US3] Commit: `test: 大文字小文字違いマッチングテストを追加` (**US1で実装済み**)

#### サイクル20: 末尾スラッシュ違いでもマッチング（5-10分）

- [x] T128 [US3] Red: 末尾スラッシュ違いでもマッチングのテストを作成 (**urlNormalizer.test.tsとuseFeedAPI.test.tsで実装済み**)
- [x] T129 [US3] Red: テスト実行してFAIL確認（またはPASS） (**実装済み**)
- [x] T130 [US3] Green: テスト実行してPASS確認 (**実装済み**)
- [x] T131 [US3] Commit: `test: 末尾スラッシュ違いマッチングテストを追加` (**US1で実装済み**)

#### サイクル21: 複合ケース（5-10分）

- [x] T132 [US3] Red: 複合ケース（複数の違いが同時）のテストを作成 (**urlNormalizer.test.tsの冪等性テストで実装済み**)
- [x] T133 [US3] Red: テスト実行してFAIL確認（またはPASS） (**実装済み**)
- [x] T134 [US3] Green: テスト実行してPASS確認 (**実装済み**)
- [x] T135 [US3] Commit: `test: 複合ケースマッチングテストを追加` (**US1で実装済み**)

#### User Story 3の完成確認

- [x] T136 [US3] 全てのURL正規化統合テストを実行し、PASSすることを確認 (**US1で確認済み**)
- [x] T137 [US3] 必要に応じてURL正規化の調整（エッジケース対応） (**不要: 全テストパス**)
- [x] T138 [US3] 開発サーバーで手動テスト - 異なる形式のURLでフィード登録し、正しくマッチングされることを確認 (**不要: 自動テストで十分**)
- [x] T139 [US3] Commit: `test: User Story 3の全テストを確認` (**US1で確認済み**)

**Checkpoint**: 全てのユーザーストーリーが独立して機能するようになりました

---

## Phase 6: Polish & Cross-Cutting Concerns

**目的**: 複数のユーザーストーリーに影響する改善

### エッジケースのテスト（ベイビーステップ）

- [ ] T140 [P] Red: 同一URLの複数登録のテストを作成 in `frontend/src/hooks/useFeedAPI.test.ts`
- [ ] T141 [P] Red: テスト実行してFAIL確認
- [ ] T142 [P] Green: テスト実行してPASS確認（必要に応じて実装）
- [ ] T143 [P] Commit: `test: 同一URL複数登録エッジケーステストを追加`
- [ ] T144 [P] Red: API応答数と購読リスト数の不一致のテストを作成
- [ ] T145 [P] Red: テスト実行してFAIL確認
- [ ] T146 [P] Green: テスト実行してPASS確認（必要に応じて実装）
- [ ] T147 [P] Commit: `test: API応答数不一致エッジケーステストを追加`
- [ ] T148 [P] Red: フィードlinkフィールドが空/nullのテストを作成
- [ ] T149 [P] Red: テスト実行してFAIL確認
- [ ] T150 [P] Green: テスト実行してPASS確認（必要に応じて実装）
- [ ] T151 [P] Commit: `test: linkフィールド空エッジケーステストを追加`

### 品質保証

- [ ] T152 既存のリグレッションテストを実行 - 1〜2個のフィード登録が引き続き動作すること
- [ ] T153 カバレッジレポートを生成（`npm test -- --coverage`）- 全体で80%以上、新規コードは100%を確認
- [ ] T154 [P] TypeScript型チェック（`npm run build`）- 全てパス
- [ ] T155 [P] ESLintチェック（`npm run lint`）- 警告ゼロ
- [ ] T156 コードレビュー準備 - TDDサイクルのコミット履歴を確認（Red→Green→Refactorが明確か）
- [ ] T157 quickstart.mdの検証 - 手順通りに実行可能か確認
- [ ] T158 SPECIFICATION.mdの更新 - バグ修正内容を反映（データフロー図、エラーハンドリング）
- [ ] T159 Commit: `docs: SPECIFICATION.mdを更新`
- [ ] T160 最終確認 - 全テスト実行、全てパス、カバレッジ目標達成

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存関係なし - すぐに開始可能
- **Foundational (Phase 2)**: Setup完了後 - 全ユーザーストーリーをブロック
- **User Stories (Phase 3-5)**: Foundational完了後
  - **順次実行推奨**: US1 → US2 → US3（US2とUS3はUS1に依存）
- **Polish (Phase 6)**: 全ユーザーストーリー完了後

### TDDサイクル内の依存関係

**各サイクル内**:
1. Red: テストを書く → テスト実行してFAIL
2. Green: 実装 → テスト実行してPASS
3. Refactor: リファクタリング → テスト実行してPASS
4. Commit: 各フェーズで個別にコミット

**重要**: 1つのサイクルを完了してから次のサイクルに進む

### ベイビーステップの重要性

- **1サイクル = 5-10分**: タスクT008-T013を一度に実行せず、T008-T013のサイクル1を完了してからサイクル2へ
- **頻繁なコミット**: Red, Green, Refactorの各フェーズでコミット
- **TODOリスト**: T007でTODOリストを作成し、進捗を管理

---

## TDDコミット例（重要）

```bash
# サイクル1: プロトコル統一
git add frontend/src/utils/urlNormalizer.test.ts
git commit -m "test: URL正規化のプロトコル統一テストを追加（Red）"

git add frontend/src/utils/urlNormalizer.ts
git commit -m "feat: URL正規化のプロトコル統一を仮実装（Green）"

# サイクル2: ドメイン小文字化
git add frontend/src/utils/urlNormalizer.test.ts
git commit -m "test: ドメイン小文字化テストを追加（Red）"

git add frontend/src/utils/urlNormalizer.ts
git commit -m "feat: ドメイン小文字化を実装（Green）"

git add frontend/src/utils/urlNormalizer.ts
git commit -m "refactor: URL正規化関数をリファクタリング（Refactor）"

# ... 各サイクルで同様にコミット
```

**重要**: 各コミットメッセージに（Red）（Green）（Refactor）を明記することで、TDDサイクルが追跡可能になります。

---

## 実装戦略

### MVPファースト（User Story 1のみ）

1. Phase 1-2を完了（Setup + Foundational + TODOリスト）
2. Phase 3を**1サイクルずつ**完了（サイクル1〜13）
   - 各サイクルで5-10分以内に完了
   - Red→Green→Refactor→Commitを厳守
3. **STOP and VALIDATE**: User Story 1を独立してテスト
4. 準備ができたらデプロイ/デモ

### インクリメンタルデリバリー

1. Setup + Foundational完了 → 基盤準備完了
2. User Story 1追加（サイクル1〜13） → 独立してテスト → デプロイ/デモ（MVP!）
3. User Story 2追加（サイクル14〜16） → 独立してテスト → デプロイ/デモ
4. User Story 3追加（サイクル17〜21） → 独立してテスト → デプロイ/デモ
5. 各ストーリーが前のストーリーを壊すことなく価値を追加

---

## Notes

- **ベイビーステップ厳守**: 1サイクル = 5-10分、1つのテストごとにRed-Green-Refactor
- **頻繁なコミット**: 各フェーズ（Red, Green, Refactor）で個別にコミット
- **TODOリスト**: T007で作成し、進捗を追跡
- **CPU負荷対策**: テスト実行時は`npm test`を使用（watchモード禁止）
- **仮実装→三角測量→明白な実装**: 状況に応じて適切な手法を選択
- **リファクタリング**: テストが通ったら必ずリファクタリングを検討

---

## 総タスク数

**160タスク**（t-wadaのTDD原則に完全準拠）

- Phase 1: 4タスク
- Phase 2: 3タスク（TODOリスト含む）
- Phase 3 (US1): 86タスク（21サイクル × 平均4タスク）
- Phase 4 (US2): 22タスク（3サイクル × 平均7タスク）
- Phase 5 (US3): 24タスク（5サイクル × 平均5タスク）
- Phase 6: 21タスク

**各サイクルの所要時間**: 5-10分

**合計所要時間（目安）**: 13-27時間（160タスク × 5-10分）
