# Quickstart: フィード登録時のタイトル保存による過剰リクエスト削減

**Feature**: 009-fix-excessive-requests
**Date**: 2025-10-29

## Overview

この文書は、開発者がこの機能の実装を開始するためのクイックスタートガイドです。TDD（テスト駆動開発）の原則に従い、テストファーストで進めます。

## Prerequisites

- Node.js 18以上
- TypeScript 5.9.3
- React 19.1.1
- Vitest 4.0.3

## Development Environment Setup

```bash
# プロジェクトルートに移動
cd /Users/k-takiuchi/Documents/feed-parallel-parse-api

# 依存関係をインストール（既にインストール済みの場合はスキップ）
cd frontend
npm install

# テストを実行して環境を確認
npm test
```

## Architecture Overview

```text
┌──────────────────────────────────────────────────────┐
│ UI Layer                                              │
│ ┌────────────────────────────────────────────┐      │
│ │ FeedContainer.tsx                          │      │
│ │ - フィード登録UI                           │      │
│ │ - ローディング表示                         │      │
│ │ - エラーメッセージ表示                     │      │
│ └────────────────────────────────────────────┘      │
│                        ↓                              │
│ ┌────────────────────────────────────────────┐      │
│ │ useFeedAPI.ts (Custom Hook)                │      │
│ │ - APIリクエスト                            │      │
│ │ - タイムアウト設定                         │      │
│ └────────────────────────────────────────────┘      │
│                        ↓                              │
│ ┌────────────────────────────────────────────┐      │
│ │ SubscriptionContext.tsx                    │      │
│ │ - 購読データの状態管理                     │      │
│ │ - ADD_SUBSCRIPTION action                  │      │
│ │ - UPDATE_SUBSCRIPTION action               │      │
│ └────────────────────────────────────────────┘      │
│                        ↓                              │
│ ┌────────────────────────────────────────────┐      │
│ │ storage.ts (Utility)                       │      │
│ │ - localStorage読み書き                    │      │
│ │ - データマイグレーション                   │      │
│ └────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
         ↓ HTTP                     ↓ localStorage
┌─────────────────┐         ┌─────────────────┐
│ /api/parse      │         │ rss-subscriptions│
│ (Go Backend)    │         │ (Browser)        │
└─────────────────┘         └─────────────────┘
```

## TDD Workflow (Red-Green-Refactor)

### Phase 1: storage.ts (データ層)

**Step 1-1: Red - マイグレーション関数のテスト**

```bash
# テストファイルを作成
touch frontend/tests/unit/storage.test.ts
```

```typescript
// frontend/tests/unit/storage.test.ts
import { describe, test, expect, beforeEach } from 'vitest'
import { loadSubscriptions, saveSubscriptions } from '../../src/utils/storage'

describe('storage.ts', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('loadSubscriptions', () => {
    test('titleフィールドがない既存データをマイグレーションする', () => {
      const oldData = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        feedUrl: 'https://example.com/feed.xml',
        addedAt: '2025-10-29T10:00:00.000Z',
        lastFetchedAt: null,
        status: 'active',
      }]

      localStorage.setItem('rss-subscriptions', JSON.stringify(oldData))

      const result = loadSubscriptions()

      // titleフィールドがfeedUrlで埋められているはず
      expect(result[0].title).toBe('https://example.com/feed.xml')
    })
  })
})
```

テストを実行（失敗を確認）:
```bash
npm test -- storage.test.ts
```

**Step 1-2: Green - 最小限の実装**

```typescript
// frontend/src/utils/storage.ts に追加

export function loadSubscriptions(): Subscription[] {
  try {
    const data = localStorage.getItem('rss-subscriptions')
    if (!data) return []

    const subscriptions: Subscription[] = JSON.parse(data)

    // マイグレーション
    const migrated = subscriptions.map(sub => {
      if (!sub.title) {
        return { ...sub, title: sub.feedUrl }
      }
      return sub
    })

    // マイグレーション済みデータを保存
    if (migrated.some((sub, i) => sub.title !== subscriptions[i]?.title)) {
      saveSubscriptions(migrated)
    }

    return migrated
  } catch (error) {
    if (error instanceof SyntaxError) {
      localStorage.removeItem('rss-subscriptions')
      return []
    }
    throw error
  }
}
```

テストを実行（成功を確認）:
```bash
npm test -- storage.test.ts
```

**Step 1-3: Refactor - コードの改善**

（必要に応じて重複を排除、名前を明確化）

### Phase 2: useFeedAPI.ts (API層)

**Step 2-1: Red - タイムアウト機能のテスト**

```typescript
// frontend/tests/unit/useFeedAPI.test.ts
import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { fetchFeedTitle } from '../../src/hooks/useFeedAPI'

const server = setupServer(
  rest.post('/api/parse', (req, res, ctx) => {
    return res(
      ctx.json({
        results: [{ url: 'https://example.com/feed.xml', title: 'Example Blog', items: [] }]
      })
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useFeedAPI', () => {
  test('10秒でタイムアウトする', async () => {
    server.use(
      rest.post('/api/parse', (req, res, ctx) => {
        return res(ctx.delay(11000))
      })
    )

    await expect(fetchFeedTitle('https://example.com/feed.xml'))
      .rejects.toThrow('timeout')
  }, 12000) // テストタイムアウトを12秒に設定
})
```

**Step 2-2: Green - タイムアウト実装**

```typescript
// frontend/src/hooks/useFeedAPI.ts
export async function fetchFeedTitle(feedUrl: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: [feedUrl] }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    return data.results[0].title

  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw error
  }
}
```

### Phase 3: FeedContainer.tsx (UI層)

**Step 3-1: Red - フィード登録フローのテスト**

```typescript
// frontend/tests/integration/FeedContainer.test.tsx
import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { FeedContainer } from '../../src/containers/FeedContainer'

const server = setupServer(
  rest.post('/api/parse', (req, res, ctx) => {
    return res(ctx.json({
      results: [{ url: 'https://example.com/feed.xml', title: 'Example Blog', items: [] }]
    }))
  })
)

beforeAll(() => server.listen())
afterAll(() => server.close())

describe('FeedContainer - フィード登録', () => {
  test('フィード登録時にタイトルを取得してlocalStorageに保存する', async () => {
    localStorage.clear()

    render(<FeedContainer />)

    const input = screen.getByPlaceholderText(/URLを入力/)
    const button = screen.getByRole('button', { name: /登録/ })

    await userEvent.type(input, 'https://example.com/feed.xml')
    await userEvent.click(button)

    // ローディング表示を確認
    expect(screen.getByText(/登録中/)).toBeInTheDocument()

    // タイトルが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('Example Blog')).toBeInTheDocument()
    })

    // localStorageに保存されていることを確認
    const saved = JSON.parse(localStorage.getItem('rss-subscriptions')!)
    expect(saved[0].title).toBe('Example Blog')
  })
})
```

**Step 3-2: Green - UI実装**

```typescript
// frontend/src/containers/FeedContainer.tsx に追加
const [isRegistering, setIsRegistering] = useState(false)

const handleRegisterFeed = async (feedUrl: string) => {
  // 重複チェック
  if (subState.subscriptions.some(sub => sub.feedUrl === feedUrl)) {
    showErrorMessage('このフィードは既に登録されています。')
    return
  }

  setIsRegistering(true)

  try {
    // タイトル取得
    const title = await fetchFeedTitle(feedUrl)

    // Subscription作成
    const newSubscription: Subscription = {
      id: crypto.randomUUID(),
      feedUrl,
      title,
      addedAt: new Date().toISOString(),
      lastFetchedAt: new Date().toISOString(),
      status: 'active',
    }

    // Context更新
    subDispatch({ type: 'ADD_SUBSCRIPTION', payload: newSubscription })

    // localStorage保存
    const updated = [...subState.subscriptions, newSubscription]
    saveSubscriptions(updated)

  } catch (error) {
    // エラー時はfeedUrlをタイトルとして使用
    const newSubscription: Subscription = {
      id: crypto.randomUUID(),
      feedUrl,
      title: feedUrl,
      addedAt: new Date().toISOString(),
      lastFetchedAt: null,
      status: 'error',
    }

    subDispatch({ type: 'ADD_SUBSCRIPTION', payload: newSubscription })
    showErrorMessage('フィードのタイトルを取得できませんでした。URLをタイトルとして使用します。')

  } finally {
    setIsRegistering(false)
  }
}
```

## Development Checklist

- [ ] 1. storage.ts のテストと実装
  - [ ] loadSubscriptions
  - [ ] saveSubscriptions
  - [ ] マイグレーションロジック
- [ ] 2. useFeedAPI.ts のテストと実装
  - [ ] fetchFeedTitle
  - [ ] タイムアウト処理
  - [ ] エラーハンドリング
- [ ] 3. FeedContainer.tsx のテストと実装
  - [ ] フィード登録UI
  - [ ] ローディング表示
  - [ ] エラーメッセージ表示
  - [ ] 重複チェック
- [ ] 4. 統合テスト
  - [ ] フィード登録からタイトル表示まで
  - [ ] リロード後のデータ永続性
- [ ] 5. E2Eテスト（必要に応じて）
  - [ ] ユーザーシナリオ全体

## Running Tests

```bash
# すべてのテストを実行
npm test

# 特定のテストファイルを実行
npm test -- storage.test.ts

# カバレッジレポートを生成
npm test -- --coverage

# ウォッチモードで実行
npm test -- --watch
```

## Build & Run

```bash
# 開発サーバーを起動
npm run dev

# ビルド
npm run build

# 型チェック
npm run type-check

# リンター
npm run lint
```

## Next Steps

1. `/speckit.tasks` コマンドで詳細なタスクリストを生成
2. タスクリストに従ってTDDサイクルを回す
3. 各タスク完了後にコミット（Red → Green → Refactor）
4. すべてのテストがパスしたらPRを作成

## Resources

- [Spec Document](./spec.md)
- [Implementation Plan](./plan.md)
- [Research](./research.md)
- [Data Model](./data-model.md)
- [API Contract](./contracts/api.md)
- [localStorage Contract](./contracts/localStorage.md)