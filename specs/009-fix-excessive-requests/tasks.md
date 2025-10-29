# Implementation Tasks: フィード登録時のタイトル保存による過剰リクエスト削減

**Feature**: 009-fix-excessive-requests
**Branch**: `009-fix-excessive-requests`
**Date**: 2025-10-29

## Overview

このタスクリストは、TDD（テスト駆動開発）の原則に従い、Red-Green-Refactorサイクルで実装を進めます。各User Storyは独立してテスト可能で、段階的にデリバリーできます。

## Implementation Strategy

### MVP Scope (最小限の価値提供)

**MVP = User Story 1 (P1) のみ**
- フィード登録時にタイトルを取得してlocalStorageに保存
- リロード時はlocalStorageから読み込み、APIリクエスト0回
- データマイグレーション機能

これだけで過剰リクエストの根本原因が解決され、パフォーマンスが劇的に改善されます。

### Incremental Delivery

1. **MVP**: User Story 1 (P1) → 即座にリリース可能
2. **Phase 2**: User Story 2 (P2) → エラーハンドリング強化
3. **Phase 3**: User Story 3 (P3) → 追加の利便性機能

各フェーズは独立しており、前のフェーズの完成を待たずに並行開発も可能です。

## Task Count Summary

- **Total**: 45 tasks
- **Setup**: 2 tasks
- **Foundational**: 3 tasks
- **User Story 1 (P1)**: 18 tasks
- **User Story 2 (P2)**: 12 tasks
- **User Story 3 (P3)**: 7 tasks
- **Polish**: 3 tasks

## Dependencies

```text
Phase 1 (Setup)
  ↓
Phase 2 (Foundational)
  ↓
Phase 3 (User Story 1) ← MVP
  ↓
Phase 4 (User Story 2) ← 独立（US1完了後に開始可能）
  ↓
Phase 5 (User Story 3) ← 独立（US1完了後に開始可能）
  ↓
Phase 6 (Polish)
```

**Parallel Opportunities**:
- User Story 2とUser Story 3は、User Story 1完了後に並行開発可能

---

## Phase 1: Setup

### Goal
プロジェクト構造を確認し、テスト環境をセットアップ

### Tasks

- [ ] T001 テストディレクトリ構造を作成: frontend/tests/unit/, frontend/tests/integration/
- [ ] T002 MSW (Mock Service Worker) の設定を確認: frontend/src/test/setup.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

### Goal
すべてのUser Storiesで使用する基盤コードを実装

### Tasks

- [ ] T003 [P] Subscription型にtitleフィールドを追加: frontend/src/types/models.ts
- [ ] T004 [P] Subscription型のバリデーション関数をテスト: frontend/tests/unit/models.test.ts (Red)
- [ ] T005 [P] Subscription型のバリデーション関数を実装: frontend/src/types/models.ts (Green)

**Independent Test**: Subscription型の型チェックがパスし、titleフィールドが必須であることが確認できる

---

## Phase 3: User Story 1 - フィード登録時の即座のタイトル表示 (Priority: P1)

### Goal
フィード登録時にタイトルを取得してlocalStorageに保存し、リロード時はAPIリクエスト0回で即座に表示

### Independent Test Criteria
1. 新規フィードを登録後、localStorageにtitleフィールドが保存されていることを確認
2. アプリをリロード後、NetworkタブでAPIリクエストが0回であることを確認
3. 5個のフィードタイトルが100ミリ秒以内に表示されることを確認

### Tasks

#### Step 1: storage.ts (データ層)

**Red**: テストを先に書く

- [ ] T006 [US1] loadSubscriptions関数のテスト（空のlocalStorage）: frontend/tests/unit/storage.test.ts (Red)
- [ ] T007 [US1] loadSubscriptions関数のテスト（titleなしデータのマイグレーション）: frontend/tests/unit/storage.test.ts (Red)
- [ ] T008 [US1] loadSubscriptions関数のテスト（破損したJSONデータ）: frontend/tests/unit/storage.test.ts (Red)
- [ ] T009 [US1] saveSubscriptions関数のテスト（正常保存）: frontend/tests/unit/storage.test.ts (Red)
- [ ] T010 [US1] saveSubscriptions関数のテスト（QuotaExceededError）: frontend/tests/unit/storage.test.ts (Red)

**Green**: テストを通す最小限の実装

- [ ] T011 [US1] loadSubscriptions関数を実装: frontend/src/utils/storage.ts (Green)
- [ ] T012 [US1] saveSubscriptions関数を実装: frontend/src/utils/storage.ts (Green)

**Refactor**: コードの品質を向上

- [ ] T013 [US1] storage.tsのリファクタリング（重複排除、名前明確化）: frontend/src/utils/storage.ts (Refactor)

#### Step 2: useFeedAPI.ts (API層)

**Red**: テストを先に書く

- [ ] T014 [US1] fetchFeedTitle関数のテスト（成功）: frontend/tests/unit/useFeedAPI.test.ts (Red)
- [ ] T015 [US1] fetchFeedTitle関数のテスト（10秒タイムアウト）: frontend/tests/unit/useFeedAPI.test.ts (Red)
- [ ] T016 [US1] fetchFeedTitle関数のテスト（APIエラー）: frontend/tests/unit/useFeedAPI.test.ts (Red)

**Green**: テストを通す最小限の実装

- [ ] T017 [US1] fetchFeedTitle関数を実装（AbortControllerでタイムアウト）: frontend/src/hooks/useFeedAPI.ts (Green)

**Refactor**: コードの品質を向上

- [ ] T018 [US1] useFeedAPI.tsのリファクタリング: frontend/src/hooks/useFeedAPI.ts (Refactor)

#### Step 3: FeedContainer.tsx (UI層)

**Red**: テストを先に書く

- [ ] T019 [US1] フィード登録フローの統合テスト（成功時）: frontend/tests/integration/FeedContainer.test.tsx (Red)
- [ ] T020 [US1] フィード登録中のローディング表示テスト: frontend/tests/integration/FeedContainer.test.tsx (Red)
- [ ] T021 [US1] アプリリロード時のlocalStorage読み込みテスト: frontend/tests/integration/FeedContainer.test.tsx (Red)

**Green**: テストを通す最小限の実装

- [ ] T022 [US1] handleRegisterFeed関数を実装: frontend/src/containers/FeedContainer.tsx (Green)
- [ ] T023 [US1] isRegistering状態とローディングUI を実装: frontend/src/containers/FeedContainer.tsx (Green)

**Refactor**: コードの品質を向上

- [ ] T024 [US1] FeedContainer.txのリファクタリング: frontend/src/containers/FeedContainer.tsx (Refactor)

**✅ MVP Checkpoint**: ここまででMVPが完成。デプロイ可能。

---

## Phase 4: User Story 2 - タイトル取得失敗時のフォールバック表示 (Priority: P2)

### Goal
タイトル取得失敗時にfeedUrlをフォールバック値として使用し、エラーメッセージを表示

### Independent Test Criteria
1. 無効なURLでフィード登録時、エラーメッセージが表示されることを確認
2. フィードURLがタイトルとしてlocalStorageに保存されていることを確認
3. 後からカスタムタイトル編集機能でタイトルを変更できることを確認

### Tasks

#### Step 1: エラーハンドリング (データ層)

**Red**: テストを先に書く

- [ ] T025 [US2] fetchFeedTitle関数のテスト（ネットワークエラー時にfeedUrlを返す）: frontend/tests/unit/useFeedAPI.test.ts (Red)
- [ ] T026 [US2] fetchFeedTitle関数のテスト（404エラー時にfeedUrlを返す）: frontend/tests/unit/useFeedAPI.test.ts (Red)

**Green**: テストを通す最小限の実装

- [ ] T027 [US2] fetchFeedTitle関数のエラーハンドリング強化: frontend/src/hooks/useFeedAPI.ts (Green)

#### Step 2: UI層のエラー表示

**Red**: テストを先に書く

- [ ] T028 [US2] タイトル取得失敗時のエラーメッセージ表示テスト: frontend/tests/integration/FeedContainer.test.tsx (Red)
- [ ] T029 [US2] タイトル取得失敗時にfeedUrlがタイトルとして保存されるテスト: frontend/tests/integration/FeedContainer.test.tsx (Red)
- [ ] T030 [US2] タイトル取得タイムアウト時のフォールバックテスト: frontend/tests/integration/FeedContainer.test.tsx (Red)

**Green**: テストを通す最小限の実装

- [ ] T031 [US2] handleRegisterFeed関数のcatch句を実装（エラーメッセージ表示）: frontend/src/containers/FeedContainer.tsx (Green)
- [ ] T032 [US2] エラーメッセージコンポーネントを実装: frontend/src/components/ErrorMessage.tsx (Green)

**Refactor**: コードの品質を向上

- [ ] T033 [US2] エラーハンドリングロジックのリファクタリング: frontend/src/containers/FeedContainer.tsx (Refactor)

#### Step 3: 既存機能との統合確認

- [ ] T034 [US2] カスタムタイトル編集機能が正常動作することを統合テストで確認: frontend/tests/integration/FeedContainer.test.tsx
- [ ] T035 [US2] エラー状態のフィードも正しく表示されることを確認: frontend/tests/integration/FeedContainer.test.tsx
- [ ] T036 [US2] リグレッションテスト（既存の購読管理機能すべて）: frontend/tests/integration/FeedContainer.test.tsx

---

## Phase 5: User Story 3 - 手動タイトル更新機能 (Priority: P3)

### Goal
既存フィードの「タイトルを更新」ボタンで最新タイトルを取得

### Independent Test Criteria
1. 「タイトルを更新」ボタンをクリックし、NetworkタブでAPIリクエストが1回実行されることを確認
2. localStorageとUIのタイトルが更新されることを確認
3. 他のフィードには影響がないことを確認

### Tasks

**Red**: テストを先に書く

- [ ] T037 [US3] 手動タイトル更新ボタンのレンダリングテスト: frontend/tests/integration/FeedContainer.test.tsx (Red)
- [ ] T038 [US3] 手動タイトル更新ボタンクリック時のAPIリクエストテスト: frontend/tests/integration/FeedContainer.test.tsx (Red)
- [ ] T039 [US3] 手動タイトル更新後のlocalStorage更新テスト: frontend/tests/integration/FeedContainer.test.tsx (Red)
- [ ] T040 [US3] 手動タイトル更新時のローディング表示テスト: frontend/tests/integration/FeedContainer.test.tsx (Red)

**Green**: テストを通す最小限の実装

- [ ] T041 [US3] handleRefreshTitle関数を実装: frontend/src/containers/FeedContainer.tsx (Green)
- [ ] T042 [US3] 「タイトルを更新」ボタンUIを実装: frontend/src/containers/FeedContainer.tsx (Green)

**Refactor**: コードの品質を向上

- [ ] T043 [US3] FeedContainer.txのリファクタリング: frontend/src/containers/FeedContainer.tsx (Refactor)

---

## Phase 6: Polish & Cross-Cutting Concerns

### Goal
品質向上と最終調整

### Tasks

- [ ] T044 型チェックとリンターを実行し、すべてのwarningを解消: npm run type-check && npm run lint
- [ ] T045 カバレッジレポートを生成し、80%以上を確認: npm test -- --coverage
- [ ] T046 E2Eテスト（オプション）: 完全なユーザーシナリオをテスト

---

## Parallel Execution Examples

### User Story 1 (内部並行化)

```text
同時実行可能:
┌─────────────────────────────────────┐
│ T006-T010 (storage.ts のテスト)     │
│ T014-T016 (useFeedAPI.ts のテスト)  │
└─────────────────────────────────────┘
        ↓ (テスト完了後)
┌─────────────────────────────────────┐
│ T011-T012 (storage.ts の実装)       │
│ T017 (useFeedAPI.ts の実装)         │
└─────────────────────────────────────┘
        ↓
T019-T024 (FeedContainer.tsx)
```

### User Story 2 と User Story 3

User Story 1完了後、User Story 2とUser Story 3は並行開発可能:

```text
User Story 1 完了
  ↓
┌──────────────────┬──────────────────┐
│ User Story 2     │ User Story 3     │
│ (T025-T036)      │ (T037-T043)      │
└──────────────────┴──────────────────┘
```

---

## Testing Strategy

### Test Distribution (TDD原則に従う)

- **Unit Tests** (70%): 各関数・フックの単体テスト
  - storage.ts: loadSubscriptions, saveSubscriptions
  - useFeedAPI.ts: fetchFeedTitle
  - models.ts: Subscription型バリデーション

- **Integration Tests** (20%): コンポーネント統合テスト
  - FeedContainer.tsx: フィード登録フロー
  - Context + Hooks の連携
  - localStorage との統合

- **E2E Tests** (10%, オプション): エンドツーエンドテスト
  - フィード登録からタイトル表示までの完全なフロー
  - リロード後のデータ永続性確認

### Coverage Goals

- **新規コード**: 100%カバレッジ目標
- **プロジェクト全体**: 80%以上維持

---

## Commit Strategy

TDDサイクルに従ったコミット:

```bash
# Red（テスト追加）
git add frontend/tests/unit/storage.test.ts
git commit -m "test: storage.ts のマイグレーションテストを追加（Red）"

# Green（実装）
git add frontend/src/utils/storage.ts
git commit -m "feat: loadSubscriptions関数を実装（Green）"

# Refactor（改善）
git add frontend/src/utils/storage.ts
git commit -m "refactor: storage.tsの重複を排除（Refactor）"
```

---

## Success Metrics

### Phase 3 (User Story 1) 完了時

- ✅ 新規フィード登録時、APIリクエストが1回のみ実行される
- ✅ アプリリロード時、APIリクエストが0回実行される
- ✅ 10個のフィードタイトルが100ミリ秒以内に表示される
- ✅ カバレッジが80%以上

### Phase 4 (User Story 2) 完了時

- ✅ タイトル取得失敗時、適切なエラーメッセージが表示される
- ✅ フィードURLがフォールバック値として保存される
- ✅ カスタムタイトル編集機能が正常動作する

### Phase 5 (User Story 3) 完了時

- ✅ 手動タイトル更新ボタンが表示される
- ✅ ボタンクリック時、該当フィードのみAPIリクエストが実行される
- ✅ 他のフィードに影響がない

### Final (Polish) 完了時

- ✅ TypeScript型チェックがすべてパス
- ✅ ESLintの警告が0件
- ✅ カバレッジが80%以上
- ✅ すべてのテストがパス
- ✅ CI/CDパイプラインがグリーン

---

## Resources

- [Spec Document](./spec.md)
- [Implementation Plan](./plan.md)
- [Research](./research.md)
- [Data Model](./data-model.md)
- [API Contract](./contracts/api.md)
- [localStorage Contract](./contracts/localStorage.md)
- [Quickstart Guide](./quickstart.md)

---

## Notes

- 各タスクは5-10分で完了するサイズに分割されています
- テストファーストを厳守：実装前に必ずテストを書く
- Red-Green-Refactorサイクルを守る
- 頻繁にコミット：各フェーズでコミット可能
- 不安な場合は「仮実装」から始める
- つまずいたら小さく戻る