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
})
