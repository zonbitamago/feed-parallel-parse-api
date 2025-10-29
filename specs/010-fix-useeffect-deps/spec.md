# Feature Specification: FeedContainerのuseEffect依存配列修正

**Feature Branch**: `010-fix-useeffect-deps`
**Created**: 2025-10-29
**Status**: Draft
**Input**: User description: "FeedContainerのuseEffect依存配列を修正してタイトル更新時の不要な再フェッチを防止"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - ページ読み込み時の過剰リクエスト防止 (Priority: P1)

ユーザーが登録済みのRSSフィードがある状態でTOPページを開いたとき、フィード取得のAPIリクエストが1回のみ実行され、タイトル更新による不要な再フェッチが発生しない。

**Why this priority**: これが最も重要な修正です。現在、FeedContainer.tsxの32-37行目のuseEffectで`subState.subscriptions`オブジェクト自体を依存配列に含めているため、タイトル更新（UPDATE_SUBSCRIPTIONアクション）が発生するたびに再フェッチが実行されてしまいます。コメントには「titleの更新では再取得しない」と書かれているのに、実装が意図と異なっています。この修正により、購読の追加・削除時のみフィードを取得するという本来の動作になります。

**Independent Test**: 開発者ツールのNetworkタブを開いた状態で、RSSフィードを3件登録済みのアプリケーションをリロードし、フィード取得APIリクエストが正確に1回のみ実行されることで独立してテスト可能。

**Acceptance Scenarios**:

1. **Given** 3件のRSSフィードが登録されている状態、**When** TOPページをリロード、**Then** フィード取得APIリクエストが1回のみ実行され、すべてのフィードの記事が正しく表示される
2. **Given** フィードが表示されている状態、**When** フィードのタイトルが更新される（UPDATE_SUBSCRIPTIONアクション）、**Then** フィード取得APIリクエストは実行されず、記事表示に影響がない
3. **Given** フィードが表示されている状態、**When** 新しいフィードを1件追加、**Then** フィード取得APIリクエストが1回実行され、新しいフィードの記事も含めてすべての記事が表示される

---

### User Story 2 - 手動更新機能の正常動作 (Priority: P2)

ユーザーが「更新」ボタンをクリックしたとき、登録されているすべてのフィードに対してAPIリクエストが1回実行され、最新の記事が取得される。

**Why this priority**: useEffectの依存配列修正によって、既存の更新機能が影響を受けないことを確認する必要があります。ユーザーが明示的に更新を要求した場合は、正しくフィードを再取得する必要があります。

**Independent Test**: フィードが表示されている状態で「更新」ボタンをクリックし、Networkタブでフィード取得APIリクエストが1回実行され、記事が更新されることで独立してテスト可能。

**Acceptance Scenarios**:

1. **Given** 3件のRSSフィードが表示されている状態、**When** 「更新」ボタンをクリック、**Then** フィード取得APIリクエストが1回実行され、すべてのフィードの最新記事が表示される
2. **Given** 更新中の状態、**When** ローディングインジケーターが表示されている間、**Then** 「更新」ボタンが無効化され、完了後に再度有効になる

---

### Edge Cases

- フィードが0件の状態でページをリロードした場合、不要なAPIリクエストが発生しないか？
- フィード削除時に、削除されたフィードへのリクエストが発生しないか？
- カスタムタイトル編集時に、不要な再フェッチが発生しないか？

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: システムは、FeedContainer.tsxの32-37行目のuseEffectの依存配列から`subState.subscriptions`を削除し、`subState.subscriptions.length`のみを監視しなければならない
- **FR-002**: システムは、購読フィードの数（length）が変更された場合のみ、フィード取得APIリクエストを実行しなければならない
- **FR-003**: システムは、タイトル更新（UPDATE_SUBSCRIPTIONアクション）時に、フィード取得APIリクエストを実行してはならない
- **FR-004**: システムは、既存の手動更新機能（「更新」ボタン）を維持し、ユーザーが明示的に更新を要求した場合は正しくフィードを再取得しなければならない
- **FR-005**: システムは、フィード追加時および削除時に、フィード取得APIリクエストを正しく実行しなければならない
- **FR-006**: システムは、既存のすべての機能（記事表示、検索、フィルタリング、エラー表示）を維持し、リグレッションを発生させてはならない

### Key Entities

この修正はデータモデルに影響を与えません。既存のSubscriptionおよびArticleエンティティをそのまま使用します。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 3件のフィードが登録済みの状態でTOPページをリロードしたとき、フィード取得APIリクエストが正確に1回のみ実行される（現状：タイトル更新により2回以上実行される可能性がある）
- **SC-002**: タイトル更新時に、フィード取得APIリクエストが0回実行される
- **SC-003**: 「更新」ボタンをクリックしたとき、フィード取得APIリクエストが正確に1回実行される
- **SC-004**: フィード追加時に、フィード取得APIリクエストが正確に1回実行される
- **SC-005**: 既存のすべての自動テストが成功する（リグレッションなし）

## 技術的な分析

### 現状の問題点

FeedContainer.tsxの32-37行目のuseEffectの実装：

```typescript
// 購読の数が変更されたらフィードを取得（titleの更新では再取得しない）
useEffect(() => {
  if (subState.subscriptions.length > 0) {
    fetchFeeds(subState.subscriptions)
  }
}, [subState.subscriptions.length, subState.subscriptions, fetchFeeds])
```

**問題点**:
1. 依存配列に`subState.subscriptions.length`と`subState.subscriptions`の両方が含まれている
2. コメントには「titleの更新では再取得しない」と書かれているが、実装が意図と異なる
3. タイトル更新時（58-83行目のuseEffect内）に`UPDATE_SUBSCRIPTION`アクションが発行されると、`subscriptions`配列が新しい参照になる
4. 配列の参照が変わるとuseEffectが再実行され、不要な`fetchFeeds`が呼ばれる

### 修正内容

依存配列から`subState.subscriptions`を削除し、以下のようにします：

```typescript
// 購読の数が変更されたらフィードを取得（titleの更新では再取得しない）
useEffect(() => {
  if (subState.subscriptions.length > 0) {
    fetchFeeds(subState.subscriptions)
  }
}, [subState.subscriptions.length, fetchFeeds])
```

**修正の効果**:
- 購読の追加・削除時（length変更時）のみ`fetchFeeds`が実行される
- タイトル更新時（オブジェクト参照の変更のみ）は`fetchFeeds`が実行されない
- コメントの意図通りの動作になる

### 影響範囲

**変更が必要なファイル**:
- `frontend/src/containers/FeedContainer.tsx`: 依存配列の修正（1行のみ）

**テストが必要な機能**:
- ページ読み込み時のフィード取得
- フィード追加時の再フェッチ
- フィード削除時の動作
- タイトル更新時の非フェッチ
- 手動更新ボタンの動作
- 既存の統合テスト

### スコープ外

- フィード取得APIの最適化
- タイトル取得のタイミング変更
- localStorageのデータ構造変更
- その他のパフォーマンス改善
