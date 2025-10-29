# localStorage Contract: フィード購読データ

**Feature**: 009-fix-excessive-requests
**Date**: 2025-10-29

## Overview

フィード購読データをlocalStorageに永続化するための契約を定義します。既存の保存形式を維持し、`title`フィールドを追加します。

## Storage Key

**Key**: `rss-subscriptions`

## Data Format

### Subscription型

```typescript
interface Subscription {
  id: string                    // UUID v4
  feedUrl: string               // フィードURL
  title: string                 // APIから取得したタイトル（必須、新規追加）
  customTitle?: string          // ユーザー設定のカスタムタイトル（オプション）
  addedAt: string               // 追加日時（ISO 8601）
  lastFetchedAt: string | null  // 最終取得日時（ISO 8601またはnull）
  status: 'active' | 'error'    // ステータス
}
```

### 保存形式

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "feedUrl": "https://example.com/feed.xml",
    "title": "Example Blog",
    "customTitle": "My Favorite Blog",
    "addedAt": "2025-10-29T10:00:00.000Z",
    "lastFetchedAt": "2025-10-29T10:00:05.123Z",
    "status": "active"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "feedUrl": "https://another.com/rss",
    "title": "https://another.com/rss",
    "addedAt": "2025-10-29T11:00:00.000Z",
    "lastFetchedAt": null,
    "status": "error"
  }
]
```

## API Functions

### loadSubscriptions

localStorage からSubscriptionデータを読み込み、マイグレーションを実行します。

```typescript
function loadSubscriptions(): Subscription[] {
  try {
    const data = localStorage.getItem('rss-subscriptions')

    if (!data) {
      return []
    }

    const subscriptions: Subscription[] = JSON.parse(data)

    // データマイグレーション: titleフィールドがない場合はfeedUrlを設定
    const migrated = subscriptions.map(sub => {
      if (!sub.title) {
        return { ...sub, title: sub.feedUrl }
      }
      return sub
    })

    // マイグレーション済みデータを保存
    if (migrated.some((sub, index) => sub.title !== subscriptions[index].title)) {
      saveSubscriptions(migrated)
    }

    return migrated

  } catch (error) {
    if (error instanceof SyntaxError) {
      // 破損したデータをクリア
      console.error('localStorage data is corrupted, clearing...')
      localStorage.removeItem('rss-subscriptions')
      return []
    }
    throw error
  }
}
```

**Returns**: `Subscription[]` - マイグレーション済みの購読データ配列

**Error Handling**:
- JSON パースエラー → データをクリアして空配列を返す
- その他のエラー → 例外をスロー

### saveSubscriptions

Subscriptionデータを localStorage に保存します。

```typescript
function saveSubscriptions(subscriptions: Subscription[]): void {
  try {
    const json = JSON.stringify(subscriptions)
    localStorage.setItem('rss-subscriptions', json)
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      throw new Error('localStorage quota exceeded. Please remove some feeds.')
    }
    throw error
  }
}
```

**Parameters**:
- `subscriptions`: `Subscription[]` - 保存するSubscription配列

**Error Handling**:
- QuotaExceededError → 容量不足エラーをスロー
- その他のエラー → 例外をスロー

### addSubscription

新しいSubscriptionを追加します。

```typescript
function addSubscription(subscription: Subscription): void {
  const subscriptions = loadSubscriptions()
  subscriptions.push(subscription)
  saveSubscriptions(subscriptions)
}
```

**Parameters**:
- `subscription`: `Subscription` - 追加するSubscription

**Preconditions**:
- `subscription.id` がユニーク
- `subscription.feedUrl` が既存のfeedUrlと重複しない

### updateSubscription

既存のSubscriptionを更新します。

```typescript
function updateSubscription(updatedSubscription: Subscription): void {
  const subscriptions = loadSubscriptions()
  const index = subscriptions.findIndex(sub => sub.id === updatedSubscription.id)

  if (index === -1) {
    throw new Error(`Subscription with id ${updatedSubscription.id} not found`)
  }

  subscriptions[index] = updatedSubscription
  saveSubscriptions(subscriptions)
}
```

**Parameters**:
- `updatedSubscription`: `Subscription` - 更新するSubscription

**Error Handling**:
- IDが見つからない → エラーをスロー

### removeSubscription

Subscriptionを削除します。

```typescript
function removeSubscription(id: string): void {
  const subscriptions = loadSubscriptions()
  const filtered = subscriptions.filter(sub => sub.id !== id)
  saveSubscriptions(filtered)
}
```

**Parameters**:
- `id`: `string` - 削除するSubscriptionのID

## Migration Strategy

### 既存データの取り扱い

**Before Migration**:
```json
{
  "id": "...",
  "feedUrl": "https://example.com/feed.xml",
  // title フィールドなし
  "addedAt": "...",
  "lastFetchedAt": null,
  "status": "active"
}
```

**After Migration**:
```json
{
  "id": "...",
  "feedUrl": "https://example.com/feed.xml",
  "title": "https://example.com/feed.xml",  // feedUrlをフォールバック
  "addedAt": "...",
  "lastFetchedAt": null,
  "status": "active"
}
```

**Migration Logic**:
```typescript
function migrateSubscriptions(subscriptions: Subscription[]): Subscription[] {
  return subscriptions.map(sub => {
    // titleフィールドがない、または空文字の場合
    if (!sub.title || sub.title.length === 0) {
      return { ...sub, title: sub.feedUrl }
    }
    return sub
  })
}
```

**Migration Trigger**: `loadSubscriptions()` 実行時に自動実行

**User Impact**: なし（透過的に実行）

## Validation

### データバリデーション

```typescript
function validateSubscription(sub: any): string[] {
  const errors: string[] = []

  // 必須フィールド
  if (!sub.id) errors.push('id is required')
  if (!sub.feedUrl) errors.push('feedUrl is required')
  if (!sub.title) errors.push('title is required')
  if (!sub.addedAt) errors.push('addedAt is required')
  if (sub.lastFetchedAt === undefined) errors.push('lastFetchedAt is required')
  if (!sub.status) errors.push('status is required')

  // フォーマット
  if (sub.id && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sub.id)) {
    errors.push('id must be UUID v4')
  }

  if (sub.title && sub.title.length > 500) {
    errors.push('title must be <= 500 characters')
  }

  if (sub.customTitle && sub.customTitle.length > 100) {
    errors.push('customTitle must be <= 100 characters')
  }

  if (sub.status && !['active', 'error'].includes(sub.status)) {
    errors.push('status must be "active" or "error"')
  }

  return errors
}
```

## Testing

### テスト戦略

1. **Unit Tests**: 各関数の単体テスト
2. **Integration Tests**: localStorage との統合テスト
3. **Migration Tests**: データマイグレーションのテスト

### テスト例

```typescript
describe('localStorage contract', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('loadSubscriptions', () => {
    test('空のlocalStorageから読み込むと空配列を返す', () => {
      const result = loadSubscriptions()
      expect(result).toEqual([])
    })

    test('titleなしのデータをマイグレーションする', () => {
      const oldData = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        feedUrl: 'https://example.com/feed.xml',
        addedAt: '2025-10-29T10:00:00.000Z',
        lastFetchedAt: null,
        status: 'active',
      }]

      localStorage.setItem('rss-subscriptions', JSON.stringify(oldData))

      const result = loadSubscriptions()

      expect(result[0].title).toBe('https://example.com/feed.xml')
    })

    test('破損したJSONデータをクリアする', () => {
      localStorage.setItem('rss-subscriptions', 'invalid json')

      const result = loadSubscriptions()

      expect(result).toEqual([])
      expect(localStorage.getItem('rss-subscriptions')).toBeNull()
    })
  })

  describe('saveSubscriptions', () => {
    test('データを正しく保存する', () => {
      const subscriptions: Subscription[] = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        feedUrl: 'https://example.com/feed.xml',
        title: 'Example Blog',
        addedAt: '2025-10-29T10:00:00.000Z',
        lastFetchedAt: null,
        status: 'active',
      }]

      saveSubscriptions(subscriptions)

      const saved = localStorage.getItem('rss-subscriptions')
      expect(JSON.parse(saved!)).toEqual(subscriptions)
    })

    test('QuotaExceededErrorをスローする', () => {
      // localStorageのsetItemをモック
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem')
      mockSetItem.mockImplementation(() => {
        const error = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        throw error
      })

      const subscriptions: Subscription[] = []

      expect(() => saveSubscriptions(subscriptions))
        .toThrow('localStorage quota exceeded')

      mockSetItem.mockRestore()
    })
  })
})
```

## Performance Considerations

- **読み込み**: O(n) - すべてのSubscriptionを読み込む
- **保存**: O(n) - すべてのSubscriptionを保存
- **マイグレーション**: O(n) - 初回ロード時のみ

**推奨**: 50個以下のSubscriptionに最適化されています。それ以上の場合はIndexedDBへの移行を検討してください。

## Security Considerations

- **XSS対策**: localStorageのデータはJavaScriptからアクセス可能。信頼できないソースからのデータ挿入を防ぐ
- **データサニタイゼーション**: feedUrlとtitleは適切にエスケープしてから表示

## Backward Compatibility

この契約は既存のlocalStorage実装と完全に後方互換性があります：

- **キー名**: 変更なし（`rss-subscriptions`）
- **既存フィールド**: すべて維持
- **新規フィールド**: `title`のみ追加（マイグレーションで自動設定）

既存のコードは変更なしで動作し続けます。