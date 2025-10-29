# Data Model: 購読フィード識別表示の改善

**Feature**: 008-feed-url-display
**Date**: 2025-10-29
**Status**: Design Complete

## Overview

この機能では、既存の`Subscription`モデルを拡張し、ユーザーがカスタム設定したフィード表示名を保存・管理できるようにします。APIから自動取得したタイトルとユーザー設定のカスタム名を区別して管理し、表示時に適切な優先順位で選択します。

## Entity: Subscription

### 既存のモデル

```typescript
// frontend/src/types/models.ts
export interface Subscription {
  id: string;                    // UUID v4形式の一意識別子
  url: string;                   // RSSフィードのURL
  title: string | null;          // フィードタイトル（現在は常にnull）
  subscribedAt: string;          // 購読開始日時（ISO 8601形式）
  lastFetchedAt: string | null;  // 最終取得日時（ISO 8601形式）
  status: 'active' | 'error';    // ステータス
}
```

### 拡張後のモデル

```typescript
// frontend/src/types/models.ts
export interface Subscription {
  id: string;                    // UUID v4形式の一意識別子
  url: string;                   // RSSフィードのURL
  title: string | null;          // APIから自動取得したフィードタイトル
  customTitle: string | null;    // 🆕 ユーザーが設定したカスタム表示名
  subscribedAt: string;          // 購読開始日時（ISO 8601形式）
  lastFetchedAt: string | null;  // 最終取得日時（ISO 8601形式）
  status: 'active' | 'error';    // ステータス
}
```

### フィールド詳細

#### 新規フィールド: `customTitle`

- **型**: `string | null`
- **説明**: ユーザーが手動で設定したカスタム表示名
- **デフォルト値**: `null`
- **検証ルール**:
  - 設定時: 空文字列不可（トリム後の長さ > 0）
  - 最大長: 200文字
  - 許可文字: すべてのUnicode文字（絵文字含む）
- **更新タイミング**: ユーザーが編集UIで保存したとき
- **永続化**: localStorageに保存
- **特記事項**:
  - `null`の場合は自動取得タイトル（`title`）を使用
  - ユーザーが設定している場合、フィード更新時も保持される

#### 既存フィールドの動作変更: `title`

- **型**: `string | null`（変更なし）
- **説明**: APIから自動取得したフィードタイトル
- **更新タイミング**: 🆕 フィード取得成功時にAPIレスポンスから更新
- **以前の動作**: 常に`null`のまま
- **新しい動作**: APIレスポンスの`RSSFeed.title`を設定

### ヘルパー関数

```typescript
/**
 * 表示用のタイトルを取得する
 * 優先順位: customTitle > title > url
 */
export function getDisplayTitle(subscription: Subscription): string {
  if (subscription.customTitle) {
    return subscription.customTitle;
  }
  if (subscription.title) {
    return subscription.title;
  }
  return subscription.url;
}

/**
 * カスタムタイトルが設定されているかチェック
 */
export function hasCustomTitle(subscription: Subscription): boolean {
  return subscription.customTitle !== null && subscription.customTitle.trim().length > 0;
}

/**
 * カスタムタイトルのバリデーション
 */
export function validateCustomTitle(title: string): { valid: boolean; error?: string } {
  const trimmed = title.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'フィード名を入力してください' };
  }

  if (trimmed.length > 200) {
    return { valid: false, error: 'フィード名は200文字以内にしてください' };
  }

  return { valid: true };
}
```

## Data Flow

### 1. フィード追加時

```
[ユーザー] → [FeedContainer.handleAddFeed]
  ↓ 新規Subscription作成
  {
    id: uuid(),
    url: "https://example.com/feed",
    title: null,           // 初期値
    customTitle: null,     // 初期値
    ...
  }
  ↓ saveSubscriptions()
  ↓ localStorageに保存
  ↓ API呼び出し（fetchFeeds）
  ↓ APIレスポンス
  {
    feeds: [{
      title: "Example Blog",  ← このタイトルを使用
      link: "https://example.com/feed",
      articles: [...]
    }]
  }
  ↓ Subscription更新
  {
    ...subscription,
    title: "Example Blog",  // ← APIから取得したタイトルを設定
    lastFetchedAt: new Date().toISOString()
  }
  ↓ UPDATE_SUBSCRIPTION action
  ↓ saveSubscriptions()
  ↓ 表示: "Example Blog"（title）
```

### 2. カスタムタイトル編集時

```
[ユーザー] → [編集ボタンクリック]
  ↓ 編集モードに切り替え
  ↓ 現在の表示タイトルをinput valueに設定
[ユーザー] → [新しい名前を入力]
  ↓ "私のブログ"
[ユーザー] → [保存ボタンクリック]
  ↓ バリデーション
  ↓ FeedContainer.handleUpdateCustomTitle()
  {
    ...subscription,
    customTitle: "私のブログ"
  }
  ↓ UPDATE_SUBSCRIPTION action
  ↓ saveSubscriptions()
  ↓ 表示: "私のブログ"（customTitle）
```

### 3. フィード更新時

```
[ユーザー] → [更新ボタンクリック]
  ↓ fetchFeeds()
  ↓ APIレスポンス
  {
    feeds: [{
      title: "Example Blog - Updated",  ← タイトルが変わった
      ...
    }]
  }
  ↓ Subscription更新判定

  ケースA: customTitleが設定されていない
    {
      title: "Example Blog - Updated",  // ← 自動更新
      customTitle: null
    }
    ↓ 表示: "Example Blog - Updated"（新しいtitle）

  ケースB: customTitleが設定されている
    {
      title: "Example Blog - Updated",  // APIから更新
      customTitle: "私のブログ"           // ← 保持される
    }
    ↓ 表示: "私のブログ"（customTitle優先）
```

## State Management

### Context Actions

既存のSubscriptionContextに新しいアクションは不要です。既存の`UPDATE_SUBSCRIPTION`アクションで対応可能。

```typescript
// 既存のアクション（変更なし）
type SubscriptionAction =
  | { type: 'ADD_SUBSCRIPTION'; payload: Subscription }
  | { type: 'REMOVE_SUBSCRIPTION'; payload: string }
  | { type: 'UPDATE_SUBSCRIPTION'; payload: Subscription }  // ← これを使用
  | { type: 'LOAD_SUBSCRIPTIONS'; payload: Subscription[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
```

### Component State

**FeedManager** コンポーネント内の編集状態:

```typescript
interface EditState {
  editingId: string | null;      // 現在編集中のSubscription ID
  editValue: string;             // 編集中の値
  error: string | null;          // バリデーションエラー
}
```

## Storage Schema

### localStorage Format

```json
{
  "subscriptions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "url": "https://example.com/feed",
      "title": "Example Blog",
      "customTitle": "私のお気に入りブログ",
      "subscribedAt": "2025-10-29T10:00:00.000Z",
      "lastFetchedAt": "2025-10-29T10:05:00.000Z",
      "status": "active"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "url": "https://tech-news.example.com/rss",
      "title": "Tech News Daily",
      "customTitle": null,
      "subscribedAt": "2025-10-29T10:01:00.000Z",
      "lastFetchedAt": "2025-10-29T10:05:00.000Z",
      "status": "active"
    }
  ]
}
```

### Migration Strategy

**既存データとの互換性**:

- `customTitle`フィールドが存在しない既存データ: `undefined`として読み込まれ、`null`として扱う
- TypeScriptの型定義で`string | null`とすることで、`undefined`も許容
- localStorage読み込み時に正規化:

```typescript
export function loadSubscriptions(): Subscription[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const parsed: StorageData = JSON.parse(data);

    // 🆕 既存データのマイグレーション
    return (parsed.subscriptions || []).map(sub => ({
      ...sub,
      customTitle: sub.customTitle ?? null  // undefinedをnullに正規化
    }));
  } catch (error) {
    console.error('Failed to load subscriptions from localStorage:', error);
    return [];
  }
}
```

## Validation Rules

### Input Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| customTitle | 必須（トリム後） | "フィード名を入力してください" |
| customTitle | 最大200文字 | "フィード名は200文字以内にしてください" |
| customTitle | Unicode文字 | （制限なし） |

### Business Rules

1. **一意性**: customTitleは一意である必要はない（同じ名前を複数のフィードに付けられる）
2. **更新の保持**: ユーザーがcustomTitleを設定した場合、フィード更新時も保持される
3. **削除**: customTitleを空にすることはできない（設定を解除する場合は別のUI要素が必要）

## Performance Considerations

### メモリ使用量

- 1つのSubscriptionの追加データ: 平均50-100文字（150-300バイト）
- 100件の場合: 最大30KB
- localStorage制限（5-10MB）に対して0.3-0.6%

### レンダリング最適化

```typescript
// React.memoで最適化
export const FeedEditableTitle = React.memo(({ subscription, onSave }: Props) => {
  // 実装...
}, (prevProps, nextProps) => {
  // customTitleとtitleが変更されていない場合は再レンダリングしない
  return prevProps.subscription.customTitle === nextProps.subscription.customTitle &&
         prevProps.subscription.title === nextProps.subscription.title &&
         prevProps.subscription.url === nextProps.subscription.url;
});
```

## Testing Strategy

### Unit Tests

1. **ヘルパー関数** (`models.ts`):
   - `getDisplayTitle()`: 優先順位テスト
   - `hasCustomTitle()`: 判定ロジックテスト
   - `validateCustomTitle()`: バリデーションケース

2. **Storage** (`storage.ts`):
   - 既存データの読み込み（customTitleなし）
   - 新規データの保存（customTitleあり）

### Integration Tests

1. **フィード追加とタイトル取得**:
   - API応答からtitleが設定されることを確認
   - localStorageに正しく保存されることを確認

2. **カスタムタイトル編集**:
   - 編集→保存→再表示の一連の流れ
   - バリデーションエラーの表示

3. **フィード更新時の動作**:
   - customTitle未設定: titleが自動更新される
   - customTitle設定済み: customTitleが保持される

## Related Files

### 変更が必要なファイル

- `frontend/src/types/models.ts` - Subscription型の拡張
- `frontend/src/contexts/SubscriptionContext.tsx` - （既存アクションで対応可能）
- `frontend/src/services/storage.ts` - マイグレーション処理追加
- `frontend/src/hooks/useFeedAPI.ts` - title更新ロジック追加
- `frontend/src/containers/FeedContainer.tsx` - カスタムタイトル更新ハンドラー追加
- `frontend/src/components/FeedManager/FeedManager.tsx` - 編集UI追加

### 新規作成が必要なファイル

- `frontend/src/utils/titleUtils.ts` - タイトル処理ユーティリティ
- `frontend/src/utils/titleUtils.test.ts` - ユーティリティテスト
- `frontend/tests/integration/feedTitleFlow.test.tsx` - 統合テスト

## Summary

この データモデル設計により、既存のアーキテクチャを保ちながら、フィードタイトルの自動取得とカスタム名設定の両方をサポートできます。後方互換性を維持し、既存データへの影響を最小限に抑えた設計となっています。