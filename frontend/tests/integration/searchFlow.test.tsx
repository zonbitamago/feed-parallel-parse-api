import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import App from '../../src/App'

const server = setupServer(
  http.post('*/api/parse', async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
    return HttpResponse.json({
      feeds: [
        {
          title: 'Tech Blog',
          link: 'https://example.com',
          articles: [
            {
              title: 'React Tutorial',
              link: 'https://example.com/react',
              pubDate: '2025-01-01T10:00:00Z',
              summary: 'Learn React basics',
            },
            {
              title: 'Vue Guide',
              link: 'https://example.com/vue',
              pubDate: '2025-01-02T10:00:00Z',
              summary: 'Learn Vue framework',
            },
            {
              title: 'TypeScript Tips',
              link: 'https://example.com/typescript',
              pubDate: '2025-01-03T10:00:00Z',
              summary: 'TypeScript best practices',
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

describe('Search Flow Integration', () => {
  it('検索クエリで記事をフィルタリングする', async () => {
    // 準備
    const user = userEvent.setup()
    localStorage.setItem('rss_reader_subscriptions', JSON.stringify({
      subscriptions: [{
        id: '1',
        url: 'https://example.com/rss',
        title: 'Tech Blog',
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: null,
        status: 'active',
      }]
    }))
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('React Tutorial')).toBeInTheDocument()
      expect(screen.getByText('Vue Guide')).toBeInTheDocument()
      expect(screen.getByText('TypeScript Tips')).toBeInTheDocument()
    }, { timeout: 3000 })

    // 実行: 検索入力
    const searchInput = screen.getByPlaceholderText(/検索/i)
    await user.type(searchInput, 'react')

    // 検証: フィルタリング結果を確認
    await waitFor(() => {
      expect(screen.getByText('React Tutorial')).toBeInTheDocument()
      expect(screen.queryByText('Vue Guide')).not.toBeInTheDocument()
      expect(screen.queryByText('TypeScript Tips')).not.toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('検索をクリアして全記事を表示する', async () => {
    // 準備
    const user = userEvent.setup()
    localStorage.setItem('rss_reader_subscriptions', JSON.stringify({
      subscriptions: [{
        id: '1',
        url: 'https://example.com/rss',
        title: 'Tech Blog',
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: null,
        status: 'active',
      }]
    }))
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('React Tutorial')).toBeInTheDocument()
    }, { timeout: 3000 })
    const searchInput = screen.getByPlaceholderText(/検索/i)
    await user.type(searchInput, 'typescript')
    await waitFor(() => {
      expect(screen.getByText('TypeScript Tips')).toBeInTheDocument()
      expect(screen.queryByText('React Tutorial')).not.toBeInTheDocument()
    }, { timeout: 500 })

    // 実行: クリアボタンをクリック
    const clearButton = await screen.findByRole('button', { name: /クリア/i })
    await user.click(clearButton)

    // 検証: 全記事が再表示される
    await waitFor(() => {
      expect(screen.getByText('React Tutorial')).toBeInTheDocument()
      expect(screen.getByText('Vue Guide')).toBeInTheDocument()
      expect(screen.getByText('TypeScript Tips')).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('タイトルと要約の両方を検索する', async () => {
    // 準備
    const user = userEvent.setup()
    localStorage.setItem('rss_reader_subscriptions', JSON.stringify({
      subscriptions: [{
        id: '1',
        url: 'https://example.com/rss',
        title: 'Tech Blog',
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: null,
        status: 'active',
      }]
    }))
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('React Tutorial')).toBeInTheDocument()
    }, { timeout: 3000 })

    // 実行: summaryに含まれるキーワードで検索
    const searchInput = screen.getByPlaceholderText(/検索/i)
    await user.type(searchInput, 'framework')

    // 検証: Vue Guideのみ表示される
    await waitFor(() => {
      expect(screen.getByText('Vue Guide')).toBeInTheDocument()
      expect(screen.queryByText('React Tutorial')).not.toBeInTheDocument()
      expect(screen.queryByText('TypeScript Tips')).not.toBeInTheDocument()
    }, { timeout: 500 })
  })
})
