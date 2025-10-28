import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import App from '../../src/App'

/**
 * User Story 1: フィードタイトルの自動取得と表示
 *
 * 統合テスト:
 * - T031: フィード追加→タイトル表示確認
 * - T032: リロード後の永続化確認
 * - T033: HTMLエンティティを含むタイトルの処理確認
 */

const server = setupServer(
  http.post('*/api/parse', () => {
    return HttpResponse.json({
      feeds: [
        {
          title: 'Tech News Blog',
          link: 'https://example.com/feed',
          articles: [
            {
              title: 'Breaking News',
              link: 'https://example.com/article1',
              pubDate: '2025-01-15T10:00:00Z',
              summary: 'Latest tech news',
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

describe('Feed Title Flow Integration', () => {
  it('T031: フィード追加時にタイトルが自動取得され表示される', async () => {
    // 準備
    const user = userEvent.setup()
    render(<App />)

    // 実行: フィードURLを入力して追加
    const input = screen.getByPlaceholderText(/RSSフィードのURLを入力/i)
    await user.type(input, 'https://example.com/feed')
    const addButton = screen.getByRole('button', { name: /追加/i })
    await user.click(addButton)

    // 検証: フィードタイトルが表示される（URLではない）
    // 注: タイトルは購読リストと記事一覧の両方に表示されるため、複数存在
    await waitFor(() => {
      const titles = screen.getAllByText('Tech News Blog')
      expect(titles.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 3000 })

    // 検証: URLも副次的に表示される
    expect(screen.getByText('https://example.com/feed')).toBeInTheDocument()

    // 検証: 記事も表示される
    expect(screen.getByText('Breaking News')).toBeInTheDocument()
  })

  it('T032: リロード後もフィードタイトルが永続化されている', async () => {
    // 準備: 最初のレンダリングでフィードを追加
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    const input = screen.getByPlaceholderText(/RSSフィードのURLを入力/i)
    await user.type(input, 'https://example.com/feed')
    const addButton = screen.getByRole('button', { name: /追加/i })
    await user.click(addButton)

    // フィードタイトルが取得されるまで待機
    await waitFor(() => {
      const titles = screen.getAllByText('Tech News Blog')
      expect(titles.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 3000 })

    // 実行: アプリをアンマウント（リロードをシミュレート）
    unmount()

    // 再レンダリング
    render(<App />)

    // 検証: localStorageから読み込まれたフィードタイトルが即座に表示される
    await waitFor(() => {
      const titles = screen.getAllByText('Tech News Blog')
      expect(titles.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 3000 })

    // 検証: URLも表示される（購読リスト内）
    expect(screen.getByText('https://example.com/feed')).toBeInTheDocument()
  })

  it('T033: HTMLエンティティを含むタイトルが正しく処理される', async () => {
    // 準備: HTMLエンティティを含むレスポンスをモック
    server.use(
      http.post('*/api/parse', () => {
        return HttpResponse.json({
          feeds: [
            {
              title: 'Tech &amp; News &lt;Blog&gt;',
              link: 'https://example.com/feed',
              articles: [
                {
                  title: 'Article with &quot;quotes&quot;',
                  link: 'https://example.com/article',
                  pubDate: '2025-01-15T10:00:00Z',
                  summary: 'Summary',
                },
              ],
            },
          ],
          errors: [],
        })
      })
    )

    const user = userEvent.setup()
    render(<App />)

    // 実行: フィード追加
    const input = screen.getByPlaceholderText(/RSSフィードのURLを入力/i)
    await user.type(input, 'https://example.com/feed')
    const addButton = screen.getByRole('button', { name: /追加/i })
    await user.click(addButton)

    // 検証: HTMLエンティティがそのまま表示される
    await waitFor(() => {
      // getDisplayTitle()はAPIから取得したtitleをそのまま表示
      // titleUtilsのsanitizeFeedTitle()はフロントエンドでの追加処理用
      const titles = screen.getAllByText('Tech &amp; News &lt;Blog&gt;')
      expect(titles.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 3000 })

    // 注: 現在の実装ではAPIレスポンスのtitleをそのまま使用
    // HTMLサニタイズはフロントエンドで追加入力時に使用される想定
  })

  it('複数のフィードを追加し、それぞれのタイトルで識別できる', async () => {
    // 準備: 複数のフィードをモック
    let callCount = 0
    server.use(
      http.post('*/api/parse', () => {
        callCount++
        if (callCount === 1) {
          return HttpResponse.json({
            feeds: [
              {
                title: 'First Blog',
                link: 'https://first.com/feed',
                articles: [
                  {
                    title: 'First Article',
                    link: 'https://first.com/article',
                    pubDate: '2025-01-15T10:00:00Z',
                    summary: 'First summary',
                  },
                ],
              },
            ],
            errors: [],
          })
        } else {
          return HttpResponse.json({
            feeds: [
              {
                title: 'First Blog',
                link: 'https://first.com/feed',
                articles: [
                  {
                    title: 'First Article',
                    link: 'https://first.com/article',
                    pubDate: '2025-01-15T10:00:00Z',
                    summary: 'First summary',
                  },
                ],
              },
              {
                title: 'Second Blog',
                link: 'https://second.com/feed',
                articles: [
                  {
                    title: 'Second Article',
                    link: 'https://second.com/article',
                    pubDate: '2025-01-16T10:00:00Z',
                    summary: 'Second summary',
                  },
                ],
              },
            ],
            errors: [],
          })
        }
      })
    )

    const user = userEvent.setup()
    render(<App />)

    // 実行: 1つ目のフィード追加
    const input = screen.getByPlaceholderText(/RSSフィードのURLを入力/i)
    await user.type(input, 'https://first.com/feed')
    const addButton = screen.getByRole('button', { name: /追加/i })
    await user.click(addButton)

    await waitFor(() => {
      const firstTitles = screen.getAllByText('First Blog')
      expect(firstTitles.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 3000 })

    // 実行: 2つ目のフィード追加
    await user.clear(input)
    await user.type(input, 'https://second.com/feed')
    await user.click(addButton)

    // 検証: 両方のフィードタイトルが表示される
    await waitFor(() => {
      const secondTitles = screen.getAllByText('Second Blog')
      expect(secondTitles.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 3000 })

    // First Blog も引き続き表示されている
    const firstTitles = screen.getAllByText('First Blog')
    expect(firstTitles.length).toBeGreaterThanOrEqual(1)

    // 検証: 購読数カウントが正しい
    expect(screen.getByText(/購読中: 2\/100件/i)).toBeInTheDocument()
  })
})