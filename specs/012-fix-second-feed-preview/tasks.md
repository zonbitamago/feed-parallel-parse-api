---

description: "Task list for 2件目フィード購読時のプレビュー表示バグ修正"
---

# Tasks: 2件目フィード購読時のプレビュー表示バグ修正

**Input**: Design documents from `/specs/012-fix-second-feed-preview/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: このバグ修正では既存テストを活用します。新しいテストは作成しません。

**Organization**: このバグ修正は1つのユーザーストーリー（US1）のみで構成されます。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/`, `frontend/tests/`
- このバグ修正はfrontendのみに影響します

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: プロジェクトの現状確認と既存テストの検証

- [x] T001 既存のテストスイートを実行し、現在のテスト状態を確認（`npm test`）
- [x] T002 [P] TypeScript型チェックを実行し、型エラーがないことを確認（`npx tsc --noEmit`）
- [x] T003 [P] ESLintを実行し、リンターエラーがないことを確認（`npx eslint frontend/src`）

**Checkpoint**: 既存のプロジェクトが正常な状態であることを確認

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: このバグ修正では、Foundationalフェーズのタスクはありません。

**理由**: 既存のコードベースに変更を加えるのみで、新しいインフラや共通コンポーネントは不要です。

**⚠️ CRITICAL**: Phase 1完了後、すぐにUser Story 1の実装に進めます。

---

## Phase 3: User Story 1 - 2件目以降のフィード追加時のプレビュー表示 (Priority: P1) 🎯 MVP

**Goal**: 2件目以降のRSSフィード購読時にプレビュー（タイトルフェッチ）が表示されるようにする

**Independent Test**: 1件目のフィードを追加した後、2件目のフィードURLを入力し、プレビュー（フィードタイトル）が表示されることを確認する。ブラウザの開発者ツールで`/api/feed/parse`へのリクエストが送信されていることを検証する。

### Implementation for User Story 1

- [x] T004 [US1] `frontend/src/components/FeedManager/FeedManager.tsx`の121行目を読み、現在のuseEffect依存配列を確認
- [x] T005 [US1] `frontend/src/components/FeedManager/FeedManager.tsx`の121行目のuseEffect依存配列から`onClearError`を削除（`}, [url, fetchPreview, clearPreview])`に変更）
- [x] T006 [US1] 修正後、TypeScript型チェックを実行し、型エラーがないことを確認（`npx tsc --noEmit`）
- [x] T007 [US1] 修正後、ESLintを実行し、`react-hooks/exhaustive-deps`ルール違反がないことを確認（`npx eslint frontend/src/components/FeedManager/FeedManager.tsx`）
- [x] T008 [US1] 既存のテストスイートを実行し、全てのテストが合格することを確認（`npm test`）
- [x] T009 [US1] フロントエンドのビルドが成功することを確認（`cd frontend && npm run build`）

**Checkpoint**: この時点で、User Story 1は完全に機能し、テスト可能な状態になっています

---

## Phase 4: Manual Testing & Validation

**Purpose**: 手動テストでバグ修正を検証

- [ ] T010 開発サーバーを起動し、1件目のRSSフィードを追加してプレビューが表示されることを確認（手動テスト：ユーザー実行推奨）
- [ ] T011 2件目のRSSフィードURLを入力し、プレビュー（フィードタイトル）が表示されることを確認（手動テスト：ユーザー実行推奨）
- [ ] T012 ブラウザの開発者ツール（Networkタブ）で`/api/feed/parse`へのリクエストが送信されていることを確認（手動テスト：ユーザー実行推奨）
- [ ] T013 [P] 無効なURLを入力してエラーメッセージが表示されることを確認（既存機能の動作確認）（手動テスト：ユーザー実行推奨）
- [ ] T014 [P] 3件目、4件目のフィードを連続して追加し、毎回プレビューが表示されることを確認（エッジケースの検証）（手動テスト：ユーザー実行推奨）

**Checkpoint**: 手動テストで全てのシナリオが正常に動作することを確認

---

## Phase 5: Polish & Documentation

**Purpose**: ドキュメント更新とクリーンアップ

- [x] T015 [P] SPECIFICATION.mdを確認し、このバグ修正に関連する記述があれば更新（SPECIFICATION.mdが存在しないため、スキップ）
- [x] T016 [P] README.mdの更新が必要か判断フローで確認（このバグ修正では不要：内部バグ修正のみ）
- [x] T017 コミットメッセージを作成し、変更内容を明確に記述（`fix(FeedManager): 2件目以降のフィード追加時にプレビューが表示されないバグを修正`）

**Checkpoint**: ドキュメントとコミットが整備され、PR作成準備完了

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Skipped - no foundational tasks needed
- **User Story 1 (Phase 3)**: Depends on Setup (Phase 1) completion
- **Manual Testing (Phase 4)**: Depends on User Story 1 (Phase 3) completion
- **Polish (Phase 5)**: Depends on Manual Testing (Phase 4) completion

### User Story Dependencies

- **User Story 1 (P1)**: このバグ修正には1つのユーザーストーリーのみ - 他のストーリーへの依存なし

### Within User Story 1

- T004（現状確認） → T005（修正） → T006-T009（検証）の順で実行
- T006, T007はT005完了後に並列実行可能
- T008, T009はT006, T007完了後に並列実行可能

### Parallel Opportunities

- **Phase 1**: T002とT003は並列実行可能（異なるツールを実行）
- **Phase 3**: T006とT007は並列実行可能（異なるツールを実行）
- **Phase 3**: T008とT009は並列実行可能（異なるコマンド）
- **Phase 4**: T013とT014は並列実行可能（異なるテストシナリオ）
- **Phase 5**: T015とT016は並列実行可能（異なるドキュメント）

---

## Parallel Example: User Story 1

```bash
# Phase 1: 初期検証（並列実行）
Task: "TypeScript型チェックを実行（npx tsc --noEmit）"
Task: "ESLintを実行（npx eslint frontend/src）"

# Phase 3: 修正後の検証（並列実行）
Task: "TypeScript型チェックを実行（npx tsc --noEmit）"
Task: "ESLintを実行（npx eslint frontend/src/components/FeedManager/FeedManager.tsx）"

# Phase 3: テストとビルド（並列実行）
Task: "既存テストスイートを実行（npm test）"
Task: "フロントエンドビルドを実行（cd frontend && npm run build）"

# Phase 4: 手動テスト（並列実行）
Task: "無効なURL入力のエラーメッセージ確認"
Task: "3件目、4件目の連続追加確認"

# Phase 5: ドキュメント更新（並列実行）
Task: "SPECIFICATION.md確認"
Task: "README.md判断フロー確認"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup（既存プロジェクトの状態確認）
2. Skip Phase 2: Foundational（不要）
3. Complete Phase 3: User Story 1（バグ修正実装）
4. **STOP and VALIDATE**: Phase 4で手動テスト実行
5. Complete Phase 5: ドキュメント整備とコミット準備

### Incremental Delivery

このバグ修正は1つのユーザーストーリーのみで完結するため、インクリメンタルデリバリーは適用されません。Phase 1 → Phase 3 → Phase 4 → Phase 5の順で一気通貫で実行します。

### Solo Developer Strategy

1人の開発者での作業想定（推奨手順）：

1. **Phase 1（5分）**: 既存テストとリンターを実行し、現状を確認
2. **Phase 3（10分）**: 1行の修正を実施し、検証ツールを実行
3. **Phase 4（10分）**: ブラウザで手動テスト実行
4. **Phase 5（5分）**: ドキュメント確認とコミット準備
5. **Total: 約30分**でバグ修正完了

---

## Notes

- [P] tasks = 並列実行可能（異なるツール、異なるファイル）
- [US1] label = User Story 1に属するタスク
- このバグ修正は1ファイル1行の変更のみで、影響範囲が非常に小さい
- 既存テストが全て合格することで、バグ修正の正当性を確認
- 新しいテストは作成しない（既存テストで十分カバーされている）
- コミット前に必ず手動テストを実行し、2件目のプレビューが表示されることを確認
- TypeScript型チェックとESLintは必須（Constitution遵守）

---

## Validation Checklist

修正完了前に以下を確認：

- [ ] `frontend/src/components/FeedManager/FeedManager.tsx`の121行目が`}, [url, fetchPreview, clearPreview])`になっている
- [ ] TypeScript型チェックがパス（`npx tsc --noEmit`）
- [ ] ESLintがパス（`npx eslint frontend/src`）
- [ ] 全てのテストがパス（`npm test`）
- [ ] フロントエンドビルドが成功（`cd frontend && npm run build`）
- [ ] 手動テストで2件目のプレビューが表示される
- [ ] ブラウザの開発者ツールで`/api/feed/parse`リクエストが確認できる
- [ ] 1件目のフィード追加の動作が変更されていない
- [ ] コミットメッセージが明確で、変更内容を正確に説明している

---

## Summary

- **Total Tasks**: 17タスク
- **User Stories**: 1つ（US1のみ）
- **Parallel Opportunities**: 8タスクが並列実行可能
- **Estimated Time**: 約30分（1人の開発者）
- **Risk Level**: 低（1行の変更、既存テストでカバー済み）
- **MVP Scope**: User Story 1のみ（このバグ修正全体）

このタスクリストは即座に実行可能です。各タスクは具体的なファイルパスとコマンドを含んでおり、LLMが追加のコンテキストなしで完了できます。
