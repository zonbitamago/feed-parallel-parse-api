import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import App from '../../src/App'

const API_BASE_URL = 'https://feed-parallel-parse-api.vercel.app'

// MSWサーバーのセットアップ
const server = setupServer(
  http.post(`${API_BASE_URL}/api/parse`, () => {
    return HttpResponse.json({
      feeds: [
        {
          title: 'Example Blog',
          link: 'https://example.com/feed.xml',
          articles: [
            {
              title: 'Test Article',
              link: 'https://example.com/article1',
              pubDate: '2025-10-29T10:00:00Z',
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

describe('フィード登録時のタイトル保存', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('フィード登録時にタイトルを取得してlocalStorageに保存する', async () => {
    render(<App />)

    // フィード登録UIを探す
    const input = screen.getByPlaceholderText(/RSS/)
    const addButton = screen.getByRole('button', { name: /追加|登録/ })

    // フィードURLを入力して登録
    await userEvent.type(input, 'https://example.com/feed.xml')
    await userEvent.click(addButton)

    // タイトルが表示されることを待つ
    await waitFor(
      () => {
        expect(screen.getByText('Example Blog')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // localStorageに保存されていることを確認
    const stored = localStorage.getItem('rss_reader_subscriptions')
    expect(stored).toBeTruthy()

    const parsed = JSON.parse(stored!)
    expect(parsed.subscriptions).toHaveLength(1)
    expect(parsed.subscriptions[0].title).toBe('Example Blog')
    expect(parsed.subscriptions[0].url).toBe('https://example.com/feed.xml')
  })

  it('アプリをリロードしたときに保存されたタイトルが表示される', async () => {
    // 事前にlocalStorageにデータを保存
    const subscription = {
      id: 'test-id-1',
      url: 'https://example.com/feed.xml',
      title: 'Saved Blog Title',
      customTitle: null,
      subscribedAt: '2025-10-29T10:00:00Z',
      lastFetchedAt: '2025-10-29T10:00:05Z',
      status: 'active',
    }
    localStorage.setItem(
      'rss_reader_subscriptions',
      JSON.stringify({ subscriptions: [subscription] })
    )

    render(<App />)

    // 保存されたタイトルがすぐに表示されることを確認（APIリクエストなし）
    await waitFor(
      () => {
        expect(screen.getByText('Saved Blog Title')).toBeInTheDocument()
      },
      { timeout: 500 } // 100ms以内を想定しているが、余裕を持って500ms
    )
  })

  it('タイトル取得に失敗した場合はURLをタイトルとして使用する', async () => {
    // APIエラーをシミュレート
    server.use(
      http.post(`${API_BASE_URL}/api/parse`, () => {
        return HttpResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        )
      })
    )

    render(<App />)

    const input = screen.getByPlaceholderText(/RSS/)
    const addButton = screen.getByRole('button', { name: /追加|登録/ })

    await userEvent.type(input, 'https://example.com/feed.xml')
    await userEvent.click(addButton)

    // フォールバックとしてURLが表示されることを確認
    await waitFor(
      () => {
        const stored = localStorage.getItem('rss_reader_subscriptions')
        if (!stored) return false
        const parsed = JSON.parse(stored)
        return parsed.subscriptions[0]?.title === 'https://example.com/feed.xml'
      },
      { timeout: 3000 }
    )

    const stored = localStorage.getItem('rss_reader_subscriptions')!
    const parsed = JSON.parse(stored)
    expect(parsed.subscriptions[0].title).toBe('https://example.com/feed.xml')
  })
})