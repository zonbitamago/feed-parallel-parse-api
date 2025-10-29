# API Contracts: 購読フィード識別表示の改善

**Feature**: 008-feed-url-display
**Date**: 2025-10-29
**Status**: No Changes Required

## Overview

この機能はフロントエンドのみの変更で完結するため、**新規APIエンドポイントは不要**です。既存のAPIエンドポイントをそのまま使用します。

## Existing API Contract

### POST /api/parse

**説明**: 複数のRSSフィードURLを受け取り、パースした結果を返す

**Request**:
```typescript
interface ParseRequest {
  urls: string[];  // 最大100件
}
```

**Response**:
```typescript
interface ParseResponse {
  feeds: RSSFeed[];
  errors: ErrorInfo[];
}

interface RSSFeed {
  title: string;        // ← フィードタイトル（この機能で使用）
  link: string;         // フィードのURL
  articles: APIArticle[];
}

interface APIArticle {
  title: string;
  link: string;
  pubDate: string;
  summary: string;
}

interface ErrorInfo {
  url: string;
  message: string;
}
```

### この機能での変更点

**変更なし** - 既存のAPIレスポンスをそのまま使用します。

特に、`RSSFeed.title`フィールドが既に存在しており、これを活用します：
- 現在: APIレスポンスの`title`は記事表示にのみ使用されている
- 変更後: `title`をSubscriptionモデルにも保存し、購読リスト表示に使用

## Frontend Type Changes

### Subscription型の拡張

```typescript
// Before
export interface Subscription {
  id: string;
  url: string;
  title: string | null;          // 常にnull
  subscribedAt: string;
  lastFetchedAt: string | null;
  status: 'active' | 'error';
}

// After
export interface Subscription {
  id: string;
  url: string;
  title: string | null;          // APIから自動取得
  customTitle: string | null;    // 🆕 ユーザー設定
  subscribedAt: string;
  lastFetchedAt: string | null;
  status: 'active' | 'error';
}
```

## Component Props Contracts

### FeedManager Props

```typescript
// 既存
interface FeedManagerProps {
  onAddFeed: (url: string) => void;
  onRemoveFeed?: (id: string) => void;
  subscriptions: Subscription[];
}

// 拡張後
interface FeedManagerProps {
  onAddFeed: (url: string) => void;
  onRemoveFeed?: (id: string) => void;
  onUpdateCustomTitle?: (id: string, customTitle: string) => void;  // 🆕
  subscriptions: Subscription[];
}
```

### 新規コンポーネント: FeedEditableTitle

```typescript
interface FeedEditableTitleProps {
  subscription: Subscription;
  onSave: (id: string, customTitle: string) => void;
  disabled?: boolean;
}
```

## LocalStorage Contract

### Storage Key

```typescript
const STORAGE_KEY = 'rss_reader_subscriptions';  // 既存のまま
```

### Data Format

```typescript
interface StorageData {
  subscriptions: Subscription[];  // customTitleフィールドを含む
}
```

### Backward Compatibility

既存のlocalStorageデータ（`customTitle`フィールドなし）との互換性を保証：

```typescript
// 読み込み時に正規化
function loadSubscriptions(): Subscription[] {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  return data.subscriptions.map(sub => ({
    ...sub,
    customTitle: sub.customTitle ?? null  // undefinedをnullに
  }));
}
```

## Event Contracts

### カスタムタイトル更新イベント

```typescript
// FeedContainer内のハンドラー
function handleUpdateCustomTitle(id: string, customTitle: string): void {
  const updated = subscriptions.map(sub =>
    sub.id === id ? { ...sub, customTitle } : sub
  );

  // Context更新
  dispatch({ type: 'UPDATE_SUBSCRIPTION', payload: { ...subscription, customTitle } });

  // localStorage保存
  saveSubscriptions(updated);
}
```

## Validation Contracts

### Input Validation

```typescript
interface ValidationResult {
  valid: boolean;
  error?: string;
}

function validateCustomTitle(title: string): ValidationResult {
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

## Error Handling

### エラーケース

1. **localStorage書き込みエラー**:
   ```typescript
   try {
     saveSubscriptions(updated);
   } catch (error) {
     console.error('Failed to save custom title:', error);
     // UIにエラー表示（既存のエラーハンドリング機構を使用）
   }
   ```

2. **バリデーションエラー**:
   ```typescript
   const validation = validateCustomTitle(input);
   if (!validation.valid) {
     setError(validation.error);  // 入力フィールド下にエラー表示
     return;
   }
   ```

## Testing Contracts

### Mock API Response

```typescript
const mockParseResponse: ParseResponse = {
  feeds: [
    {
      title: "Example Blog",  // ← このタイトルを使用
      link: "https://example.com/feed",
      articles: [...]
    }
  ],
  errors: []
};
```

### Test Helpers

```typescript
// テスト用のSubscription作成
function createMockSubscription(overrides?: Partial<Subscription>): Subscription {
  return {
    id: crypto.randomUUID(),
    url: "https://example.com/feed",
    title: "Example Blog",
    customTitle: null,
    subscribedAt: new Date().toISOString(),
    lastFetchedAt: new Date().toISOString(),
    status: 'active',
    ...overrides
  };
}
```

## Summary

この機能では、既存のAPI契約を変更せず、フロントエンドのみで完結します。主な変更点は：

1. ✅ Subscription型に`customTitle`フィールドを追加
2. ✅ 既存のAPI レスポンス（`RSSFeed.title`）を活用
3. ✅ FeedManagerコンポーネントに編集機能を追加
4. ✅ localStorageの後方互換性を維持

新規APIエンドポイントやAPI契約の変更は不要です。