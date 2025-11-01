import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import App from '../../src/App'

/**
 * フィードタイトルの自動取得と表示
 *
 * 統合テスト:
 * - フィード追加からタイトル表示までの確認
 * - リロード後の永続化確認
 * - HTMLエンティティを含むタイトルの処理確認
 */

const server = setupServer(
  http.post('*/api/parse', async ({ request }) => {
    const body = await request.json() as { urls: string[] }

    // URLに基づいて適切なレスポンスを返す
    const feeds = body.urls.map(url => {
      if (url.includes('example.com/feed')) {
        return {
          title: 'Tech News Blog',
          link: url,
          feedUrl: url,
          articles: [
            {
              title: 'Breaking News',
              link: 'https://example.com/article1',
              pubDate: '2025-01-15T10:00:00Z',
              summary: 'Latest tech news',
            },
          ],
        }
      }
      return {
        title: 'Unknown Feed',
        link: url,
        feedUrl: url,
        articles: [],
      }
    })

    return HttpResponse.json({
      feeds,
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
  beforeEach(() => {
    // 購読リストをデフォルトで展開状態にする
    localStorage.setItem('rss_reader_subscriptions_collapsed', 'false')
  })

  it('フィード追加時にタイトルが自動取得され表示される', async () => {
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

    // 検証: 記事も表示される（記事取得は非同期で少し遅れる）
    await waitFor(() => {
      expect(screen.getByText('Breaking News')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('リロード後もフィードタイトルが永続化されている', async () => {
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

  it('HTMLエンティティを含むタイトルが正しく処理される', async () => {
    // 準備: HTMLエンティティを含むレスポンスをモック
    server.use(
      http.post('*/api/parse', () => {
        return HttpResponse.json({
          feeds: [
            {
              title: 'Tech &amp; News &lt;Blog&gt;',
              link: 'https://example.com/feed',
              feedUrl: 'https://example.com/feed',
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
                feedUrl: 'https://first.com/feed',
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
                feedUrl: 'https://first.com/feed',
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
                feedUrl: 'https://second.com/feed',
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

/**
 * フィード表示名の手動編集
 *
 * 統合テスト:
 * - カスタムタイトル編集の完全なフロー
 * - 空文字バリデーションエラー
 * - キャンセル操作
 */
describe('Custom Title Edit Flow Integration', () => {
  beforeEach(() => {
    // 購読リストをデフォルトで展開状態にする
    localStorage.setItem('rss_reader_subscriptions_collapsed', 'false')
  })

  it('カスタムタイトルを編集→保存→表示確認の完全なフロー', async () => {
    // 準備: フィードを追加
    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByPlaceholderText(/RSSフィードのURLを入力/i)
    await user.type(input, 'https://example.com/feed')
    const addButton = screen.getByRole('button', { name: /追加/i })
    await user.click(addButton)

    // フィードタイトルが取得されるまで待機
    await waitFor(() => {
      const titles = screen.getAllByText('Tech News Blog')
      expect(titles.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 3000 })

    // 実行: 編集ボタンをクリック
    const editButton = screen.getByRole('button', { name: /編集/i })
    await user.click(editButton)

    // 検証: 編集モードに切り替わる
    const editInput = screen.getByDisplayValue('Tech News Blog')
    expect(editInput).toBeInTheDocument()
    expect(editInput).toHaveFocus()

    // 実行: カスタムタイトルを入力
    await user.clear(editInput)
    await user.type(editInput, 'My Custom Tech Blog')

    // 実行: 保存ボタンをクリック
    const saveButton = screen.getByRole('button', { name: /保存/i })
    await user.click(saveButton)

    // 検証: カスタムタイトルが表示される
    await waitFor(() => {
      const customTitles = screen.getAllByText('My Custom Tech Blog')
      expect(customTitles.length).toBeGreaterThanOrEqual(1)
    })

    // 検証: 元のタイトルは表示されない（購読リスト内で）
    const originalTitles = screen.queryAllByText('Tech News Blog')
    // 記事一覧にはfeedTitleとして元のタイトルが残る可能性があるため、
    // 購読リスト内では表示されないことを確認
    expect(originalTitles.length).toBeLessThan(2)

    // 検証: 編集モードが終了している
    expect(screen.queryByDisplayValue('My Custom Tech Blog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /編集/i })).toBeInTheDocument()
  })

  it('空文字で保存しようとするとバリデーションエラーが表示される', async () => {
    // 準備: フィードを追加
    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByPlaceholderText(/RSSフィードのURLを入力/i)
    await user.type(input, 'https://example.com/feed')
    const addButton = screen.getByRole('button', { name: /追加/i })
    await user.click(addButton)

    await waitFor(() => {
      const titles = screen.getAllByText('Tech News Blog')
      expect(titles.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 3000 })

    // 実行: 編集モードに入る
    const editButton = screen.getByRole('button', { name: /編集/i })
    await user.click(editButton)

    const editInput = screen.getByDisplayValue('Tech News Blog')

    // 実行: 空文字にして保存
    await user.clear(editInput)
    const saveButton = screen.getByRole('button', { name: /保存/i })
    await user.click(saveButton)

    // 検証: バリデーションエラーが表示される
    await waitFor(() => {
      expect(screen.getByText(/フィード名を入力してください/i)).toBeInTheDocument()
    })

    // 検証: 編集モードのまま（保存されない）
    expect(editInput).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /保存/i })).toBeInTheDocument()

    // 検証: 元のタイトルは変更されていない
    expect(screen.getAllByText('Tech News Blog').length).toBeGreaterThanOrEqual(1)
  })

  it('キャンセルボタンで編集を中止できる', async () => {
    // 準備: フィードを追加
    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByPlaceholderText(/RSSフィードのURLを入力/i)
    await user.type(input, 'https://example.com/feed')
    const addButton = screen.getByRole('button', { name: /追加/i })
    await user.click(addButton)

    await waitFor(() => {
      const titles = screen.getAllByText('Tech News Blog')
      expect(titles.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 3000 })

    // 実行: 編集モードに入る
    const editButton = screen.getByRole('button', { name: /編集/i })
    await user.click(editButton)

    const editInput = screen.getByDisplayValue('Tech News Blog')

    // 実行: タイトルを変更（保存しない）
    await user.clear(editInput)
    await user.type(editInput, 'This Should Not Be Saved')

    // 実行: キャンセルボタンをクリック
    const cancelButton = screen.getByRole('button', { name: /キャンセル/i })
    await user.click(cancelButton)

    // 検証: 編集モードが終了している
    expect(screen.queryByDisplayValue('This Should Not Be Saved')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /編集/i })).toBeInTheDocument()

    // 検証: 元のタイトルがそのまま表示される
    await waitFor(() => {
      const originalTitles = screen.getAllByText('Tech News Blog')
      expect(originalTitles.length).toBeGreaterThanOrEqual(1)
    })

    // 検証: 変更したタイトルは表示されない
    expect(screen.queryByText('This Should Not Be Saved')).not.toBeInTheDocument()
  })

  it('Escapeキーで編集を中止できる', async () => {
    // 準備: フィードを追加
    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByPlaceholderText(/RSSフィードのURLを入力/i)
    await user.type(input, 'https://example.com/feed')
    const addButton = screen.getByRole('button', { name: /追加/i })
    await user.click(addButton)

    await waitFor(() => {
      const titles = screen.getAllByText('Tech News Blog')
      expect(titles.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 3000 })

    // 実行: 編集モードに入る
    const editButton = screen.getByRole('button', { name: /編集/i })
    await user.click(editButton)

    const editInput = screen.getByDisplayValue('Tech News Blog')

    // 実行: タイトルを変更してEscapeキーを押す
    await user.clear(editInput)
    await user.type(editInput, 'This Should Not Be Saved{Escape}')

    // 検証: 編集モードが終了している
    await waitFor(() => {
      expect(screen.queryByDisplayValue('This Should Not Be Saved')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /編集/i })).toBeInTheDocument()

    // 検証: 元のタイトルがそのまま表示される
    const originalTitles = screen.getAllByText('Tech News Blog')
    expect(originalTitles.length).toBeGreaterThanOrEqual(1)
  })

  it('カスタムタイトルがリロード後も永続化される', async () => {
    // 準備: フィードを追加してカスタムタイトルを設定
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    const input = screen.getByPlaceholderText(/RSSフィードのURLを入力/i)
    await user.type(input, 'https://example.com/feed')
    const addButton = screen.getByRole('button', { name: /追加/i })
    await user.click(addButton)

    await waitFor(() => {
      const titles = screen.getAllByText('Tech News Blog')
      expect(titles.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 3000 })

    // カスタムタイトルを設定
    const editButton = screen.getByRole('button', { name: /編集/i })
    await user.click(editButton)

    const editInput = screen.getByDisplayValue('Tech News Blog')
    await user.clear(editInput)
    await user.type(editInput, 'My Persistent Custom Title')

    const saveButton = screen.getByRole('button', { name: /保存/i })
    await user.click(saveButton)

    await waitFor(() => {
      const customTitles = screen.getAllByText('My Persistent Custom Title')
      expect(customTitles.length).toBeGreaterThanOrEqual(1)
    })

    // 実行: アプリをアンマウント（リロードをシミュレート）
    unmount()

    // 再レンダリング
    render(<App />)

    // 検証: カスタムタイトルがlocalStorageから読み込まれて即座に表示される
    await waitFor(() => {
      const persistedTitles = screen.getAllByText('My Persistent Custom Title')
      expect(persistedTitles.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 3000 })

    // 検証: 元のタイトルは表示されない
    const originalTitles = screen.queryAllByText('Tech News Blog')
    expect(originalTitles.length).toBeLessThan(2)
  })
})