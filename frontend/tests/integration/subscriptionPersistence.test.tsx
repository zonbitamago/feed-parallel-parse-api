import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'

describe('Subscription Persistence Integration', () => {
  beforeEach(() => {
    // 各テスト前にlocalStorageをクリア
    localStorage.clear()
  })

  it('should persist subscriptions to localStorage', async () => {
    const user = userEvent.setup()
    
    // アプリをレンダリング
    const { rerender } = render(<App />)
    
    // フィードを追加
    const input = screen.getByPlaceholderText(/URL/i)
    await user.type(input, 'https://example.com/rss')
    
    const addButton = screen.getByRole('button', { name: /追加/i })
    await user.click(addButton)
    
    // localStorageに保存されていることを確認
    const stored = localStorage.getItem('rss_reader_subscriptions')
    expect(stored).toBeTruthy()
    
    const parsed = JSON.parse(stored!)
    expect(parsed.subscriptions).toHaveLength(1)
    expect(parsed.subscriptions[0].url).toBe('https://example.com/rss')
  })

  it('should load subscriptions from localStorage on mount', () => {
    // localStorageに購読データを事前設定
    const mockSubscription = {
      id: 'test-id',
      url: 'https://example.com/rss',
      title: 'Persisted Feed',
      subscribedAt: new Date().toISOString(),
      lastFetchedAt: null,
      status: 'active',
    }
    
    localStorage.setItem('rss_reader_subscriptions', JSON.stringify({
      subscriptions: [mockSubscription]
    }))
    
    // アプリをレンダリング
    render(<App />)
    
    // ウェルカム画面が表示されないことを確認（購読があるため）
    expect(screen.queryByText(/ウェルカム/i)).not.toBeInTheDocument()
    
    // 購読数が表示されることを確認
    expect(screen.getByText(/購読中.*1.*1/)).toBeInTheDocument()
  })

  it('should handle subscription deletion and persistence', async () => {
    const user = userEvent.setup()
    
    // localStorageに複数の購読を設定
    const subscriptions = [
      {
        id: '1',
        url: 'https://example.com/rss1',
        title: 'Feed 1',
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: null,
        status: 'active',
      },
      {
        id: '2',
        url: 'https://example.com/rss2',
        title: 'Feed 2',
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: null,
        status: 'active',
      },
    ]
    
    localStorage.setItem('rss_reader_subscriptions', JSON.stringify({
      subscriptions
    }))
    
    // アプリをレンダリング
    render(<App />)
    
    // 購読リストが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('Feed 1')).toBeInTheDocument()
      expect(screen.getByText('Feed 2')).toBeInTheDocument()
    })
    
    // 1つ目のフィードを削除
    const deleteButtons = screen.getAllByRole('button', { name: /削除/i })
    await user.click(deleteButtons[0])
    
    // localStorageが更新されていることを確認
    await waitFor(() => {
      const stored = localStorage.getItem('rss_reader_subscriptions')
      const parsed = JSON.parse(stored!)
      expect(parsed.subscriptions).toHaveLength(1)
      expect(parsed.subscriptions[0].title).toBe('Feed 2')
    })
  })
})
