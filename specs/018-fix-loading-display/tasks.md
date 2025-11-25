# Tasks: 記事表示時のローディング表示抑制

**Feature**: 018-fix-loading-display
**Input**: Design documents from `/specs/018-fix-loading-display/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: ✅ **TDD必須** - [Constitution（憲法）](../../.specify/memory/constitution.md)によりTest-Driven Developmentが絶対遵守

**Organization**: 両ユーザーストーリー（P1）は同一の条件分岐変更で解決されるため、1つのPhaseで実装。

---

## 🎯 t-wada式TDD原則（必読）

このタスクリストは**t-wada式Test-Driven Development**に完全準拠します。

### Red-Green-Refactorサイクル（絶対遵守）

1. **🔴 Red（失敗するテストを書く）** - テストが仕様
2. **✅ Green（テストを通す）** - 最小限の実装
3. **♻️ Refactor（リファクタリング）** - 品質向上

### ベイビーステップ

- **5-10分で完了するサイクル**を回す
- **頻繁なコミット**: Red→Green→Refactor の各フェーズでコミット

---

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup ✅

**Purpose**: 作業ブランチの確認と既存コードの理解

- [x] T001 ブランチ `018-fix-loading-display` にいることを確認
- [x] T002 既存のテストが全てパスすることを確認 `cd frontend && npm test`
- [x] T003 `frontend/src/containers/ArticleContainer.tsx` の現在の実装を確認（34-36行目）

**Checkpoint**: 開発環境準備完了 ✅

---

## Phase 2: User Story 1 & 2 - ローディング表示の条件分岐修正 (Priority: P1) 🎯 MVP ✅

**Goal**: 記事が0件の場合のみローディング表示、1件以上ある場合は記事一覧を継続表示

**User Story 1**: 記事閲覧中のポーリング継続表示
**User Story 2**: 初回読み込み時のローディング表示

**Independent Test**:
- 記事N件 + isLoading=true → 記事一覧が表示される
- 記事0件 + isLoading=true → ローディングアイコンが表示される

**TDD Strategy**: Red-Green-Refactor サイクルを厳守（Constitution要件）

---

### 🔴 Red Phase: Tests（失敗するテストを先に書く） ✅

> **テストが仕様**: これらのテストコードが要求仕様の実行可能なドキュメントとなる

**CRITICAL**: これらのテストは実装前に書き、失敗することを確認する

- [x] T004 [P] [US1] 記事がある場合ローディング中でも記事一覧を表示するテストを追加 in `frontend/src/containers/ArticleContainer.test.tsx`（Red - アサーション失敗を期待）
- [x] T005 [P] [US2] 記事が0件でローディング中の場合ローディングアイコンを表示するテストを追加 in `frontend/src/containers/ArticleContainer.test.tsx`（Red - 既存動作確認）
- [x] T006 [P] [US1] 手動更新時も記事があれば記事一覧を表示し続けるテストを追加 in `frontend/src/containers/ArticleContainer.test.tsx`（Red - アサーション失敗を期待）
- [x] T007 テストを実行し、T004とT006が失敗することを確認 `cd frontend && npm test ArticleContainer.test.tsx`

**Checkpoint**: 新規テストが期待通り失敗することを確認（Red完了） ✅

- ✅ T004, T006がアサーション失敗（現在の実装では記事があってもローディング表示される）
- ✅ T005は既存動作確認のため合格してもOK

---

### ✅ Green Phase: Implementation（最小限の実装でテストを通す） ✅

> **品質は問わない、まず動かす**: 最小限のコードでテストを通す

**今回の推奨手法**: **明白な実装（Obvious Implementation）** - 条件分岐の変更はシンプルで自信がある

- [x] T008 [US1] [US2] `ArticleContainer.tsx` の34-36行目のローディング表示条件を変更 in `frontend/src/containers/ArticleContainer.tsx`
  - 修正前: `if (state.isLoading)`
  - 修正後: `if (state.isLoading && state.articles.length === 0)`
- [x] T009 テストを実行し、全テストが合格することを確認 `cd frontend && npm test ArticleContainer.test.tsx`
- [x] T010 全テストを実行し、既存テスト含め全て合格することを確認 `cd frontend && npm test`

**Checkpoint**: 全テストが合格（Green完了） ✅

- ✅ 新規テスト（T004, T005, T006）が全て合格
- ✅ 既存テストも全て合格

---

### ♻️ Refactor Phase: Code Quality Improvement（コード品質向上） ✅

> **テストを通したまま、コードの品質を向上させる**

- [x] T011 [P] コードレビュー - コメント追加の必要性を確認
- [x] T012 必要に応じてコメント追加（例: `// 記事がない場合のみローディング表示`）
- [x] T013 全テストを実行し、リファクタリング後も全て合格することを確認 `cd frontend && npm test`

**Checkpoint**: Refactor完了 - コア機能実装完了 ✅

---

## Phase 3: Polish & Documentation ✅

**Purpose**: 品質確認とドキュメント更新

- [x] T014 型チェックを実行 `cd frontend && npx tsc --noEmit`
- [x] T015 リントを実行 `cd frontend && npm run lint`（変更ファイルにエラーなし）
- [x] T016 手動テスト: フィードを購読して記事表示後、ポーリング/手動更新で記事が継続表示されることを確認
- [x] T017 SPECIFICATION.md の更新が必要か確認（内部実装の最適化のため不要と判断）

**Checkpoint**: 機能実装完了、PRの準備完了 ✅

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - 即座に開始可能
- **Phase 2 (Implementation)**: Phase 1完了後に開始
- **Phase 3 (Polish)**: Phase 2完了後に開始

### User Story Dependencies

- **User Story 1 & 2**: 同一の変更で両方解決されるため、依存関係なし

### Parallel Opportunities

- T004, T005, T006（Red Phase）は並列実行可能
- T011（Refactor Phase）は並列実行可能

---

## Implementation Strategy

### MVP First

1. Phase 1: Setup完了
2. Phase 2: Red → Green → Refactor 完了
3. **STOP and VALIDATE**: 手動テストで動作確認
4. Phase 3: Polish完了
5. PR作成

### Estimated Time

- Phase 1: 5分
- Phase 2: 20分（Red: 10分、Green: 5分、Refactor: 5分）
- Phase 3: 10分
- **合計: 約35分**

---

## Notes

### TDD実践のポイント

- **TDD必須**: Red-Green-Refactorサイクルを絶対遵守
- **ベイビーステップ**: 各タスクは5-10分で完了可能なサイズ
- **watchモード禁止**: `npm test`（1回限り実行）を使用

### コミット戦略

```bash
# Red Phase
git add frontend/src/containers/ArticleContainer.test.tsx
git commit -m "test(article): [US1][US2] ローディング表示条件のテストを追加（Red）"

# Green Phase
git add frontend/src/containers/ArticleContainer.tsx
git commit -m "fix(article): [US1][US2] 記事がある場合はローディング非表示（Green）"

# Refactor Phase（必要な場合）
git add frontend/src/containers/ArticleContainer.tsx
git commit -m "refactor(article): コメント追加（Refactor）"
```

### 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `frontend/src/containers/ArticleContainer.tsx` | 条件分岐修正（1行） |
| `frontend/src/containers/ArticleContainer.test.tsx` | テストケース追加（3件） |
