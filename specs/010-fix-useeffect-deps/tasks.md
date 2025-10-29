# Tasks: FeedContainerのuseEffect依存配列修正

**Input**: Design documents from `/specs/010-fix-useeffect-deps/`
**Prerequisites**: plan.md, spec.md

**Tests**: この機能はTDD（テスト駆動開発）で実装します。憲法の要求に従い、Red-Green-Refactorサイクルを遵守します。

**Organization**: タスクはユーザーストーリーごとにグループ化され、各ストーリーを独立して実装・テスト可能にします。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: このタスクが属するユーザーストーリー（例: US1, US2）
- 説明には正確なファイルパスを含む

## Path Conventions

このプロジェクトはWebアプリケーション構造を使用します：
- **Frontend**: `frontend/src/`, `frontend/tests/`

---

## Phase 1: Setup

**目的**: このバグ修正のための準備作業

- [x] T001 現在のブランチ（010-fix-useeffect-deps）が最新のmainからチェックアウトされていることを確認
- [x] T002 frontend依存関係がインストールされていることを確認（npm install）
- [x] T003 [P] 既存のテストスイートが成功することを確認（npm test）
- [x] T004 TODOリストを作成：実装するテストケースと機能を小さなタスクにリスト化（t-wada式TDDの「TODOリスト」原則）

**チェックポイント**: 環境準備完了 - User Story実装を開始可能

---

## Phase 2: User Story 1 - ページ読み込み時の過剰リクエスト防止 (Priority: P1) 🎯 MVP

**ゴール**: FeedContainerのuseEffect依存配列を修正し、タイトル更新時の不要なフィード再フェッチを防止する

**独立テスト**: 開発者ツールのNetworkタブを開いた状態で、RSSフィードを3件登録済みのアプリケーションをリロードし、フィード取得APIリクエストが正確に1回のみ実行されることを確認

### Tests for User Story 1 (Red フェーズ) 🔴

> **重要: これらのテストを最初に書き、実装前に失敗することを確認してください**
>
> **ベイビーステップ**: 各タスクは5-10分で完了することを目指す（t-wada式TDD原則）

- [x] T005 [US1] タイトル更新時にフィード取得が0回実行されることを検証するテストケースを frontend/tests/integration/feedFlow.test.tsx に追加（小さく書く）
- [x] T006 [US1] テストを実行し、正しく失敗することを確認（Red フェーズの検証）
- [x] T007 [US1] Redフェーズのコミット: `test(US1): タイトル更新時のフィード非フェッチテストを追加`

### Implementation for User Story 1 (Green フェーズ) 🟢

> **明白な実装を使用**: この修正はシンプルなので、直接実装します（つまずいたら仮実装に戻る）

- [x] T008 [US1] frontend/src/containers/FeedContainer.tsx の37行目の依存配列から `subState.subscriptions` を削除（1行の変更のみ）
- [x] T009 [US1] 新規追加したテスト（T005）が成功することを確認
- [x] T010 [US1] 既存のすべてのテストが成功することを確認（リグレッションチェック）
- [x] T011 [US1] Greenフェーズのコミット: `feat(US1): useEffect依存配列からsubState.subscriptionsを削除`

### Refactor for User Story 1 (Refactor フェーズ) ♻️

> **テストを通したまま品質向上**: 重複排除、意図の明確化

- [x] T012 [US1] コメントを更新し、意図を明確化（必要に応じて）
- [x] T013 [US1] テストコードのリファクタリング（必要に応じて）
- [x] T014 [US1] ESLint警告がないことを確認（npm run lint）
- [x] T015 [US1] TypeScript型チェックが成功することを確認（npm run type-check）
- [x] T016 [US1] Refactorフェーズのコミット: `refactor(US1): コメントを更新し意図を明確化`

**チェックポイント**: この時点で、User Story 1は完全に機能し、独立してテスト可能です

---

## Phase 3: User Story 2 - 手動更新機能の正常動作 (Priority: P2)

**ゴール**: useEffect修正後も既存の手動更新機能が正しく動作することを確認

**独立テスト**: フィードが表示されている状態で「更新」ボタンをクリックし、Networkタブでフィード取得APIリクエストが1回実行され、記事が更新されることを確認

### Tests for User Story 2 🔴

> **既存テストの確認と拡張**: 既存のrefreshFlow.test.tsxを確認し、必要に応じて拡張

- [x] T017 [US2] 既存の手動更新テストを確認し、フィード取得が1回のみ実行されることを検証するアサーションを追加 in frontend/tests/integration/refreshFlow.test.tsx
- [x] T018 [US2] テストを実行し、すべて成功することを確認（既存機能が壊れていないことの検証）
- [x] T019 [US2] テストコミット: `test(US2): 手動更新機能のフィード取得回数検証を追加`

### Verification for User Story 2 ✅

> **検証のみ**: 実装変更は不要（User Story 1の修正が手動更新に悪影響を与えていないことを確認）

- [x] T020 [US2] 手動更新機能（handleRefresh）が正しく動作することを手動確認
- [x] T021 [US2] 更新中のUI状態（ローディングインジケーター、ボタン無効化）が正しく動作することを手動確認
- [x] T022 [US2] すべてのテストが成功することを確認

**チェックポイント**: この時点で、User Story 1とUser Story 2の両方が独立して動作します

---

## Phase 4: エッジケースとリグレッションテスト

**目的**: エッジケースのカバレッジとリグレッション防止

### Tests for Edge Cases 🔴

> **並列実行可能**: 各テストは異なるシナリオをカバーするため、並列で追加可能

- [x] T023 [P] フィードが0件の状態でページをリロードした場合、不要なAPIリクエストが発生しないことを検証するテストを frontend/tests/integration/feedFlow.test.tsx に追加
- [x] T024 [P] フィード削除時に削除されたフィードへのリクエストが発生しないことを検証するテストを frontend/tests/integration/feedFlow.test.tsx に追加
- [x] T025 [P] カスタムタイトル編集時に不要な再フェッチが発生しないことを検証するテストを frontend/tests/integration/feedTitleFlow.test.tsx で確認または追加

### Verification for Edge Cases ✅

- [x] T026 すべてのエッジケーステストが成功することを確認
- [x] T027 既存のすべての統合テストが成功することを確認（完全なリグレッションチェック）
- [x] T028 エッジケーステストのコミット: `test(edge): エッジケースの検証テストを追加`

**チェックポイント**: すべてのユーザーストーリーとエッジケースが独立して機能します

---

## Phase 5: Polish & 品質保証

**目的**: 複数のユーザーストーリーに影響する改善とテスト品質の検証

### Test Quality Verification (t-wada式TDD品質基準)

> **テストの品質基準を確認**: 高速、独立、反復可能、自己検証、適時

- [x] T029 [P] テストが高速に実行されることを確認（全テストが数秒以内に完了）
- [x] T030 [P] テストが独立していることを確認（実行順序に依存しない）
- [x] T031 [P] テストが反復可能であることを確認（何度実行しても同じ結果）
- [x] T032 [P] テストが自己検証可能であることを確認（成功/失敗が自動判定）

### Coverage & Performance

- [x] T033 [P] テストカバレッジを確認し、修正部分が100%カバーされていることを検証（憲法: 変更部分は100%カバー）
- [x] T034 [P] パフォーマンステストを実行し、SC-001（1回のみのAPIリクエスト）が達成されていることを手動確認

### Documentation & Quality Gates

- [x] T035 コードレビュー用にコミット履歴を確認（Red → Green → Refactor のサイクルが明確か）
- [x] T036 SPECIFICATION.mdを更新し、この修正を反映（CLAUDE.mdの指示に従う）
- [x] T037 すべてのQuality Gates（憲法のマージ前の必須条件）をパス確認：
  - [x] すべてのテストがパス
  - [x] カバレッジが基準（80%）以上
  - [x] TypeScript の型チェックがパス
  - [x] ESLint の警告ゼロ
- [x] T038 最終コミット: `docs: SPECIFICATION.mdを更新`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存関係なし - すぐに開始可能
- **User Story 1 (Phase 2)**: Setup完了後に開始
- **User Story 2 (Phase 3)**: User Story 1完了後に開始（依存配列修正の影響を検証するため）
- **Edge Cases (Phase 4)**: User Story 1, 2完了後に開始
- **Polish (Phase 5)**: すべてのユーザーストーリー完了後に開始

### User Story Dependencies

- **User Story 1 (P1)**: Setup完了後に開始可能 - 他のストーリーへの依存なし
- **User Story 2 (P2)**: User Story 1完了後に開始（修正の影響を確認するため） - 独立してテスト可能
- **Edge Cases (Phase 4)**: User Story 1, 2完了後 - 独立してテスト可能

### Within Each User Story

TDD（Red-Green-Refactor）サイクルを遵守：

1. **Red**: テストを書き、失敗することを確認
2. **Green**: 最小限の実装でテストを通す
3. **Refactor**: コードの品質を向上

### Parallel Opportunities

このバグ修正は主に1ファイルの修正のため、並列実行の機会は限定的です：

- **Phase 1**: T003（既存テスト実行）は独立して実行可能
- **Phase 4**: エッジケーステスト（T023, T024, T025）は並列で追加可能
- **Phase 5**: テスト品質検証（T029, T030, T031, T032）とカバレッジ/パフォーマンス（T033, T034）は並列実行可能

---

## Parallel Example: Edge Cases (Phase 4)

```bash
# Phase 4のエッジケーステストを並列で追加:
Task: "フィード0件時のテストを frontend/tests/integration/feedFlow.test.tsx に追加" (T023)
Task: "フィード削除時のテストを frontend/tests/integration/feedFlow.test.tsx に追加" (T024)
Task: "カスタムタイトル編集時のテストを frontend/tests/integration/feedTitleFlow.test.tsx で確認" (T025)
```

## Parallel Example: Test Quality Verification (Phase 5)

```bash
# Phase 5のテスト品質検証を並列で実行:
Task: "テストが高速に実行されることを確認" (T029)
Task: "テストが独立していることを確認" (T030)
Task: "テストが反復可能であることを確認" (T031)
Task: "テストが自己検証可能であることを確認" (T032)
Task: "テストカバレッジを確認" (T033)
Task: "パフォーマンステストを実行" (T034)
```

---

## Implementation Strategy

### t-wada式TDD（テスト駆動開発）による実装

**TODOリスト駆動**: T004でTODOリストを作成し、1つずつ消化

**ベイビーステップ**: 各タスクは5-10分で完了することを目指す

1. **Phase 1完了**: Setup + TODOリスト作成（T001-T004）
2. **User Story 1（MVP）**:
   - **Red**: テストを書き、失敗を確認 → コミット（T005-T007）
   - **Green**: 明白な実装でテストを通す → コミット（T008-T011）
   - **Refactor**: 品質向上 → コミット（T012-T016）
3. **User Story 2**:
   - 既存機能の検証とテスト拡張（T017-T022）
4. **Edge Cases**:
   - エッジケースのテスト追加と検証（T023-T028）
5. **Polish**:
   - テスト品質検証、カバレッジ、文書更新（T029-T038）

### MVP First (User Story 1 Only)

1. Phase 1完了: Setup
2. Phase 2完了: User Story 1（TDDサイクル）
3. **停止して検証**: User Story 1を独立してテスト
4. 成功であれば次のストーリーへ進む

### Incremental Delivery

1. Setup完了 → 環境準備完了
2. User Story 1追加 → 独立してテスト → コミット（MVP！）
3. User Story 2追加 → 独立してテスト → コミット
4. Edge Cases追加 → 独立してテスト → コミット
5. Polish → 品質保証 → PR作成

---

## Commit Strategy (t-wada式TDD履歴の保持)

**憲法の要求**: 「頻繁なコミット - Red→Green→Refactor の各フェーズでコミット可能」

**実際のコミット履歴**（各フェーズでコミット）:

```text
# Phase 2: User Story 1 (MVP)
test(US1): タイトル更新時のフィード非フェッチテストを追加 (Red - T007)
feat(US1): useEffect依存配列からsubState.subscriptionsを削除 (Green - T011)
refactor(US1): コメントを更新し意図を明確化 (Refactor - T016)

# Phase 3: User Story 2
test(US2): 手動更新機能のフィード取得回数検証を追加 (T019)

# Phase 4: Edge Cases
test(edge): エッジケースの検証テストを追加 (T028)

# Phase 5: Polish
docs: SPECIFICATION.mdを更新 (T038)
```

**コミットのタイミング**:

- Red完了時: テストを追加し、失敗を確認した後
- Green完了時: 実装を追加し、テストが成功した後
- Refactor完了時: リファクタリングを完了し、テストが通ることを確認した後

**5-10分サイクル**: 各コミットは5-10分のベイビーステップで行う（t-wada式TDD原則）

---

## Notes

### Task Format

- **[P] タスク**: 異なるファイル、依存関係なし - 並列実行可能
- **[Story] ラベル**: 特定のユーザーストーリーへのトレーサビリティ（US1, US2など）
- 各ユーザーストーリーは独立して完了・テスト可能である必要があります

### t-wada式TDD原則の遵守

1. **テストファースト**: 1行のプロダクションコードも、失敗するテストなしには書かない
2. **Red-Green-Refactorサイクル**: 各フェーズで明確にコミット
3. **ベイビーステップ**: 5-10分で完了するサイクルを回す
4. **TODOリスト**: 次にやることをリスト化し、1つずつ消化（T004で作成）
5. **3つの手法**:
   - **明白な実装**: この修正で使用（シンプルな1行修正）
   - **仮実装**: つまずいたら使用
   - **三角測量**: 複数のテストケースから一般化が必要な場合に使用
6. **頻繁なコミット**: Red→Green→Refactor の各フェーズでコミット
7. **テストの品質**: 高速、独立、反復可能、自己検証、適時（Phase 5で確認）

### Execution Guidelines

- **TDD原則**: テストが失敗することを確認してから実装を開始
- 各タスクまたは論理的なグループごとにコミット
- 任意のチェックポイントで停止し、ストーリーを独立して検証
- 避けるべきこと: 曖昧なタスク、同一ファイルでの競合、ストーリーの独立性を損なう依存関係

---

## Success Metrics

この実装が成功したと判断する基準（spec.mdのSuccess Criteriaから）:

- **SC-001**: 3件のフィード登録時、ページリロードでAPIリクエストが1回のみ実行
- **SC-002**: タイトル更新時、APIリクエストが0回実行
- **SC-003**: 「更新」ボタンクリック時、APIリクエストが1回実行
- **SC-004**: フィード追加時、APIリクエストが1回実行
- **SC-005**: 既存のすべての自動テストが成功（リグレッションなし）

すべてのSuccess Criteriaは自動テストまたは手動検証で確認されます。