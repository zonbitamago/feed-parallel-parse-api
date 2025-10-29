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
    // テスト用のリクエストカウンター
    let requestCount = 0

    // APIリクエストをカウントするハンドラーを設定
    server.use(
      http.post('*/api/parse', async () => {
        requestCount++
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

    // 準備
    const user = userEvent.setup()
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
    await waitFor(() => {
      expect(screen.getByText('Test Article')).toBeInTheDocument()
    }, { timeout: 3000 })

    // 初回ロード時のリクエスト回数を記録
    const initialRequestCount = requestCount
    expect(initialRequestCount).toBeGreaterThan(0)

    // 実行: 更新ボタンをクリック
    const refreshButton = screen.getByRole('button', { name: /更新/i })
    await user.click(refreshButton)

    // 検証: ローディング表示と記事の再表示を確認
    await waitFor(() => {
      expect(screen.getByText(/読み込み中/i)).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('Test Article')).toBeInTheDocument()
    }, { timeout: 3000 })

    // 検証: 更新ボタンクリック時にフィード取得が1回のみ実行されること
    expect(requestCount).toBe(initialRequestCount + 1)
  })
})
