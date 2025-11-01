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
          link: 'https://example.com/rss',
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
  beforeEach(() => {
    // 購読リストをデフォルトで展開状態にする
    localStorage.setItem('rss_reader_subscriptions_collapsed', 'false')
  })

  it('フィードフロー全体を完了する: フィード追加 → 取得 → 記事表示', async () => {
    // 準備
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText(/ウェルカム/i)).toBeInTheDocument()

    // 実行: フィードURLを追加
    const input = screen.getByPlaceholderText(/URL/i)
    await user.type(input, 'https://example.com/rss')
    const addButton = screen.getByRole('button', { name: /追加/i })
    await user.click(addButton)

    // 検証: 記事の読み込みを待つ
    await waitFor(() => {
      expect(screen.getByText('Test Article')).toBeInTheDocument()
    }, { timeout: 3000 })

    // 検証: 記事がクリック可能であることを確認
    const articleLink = screen.getByRole('link', { name: /Test Article/i })
    expect(articleLink).toHaveAttribute('href', 'https://example.com/article')
  })

  it('タイトル更新時にフィード取得が発生しない', async () => {
    // テスト用のリクエストカウンター
    let requestCount = 0

    // APIリクエストをカウントするハンドラーを設定
    server.use(
      http.post('*/api/parse', () => {
        requestCount++
        return HttpResponse.json({
          feeds: [
            {
              title: 'Original Feed Title',
              link: 'https://example.com/rss',
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
    render(<App />)

    // フィードを追加
    const input = screen.getByPlaceholderText(/URL/i)
    await user.type(input, 'https://example.com/rss')
    const addButton = screen.getByRole('button', { name: /追加/i })
    await user.click(addButton)

    // 記事の読み込みを待つ
    await waitFor(() => {
      expect(screen.getByText('Test Article')).toBeInTheDocument()
    }, { timeout: 3000 })

    // 初回のリクエスト回数を記録（フィード追加時の回数）
    const initialRequestCount = requestCount
    expect(initialRequestCount).toBeGreaterThan(0)

    // カスタムタイトルを編集（タイトル更新をトリガー）
    const editButton = screen.getByLabelText(/編集/)
    await user.click(editButton)

    const titleInput = screen.getByDisplayValue('Original Feed Title')
    await user.clear(titleInput)
    await user.type(titleInput, 'Custom Title')

    const saveButton = screen.getByLabelText(/保存/)
    await user.click(saveButton)

    // タイトル更新後、少し待機
    await waitFor(() => {
      expect(screen.getByText('Custom Title')).toBeInTheDocument()
    }, { timeout: 1000 })

    // 検証: タイトル更新時にフィード取得が発生していないこと
    // リクエスト回数は初回の1回のままであるべき
    expect(requestCount).toBe(initialRequestCount)
  })

  it('フィードが0件の状態でページをリロードした場合、不要なAPIリクエストが発生しない', async () => {
    // テスト用のリクエストカウンター
    let requestCount = 0

    // APIリクエストをカウントするハンドラーを設定
    server.use(
      http.post('*/api/parse', () => {
        requestCount++
        return HttpResponse.json({
          feeds: [],
          errors: [],
        })
      })
    )

    // 準備: localStorageが空の状態でアプリをレンダリング
    localStorage.clear()
    render(<App />)

    // ウェルカム画面が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText(/ウェルカム/i)).toBeInTheDocument()
    }, { timeout: 1000 })

    // 検証: APIリクエストが発生していないこと
    expect(requestCount).toBe(0)
  })

  it('フィード削除時に削除されたフィードへのリクエストが発生しない', async () => {
    // テスト用のリクエストカウンター
    let requestCount = 0

    // APIリクエストをカウントするハンドラーを設定
    server.use(
      http.post('*/api/parse', () => {
        requestCount++
        return HttpResponse.json({
          feeds: [
            {
              title: 'Test Feed',
              link: 'https://example.com/rss',
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
    render(<App />)

    // フィードを追加
    const input = screen.getByPlaceholderText(/URL/i)
    await user.type(input, 'https://example.com/rss')
    const addButton = screen.getByRole('button', { name: /追加/i })
    await user.click(addButton)

    // 記事の読み込みを待つ
    await waitFor(() => {
      expect(screen.getByText('Test Article')).toBeInTheDocument()
    }, { timeout: 3000 })

    // リクエスト回数を記録
    const countBeforeDelete = requestCount
    expect(countBeforeDelete).toBeGreaterThan(0)

    // フィードを削除
    const deleteButton = screen.getByLabelText(/削除/)
    await user.click(deleteButton)

    // ウェルカム画面が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText(/ウェルカム/i)).toBeInTheDocument()
    }, { timeout: 1000 })

    // 検証: 削除後に新たなAPIリクエストが発生していないこと
    expect(requestCount).toBe(countBeforeDelete)
  })
})
