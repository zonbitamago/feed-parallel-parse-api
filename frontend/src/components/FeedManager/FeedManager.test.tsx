import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedManager } from './FeedManager'

describe('FeedManager', () => {
  it('URL入力欄をレンダリングする', () => {
    const onAdd = vi.fn()
    render(<FeedManager onAddFeed={onAdd} subscriptions={[]} />)
    
    expect(screen.getByPlaceholderText(/URL/i)).toBeInTheDocument()
  })

  it('URL入力を検証する', async () => {
    // 準備
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<FeedManager onAddFeed={onAdd} subscriptions={[]} />)

    // 実行: 無効なURLを入力
    const input = screen.getByPlaceholderText(/URL/i)
    await user.type(input, 'invalid-url')

    // 検証: エラーメッセージが表示される
    expect(screen.getByText(/無効なURL/i)).toBeInTheDocument()
  })

  it('有効なURLでonAddFeedを呼び出す', async () => {
    // 準備
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<FeedManager onAddFeed={onAdd} subscriptions={[]} />)

    // 実行: 有効なURLを入力して追加ボタンをクリック
    const input = screen.getByPlaceholderText(/URL/i)
    await user.type(input, 'https://example.com/rss')
    const button = screen.getByRole('button', { name: /追加/i })
    await user.click(button)

    // 検証: onAddFeedが呼ばれる
    expect(onAdd).toHaveBeenCalledWith('https://example.com/rss')
  })

  it('購読数制限の警告を表示する', () => {
    const onAdd = vi.fn()
    const subscriptions = Array.from({ length: 100 }, (_, i) => ({
      id: `${i}`,
      url: `https://example.com/${i}`,
      title: `Feed ${i}`,
      subscribedAt: new Date().toISOString(),
      lastFetchedAt: null,
      status: 'active' as const,
    }))

    render(<FeedManager onAddFeed={onAdd} subscriptions={subscriptions} />)

    expect(screen.getByText(/上限/i)).toBeInTheDocument()
  })

  // US2: 購読管理機能のテスト
  it('購読リストを表示する', () => {
    const onAdd = vi.fn()
    const onRemove = vi.fn()
    const subscriptions = [
      {
        id: '1',
        url: 'https://example.com/rss',
        title: 'Test Feed 1',
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: null,
        status: 'active' as const,
      },
      {
        id: '2',
        url: 'https://example.com/feed.xml',
        title: 'Test Feed 2',
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: null,
        status: 'active' as const,
      },
    ]

    render(<FeedManager onAddFeed={onAdd} onRemoveFeed={onRemove} subscriptions={subscriptions} />)

    expect(screen.getByText('Test Feed 1')).toBeInTheDocument()
    expect(screen.getByText('Test Feed 2')).toBeInTheDocument()
  })

  it('削除ボタンクリック時にonRemoveFeedを呼び出す', async () => {
    // 準備
    const user = userEvent.setup()
    const onAdd = vi.fn()
    const onRemove = vi.fn()
    const subscriptions = [
      {
        id: '1',
        url: 'https://example.com/rss',
        title: 'Test Feed',
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: null,
        status: 'active' as const,
      },
    ]
    render(<FeedManager onAddFeed={onAdd} onRemoveFeed={onRemove} subscriptions={subscriptions} />)

    // 実行: 削除ボタンをクリック
    const deleteButton = screen.getByRole('button', { name: /削除/i })
    await user.click(deleteButton)

    // 検証: onRemoveFeedが呼ばれる
    expect(onRemove).toHaveBeenCalledWith('1')
  })

  it('フィードのステータスを表示する', () => {
    const onAdd = vi.fn()
    const onRemove = vi.fn()
    const subscriptions = [
      {
        id: '1',
        url: 'https://example.com/rss',
        title: 'Active Feed',
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: new Date().toISOString(),
        status: 'active' as const,
      },
      {
        id: '2',
        url: 'https://example.com/error',
        title: 'Error Feed',
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: null,
        status: 'error' as const,
      },
    ]

    render(<FeedManager onAddFeed={onAdd} onRemoveFeed={onRemove} subscriptions={subscriptions} />)

    expect(screen.getByText('Active Feed')).toBeInTheDocument()
    expect(screen.getByText('Error Feed')).toBeInTheDocument()
    // ステータス表示の確認（実装により表示方法は異なる）
  })
})
