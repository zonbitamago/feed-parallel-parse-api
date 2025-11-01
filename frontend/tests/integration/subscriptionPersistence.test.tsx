import { describe, it, expect, beforeEach, beforeAll, afterAll, afterEach as afterEachTest } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import App from '../../src/App'

const API_BASE_URL = 'https://feed-parallel-parse-api.vercel.app'

// MSWサーバーのセットアップ
const server = setupServer(
  http.post(`${API_BASE_URL}/api/parse`, async ({ request }) => {
    const body = await request.json() as { urls: string[] }
    const feeds = body.urls.map(url => {
      // URLに基づいて異なるタイトルを返す
      if (url.includes('rss1')) {
        return { title: 'Feed 1', link: url, feedUrl: url, articles: [] }
      } else if (url.includes('rss2')) {
        return { title: 'Feed 2', link: url, feedUrl: url, articles: [] }
      } else {
        return { title: 'Test Feed', link: url, feedUrl: url, articles: [] }
      }
    })

    return HttpResponse.json({
      feeds,
      errors: [],
    })
  })
)

beforeAll(() => server.listen())
afterEachTest(() => server.resetHandlers())
afterAll(() => server.close())

describe('Subscription Persistence Integration', () => {
  beforeEach(() => {
    // 各テスト前にlocalStorageをクリア
    localStorage.clear()
    // 購読リストをデフォルトで展開状態にする
    localStorage.setItem('rss_reader_subscriptions_collapsed', 'false')
  })

  it('購読をlocalStorageに永続化する', async () => {
    // 準備
    const user = userEvent.setup()
    render(<App />)

    // 実行: フィードを追加
    const input = screen.getByPlaceholderText(/URL/i)
    await user.type(input, 'https://example.com/rss')
    const addButton = screen.getByRole('button', { name: /追加/i })
    await user.click(addButton)

    // タイトル取得を待つ
    await waitFor(() => {
      const stored = localStorage.getItem('rss_reader_subscriptions')
      expect(stored).toBeTruthy()
    }, { timeout: 3000 })

    // 検証: localStorageに保存されていることを確認
    const stored = localStorage.getItem('rss_reader_subscriptions')!
    const parsed = JSON.parse(stored)
    expect(parsed.subscriptions).toHaveLength(1)
    expect(parsed.subscriptions[0].url).toBe('https://example.com/rss')
    expect(parsed.subscriptions[0].title).toBe('Test Feed')
  })

  it('マウント時にlocalStorageから購読を読み込む', () => {
    // 準備: localStorageに購読データを事前設定
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

    // 実行: アプリをレンダリング
    render(<App />)

    // 検証: ウェルカム画面が表示されず、購読数が表示される
    expect(screen.queryByText(/ウェルカム/i)).not.toBeInTheDocument()
    expect(screen.getByText(/購読中.*1.*1/)).toBeInTheDocument()
  })

  it('購読の削除と永続化を処理する', async () => {
    // 準備
    const user = userEvent.setup()
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
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('Feed 1')).toBeInTheDocument()
      expect(screen.getByText('Feed 2')).toBeInTheDocument()
    })

    // 実行: 1つ目のフィードを削除
    const deleteButtons = screen.getAllByRole('button', { name: /削除/i })
    await user.click(deleteButtons[0])

    // 検証: localStorageが更新されていることを確認
    await waitFor(() => {
      const stored = localStorage.getItem('rss_reader_subscriptions')
      const parsed = JSON.parse(stored!)
      expect(parsed.subscriptions).toHaveLength(1)
      expect(parsed.subscriptions[0].title).toBe('Feed 2')
    })
  })
})
