import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import App from '../../src/App'

const server = setupServer(
  http.post('*/api/parse', () => {
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

describe('Feed Flow Integration', () => {
  it('フィードフロー全体を完了する: フィード追加 → 取得 → 記事表示', async () => {
    const user = userEvent.setup()
    render(<App />)

    // 初期表示でウェルカム画面が表示される
    expect(screen.getByText(/ウェルカム/i)).toBeInTheDocument()

    // フィードURLを追加
    const input = screen.getByPlaceholderText(/URL/i)
    await user.type(input, 'https://example.com/rss')

    const addButton = screen.getByRole('button', { name: /追加/i })
    await user.click(addButton)

    // 記事の読み込みを待つ
    await waitFor(() => {
      expect(screen.getByText('Test Article')).toBeInTheDocument()
    }, { timeout: 3000 })

    // 記事がクリック可能であることを確認
    const articleLink = screen.getByRole('link', { name: /Test Article/i })
    expect(articleLink).toHaveAttribute('href', 'https://example.com/article')
  })
})
