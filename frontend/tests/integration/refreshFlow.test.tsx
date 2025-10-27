import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import App from '../../src/App'

const server = setupServer(
  http.post('*/api/parse', async () => {
    // 遅延を追加してローディング状態をテストしやすくする
    await new Promise(resolve => setTimeout(resolve, 100))
    return HttpResponse.json({
      feeds: [
        {
          title: 'Test Feed',
          link: 'https://example.com',
          articles: [
            {
              title: 'Test Article',
              link: 'https://example.com/article',
              pubDate: '2025-01-01T10:00:00Z',
              summary: 'Test summary',
            },
          ],
        },
      ],
      errors: [],
    })
  })
)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())

describe('Refresh Flow Integration', () => {
  it('更新ボタンをクリックしてフィードを更新する', async () => {
    const user = userEvent.setup()
    
    // 事前に購読を設定
    localStorage.setItem('rss_reader_subscriptions', JSON.stringify({
      subscriptions: [{
        id: '1',
        url: 'https://example.com/rss',
        title: 'Test Feed',
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: null,
        status: 'active',
      }]
    }))
    
    render(<App />)
    
    // 初回読み込み待機
    await waitFor(() => {
      expect(screen.getByText('Test Article')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // 更新ボタンを探す
    const refreshButton = screen.getByRole('button', { name: /更新/i })
    
    // 更新ボタンをクリック
    await user.click(refreshButton)
    
    // ローディング表示を確認
    await waitFor(() => {
      expect(screen.getByText(/読み込み中/i)).toBeInTheDocument()
    })
    
    // 再度記事が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('Test Article')).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
