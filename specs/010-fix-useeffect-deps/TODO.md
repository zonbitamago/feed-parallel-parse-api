# TODO List: FeedContainerのuseEffect依存配列修正

**作成日**: 2025-10-29
**t-wada式TDD原則**: 次にやることをリスト化し、1つずつ消化

## Phase 2: User Story 1 (MVP) - Red🔴 → Green🟢 → Refactor♻️

### Red フェーズ（テストファースト）
- [ ] タイトル更新時にフィード取得が0回実行されることを検証するテストを書く
  - ファイル: `frontend/tests/integration/feedFlow.test.tsx`
  - テストケース: 「タイトル更新時にフィード取得が発生しない」
  - 期待する動作: UPDATE_SUBSCRIPTIONアクション後、fetchFeedsが呼ばれない
- [ ] テストを実行し、失敗することを確認（Red）
- [ ] Redフェーズをコミット

### Green フェーズ（最小限の実装）
- [ ] `frontend/src/containers/FeedContainer.tsx` の37行目を修正
  - 変更: 依存配列から `subState.subscriptions` を削除
  - 修正後: `[subState.subscriptions.length, fetchFeeds]`
- [ ] 新規テストが成功することを確認
- [ ] 既存のすべてのテストが成功することを確認
- [ ] Greenフェーズをコミット

### Refactor フェーズ（品質向上）
- [ ] コメントを確認し、必要に応じて更新
- [ ] テストコードを確認し、必要に応じてリファクタリング
- [ ] ESLint警告を確認
- [ ] TypeScript型チェックを確認
- [ ] Refactorフェーズをコミット

## Phase 3: User Story 2 - 手動更新機能の検証

- [ ] refreshFlow.test.tsxで手動更新のフィード取得回数を検証
- [ ] すべてのテストが成功することを確認

## Phase 4: エッジケース

- [ ] フィード0件時のテストを追加
- [ ] フィード削除時のテストを追加
- [ ] カスタムタイトル編集時のテストを確認

## Phase 5: Polish & 品質保証

- [ ] テスト品質基準を確認（高速、独立、反復可能、自己検証）
- [ ] テストカバレッジを確認（変更部分100%）
- [ ] SPECIFICATION.mdを更新
- [ ] Quality Gatesをすべてパス確認

---

## ベイビーステップの原則

各タスクは **5-10分** で完了することを目指します。
つまずいたら、さらに小さなステップに分割します。

## 現在の作業

👉 **次のタスク**: Phase 2 Red フェーズ - テストを書く
