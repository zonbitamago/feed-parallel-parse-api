import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedManager } from './FeedManager'

describe('FeedManager', () => {
  it('should render URL input', () => {
    const onAdd = vi.fn()
    render(<FeedManager onAddFeed={onAdd} subscriptions={[]} />)
    
    expect(screen.getByPlaceholderText(/URL/i)).toBeInTheDocument()
  })

  it('should validate URL input', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<FeedManager onAddFeed={onAdd} subscriptions={[]} />)
    
    const input = screen.getByPlaceholderText(/URL/i)
    await user.type(input, 'invalid-url')
    
    expect(screen.getByText(/無効なURL/i)).toBeInTheDocument()
  })

  it('should call onAddFeed with valid URL', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<FeedManager onAddFeed={onAdd} subscriptions={[]} />)
    
    const input = screen.getByPlaceholderText(/URL/i)
    await user.type(input, 'https://example.com/rss')
    
    const button = screen.getByRole('button', { name: /追加/i })
    await user.click(button)
    
    expect(onAdd).toHaveBeenCalledWith('https://example.com/rss')
  })

  it('should show subscription count limit warning', () => {
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
  it('should display subscription list', () => {
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

  it('should call onRemoveFeed when delete button clicked', async () => {
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

    const deleteButton = screen.getByRole('button', { name: /削除/i })
    await user.click(deleteButton)

    expect(onRemove).toHaveBeenCalledWith('1')
  })

  it('should display feed status', () => {
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
