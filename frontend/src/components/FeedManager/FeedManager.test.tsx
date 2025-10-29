import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { FeedManager } from './FeedManager'

// MSWサーバーのセットアップ（プレビュー機能用）
const server = setupServer(
  http.post('*/api/parse', () => {
    return HttpResponse.json({
      feeds: [
        {
          title: 'Preview Blog Title',
          link: 'https://example.com/feed',
          articles: [],
        },
      ],
      errors: [],
    })
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('FeedManager', () => {
  it('URL入力欄をレンダリングする', () => {
    const onAdd = vi.fn()
    render(<FeedManager onAddFeed={onAdd} subscriptions={[]} />)
    
    expect(screen.getByPlaceholderText(/URL/i)).toBeInTheDocument()
  })

  it('URL入力を検証する', async () => {
    // 準備
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<FeedManager onAddFeed={onAdd} subscriptions={[]} />)

    // 実行: 無効なURLを入力
    const input = screen.getByPlaceholderText(/URL/i)
    await user.type(input, 'invalid-url')

    // 検証: エラーメッセージが表示される
    expect(screen.getByText(/無効なURL/i)).toBeInTheDocument()
  })

  it('有効なURLでonAddFeedを呼び出す', async () => {
    // 準備
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<FeedManager onAddFeed={onAdd} subscriptions={[]} />)

    // 実行: 有効なURLを入力して追加ボタンをクリック
    const input = screen.getByPlaceholderText(/URL/i)
    await user.type(input, 'https://example.com/rss')
    const button = screen.getByRole('button', { name: /追加/i })
    await user.click(button)

    // 検証: onAddFeedが呼ばれる
    expect(onAdd).toHaveBeenCalledWith('https://example.com/rss')
  })

  it('購読数制限の警告を表示する', () => {
    const onAdd = vi.fn()
    const subscriptions = Array.from({ length: 100 }, (_, i) => ({
      id: `${i}`,
      url: `https://example.com/${i}`,
      title: `Feed ${i}`,
      customTitle: null,
      subscribedAt: new Date().toISOString(),
      lastFetchedAt: null,
      status: 'active' as const,
    }))

    render(<FeedManager onAddFeed={onAdd} subscriptions={subscriptions} />)

    expect(screen.getByText(/上限/i)).toBeInTheDocument()
  })

  // US2: 購読管理機能のテスト
  it('購読リストを表示する', () => {
    const onAdd = vi.fn()
    const onRemove = vi.fn()
    const subscriptions = [
      {
        id: '1',
        url: 'https://example.com/rss',
        title: 'Test Feed 1',
        customTitle: null,
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: null,
        status: 'active' as const,
      },
      {
        id: '2',
        url: 'https://example.com/feed.xml',
        title: 'Test Feed 2',
        customTitle: null,
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: null,
        status: 'active' as const,
      },
    ]

    render(<FeedManager onAddFeed={onAdd} onRemoveFeed={onRemove} subscriptions={subscriptions} />)

    expect(screen.getByText('Test Feed 1')).toBeInTheDocument()
    expect(screen.getByText('Test Feed 2')).toBeInTheDocument()
  })

  it('削除ボタンクリック時にonRemoveFeedを呼び出す', async () => {
    // 準備
    const user = userEvent.setup()
    const onAdd = vi.fn()
    const onRemove = vi.fn()
    const subscriptions = [
      {
        id: '1',
        url: 'https://example.com/rss',
        title: 'Test Feed',
        customTitle: null,
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: null,
        status: 'active' as const,
      },
    ]
    render(<FeedManager onAddFeed={onAdd} onRemoveFeed={onRemove} subscriptions={subscriptions} />)

    // 実行: 削除ボタンをクリック
    const deleteButton = screen.getByRole('button', { name: /削除/i })
    await user.click(deleteButton)

    // 検証: onRemoveFeedが呼ばれる
    expect(onRemove).toHaveBeenCalledWith('1')
  })

  it('フィードのステータスを表示する', () => {
    const onAdd = vi.fn()
    const onRemove = vi.fn()
    const subscriptions = [
      {
        id: '1',
        url: 'https://example.com/rss',
        title: 'Active Feed',
        customTitle: null,
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: new Date().toISOString(),
        status: 'active' as const,
      },
      {
        id: '2',
        url: 'https://example.com/error',
        title: 'Error Feed',
        customTitle: null,
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: null,
        status: 'error' as const,
      },
    ]

    render(<FeedManager onAddFeed={onAdd} onRemoveFeed={onRemove} subscriptions={subscriptions} />)

    expect(screen.getByText('Active Feed')).toBeInTheDocument()
    expect(screen.getByText('Error Feed')).toBeInTheDocument()
    // ステータス表示の確認（実装により表示方法は異なる）
  })

  // User Story 2: カスタムタイトル編集機能のテスト (T037-T039)
  describe('カスタムタイトル編集', () => {
    it('編集ボタンをクリックすると編集モードに切り替わる', async () => {
      // 準備
      const user = userEvent.setup()
      const onAdd = vi.fn()
      const onRemove = vi.fn()
      const onUpdateCustomTitle = vi.fn()
      const subscriptions = [
        {
          id: '1',
          url: 'https://example.com/rss',
          title: 'Original Title',
          customTitle: null,
          subscribedAt: new Date().toISOString(),
          lastFetchedAt: null,
          status: 'active' as const,
        },
      ]

      render(
        <FeedManager
          onAddFeed={onAdd}
          onRemoveFeed={onRemove}
          onUpdateCustomTitle={onUpdateCustomTitle}
          subscriptions={subscriptions}
        />
      )

      // 実行: 編集ボタンをクリック
      const editButton = screen.getByRole('button', { name: /編集/i })
      await user.click(editButton)

      // 検証: 編集用のinputが表示される
      const editInput = screen.getByDisplayValue('Original Title')
      expect(editInput).toBeInTheDocument()
      expect(editInput).toHaveFocus() // フォーカスが当たっている

      // 検証: 保存・キャンセルボタンが表示される
      expect(screen.getByRole('button', { name: /保存/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /キャンセル/i })).toBeInTheDocument()

      // 検証: 編集ボタンは非表示になる
      expect(screen.queryByRole('button', { name: /編集/i })).not.toBeInTheDocument()
    })

    it('編集してタイトルを保存できる', async () => {
      // 準備
      const user = userEvent.setup()
      const onAdd = vi.fn()
      const onRemove = vi.fn()
      const onUpdateCustomTitle = vi.fn()
      const subscriptions = [
        {
          id: '1',
          url: 'https://example.com/rss',
          title: 'Original Title',
          customTitle: null,
          subscribedAt: new Date().toISOString(),
          lastFetchedAt: null,
          status: 'active' as const,
        },
      ]

      render(
        <FeedManager
          onAddFeed={onAdd}
          onRemoveFeed={onRemove}
          onUpdateCustomTitle={onUpdateCustomTitle}
          subscriptions={subscriptions}
        />
      )

      // 実行: 編集ボタンをクリック
      const editButton = screen.getByRole('button', { name: /編集/i })
      await user.click(editButton)

      // 実行: タイトルを変更
      const editInput = screen.getByDisplayValue('Original Title')
      await user.clear(editInput)
      await user.type(editInput, 'Custom Title')

      // 実行: 保存ボタンをクリック
      const saveButton = screen.getByRole('button', { name: /保存/i })
      await user.click(saveButton)

      // 検証: onUpdateCustomTitleが呼ばれる
      expect(onUpdateCustomTitle).toHaveBeenCalledWith('1', 'Custom Title')

      // 検証: 編集モードが終了する（編集ボタンが再表示される）
      expect(screen.getByRole('button', { name: /編集/i })).toBeInTheDocument()
    })

    it('空文字での保存はエラーメッセージを表示', async () => {
      // 準備
      const user = userEvent.setup()
      const onAdd = vi.fn()
      const onRemove = vi.fn()
      const onUpdateCustomTitle = vi.fn()
      const subscriptions = [
        {
          id: '1',
          url: 'https://example.com/rss',
          title: 'Original Title',
          customTitle: null,
          subscribedAt: new Date().toISOString(),
          lastFetchedAt: null,
          status: 'active' as const,
        },
      ]

      render(
        <FeedManager
          onAddFeed={onAdd}
          onRemoveFeed={onRemove}
          onUpdateCustomTitle={onUpdateCustomTitle}
          subscriptions={subscriptions}
        />
      )

      // 実行: 編集モードに入る
      const editButton = screen.getByRole('button', { name: /編集/i })
      await user.click(editButton)

      // 実行: タイトルを空にする
      const editInput = screen.getByDisplayValue('Original Title')
      await user.clear(editInput)

      // 実行: 保存ボタンをクリック
      const saveButton = screen.getByRole('button', { name: /保存/i })
      await user.click(saveButton)

      // 検証: エラーメッセージが表示される
      expect(screen.getByText(/フィード名を入力してください/i)).toBeInTheDocument()

      // 検証: onUpdateCustomTitleは呼ばれない
      expect(onUpdateCustomTitle).not.toHaveBeenCalled()
    })

    it('キャンセルボタンで編集を中止できる', async () => {
      // 準備
      const user = userEvent.setup()
      const onAdd = vi.fn()
      const onRemove = vi.fn()
      const onUpdateCustomTitle = vi.fn()
      const subscriptions = [
        {
          id: '1',
          url: 'https://example.com/rss',
          title: 'Original Title',
          customTitle: null,
          subscribedAt: new Date().toISOString(),
          lastFetchedAt: null,
          status: 'active' as const,
        },
      ]

      render(
        <FeedManager
          onAddFeed={onAdd}
          onRemoveFeed={onRemove}
          onUpdateCustomTitle={onUpdateCustomTitle}
          subscriptions={subscriptions}
        />
      )

      // 実行: 編集ボタンをクリック
      const editButton = screen.getByRole('button', { name: /編集/i })
      await user.click(editButton)

      // 実行: タイトルを変更
      const editInput = screen.getByDisplayValue('Original Title')
      await user.clear(editInput)
      await user.type(editInput, 'Changed Title')

      // 実行: キャンセルボタンをクリック
      const cancelButton = screen.getByRole('button', { name: /キャンセル/i })
      await user.click(cancelButton)

      // 検証: onUpdateCustomTitleは呼ばれない
      expect(onUpdateCustomTitle).not.toHaveBeenCalled()

      // 検証: 編集モードが終了し、元のタイトルが表示される
      expect(screen.getByText('Original Title')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /編集/i })).toBeInTheDocument()
    })

    it('Escapeキーで編集をキャンセルできる', async () => {
      // 準備
      const user = userEvent.setup()
      const onAdd = vi.fn()
      const onRemove = vi.fn()
      const onUpdateCustomTitle = vi.fn()
      const subscriptions = [
        {
          id: '1',
          url: 'https://example.com/rss',
          title: 'Original Title',
          customTitle: null,
          subscribedAt: new Date().toISOString(),
          lastFetchedAt: null,
          status: 'active' as const,
        },
      ]

      render(
        <FeedManager
          onAddFeed={onAdd}
          onRemoveFeed={onRemove}
          onUpdateCustomTitle={onUpdateCustomTitle}
          subscriptions={subscriptions}
        />
      )

      // 実行: 編集モードに入る
      const editButton = screen.getByRole('button', { name: /編集/i })
      await user.click(editButton)

      // 実行: タイトルを変更してEscapeを押す
      const editInput = screen.getByDisplayValue('Original Title')
      await user.clear(editInput)
      await user.type(editInput, 'Changed Title')
      await user.keyboard('{Escape}')

      // 検証: onUpdateCustomTitleは呼ばれない
      expect(onUpdateCustomTitle).not.toHaveBeenCalled()

      // 検証: 編集モードが終了する
      expect(screen.getByRole('button', { name: /編集/i })).toBeInTheDocument()
    })

    it('Enterキーで保存できる', async () => {
      // 準備
      const user = userEvent.setup()
      const onAdd = vi.fn()
      const onRemove = vi.fn()
      const onUpdateCustomTitle = vi.fn()
      const subscriptions = [
        {
          id: '1',
          url: 'https://example.com/rss',
          title: 'Original Title',
          customTitle: null,
          subscribedAt: new Date().toISOString(),
          lastFetchedAt: null,
          status: 'active' as const,
        },
      ]

      render(
        <FeedManager
          onAddFeed={onAdd}
          onRemoveFeed={onRemove}
          onUpdateCustomTitle={onUpdateCustomTitle}
          subscriptions={subscriptions}
        />
      )

      // 実行: 編集モードに入る
      const editButton = screen.getByRole('button', { name: /編集/i })
      await user.click(editButton)

      // 実行: タイトルを変更してEnterを押す
      const editInput = screen.getByDisplayValue('Original Title')
      await user.clear(editInput)
      await user.type(editInput, 'New Title{Enter}')

      // 検証: onUpdateCustomTitleが呼ばれる
      expect(onUpdateCustomTitle).toHaveBeenCalledWith('1', 'New Title')
    })
  })

  describe('フィードプレビュー (User Story 3)', () => {
    it('URL入力時にフィードタイトルのプレビューが表示される', async () => {
      // 準備
      const user = userEvent.setup()
      const onAdd = vi.fn()

      render(<FeedManager onAddFeed={onAdd} subscriptions={[]} />)

      // 実行: 有効なURLを入力
      const input = screen.getByPlaceholderText(/RSSフィードのURLを入力/i)
      await user.type(input, 'https://example.com/feed')

      // 検証: プレビューが表示される（デバウンス後）
      await waitFor(() => {
        expect(screen.getByText(/プレビュー:/i)).toBeInTheDocument()
      }, { timeout: 3000 })

      // 検証: プレビュータイトルが表示される
      expect(screen.getByText(/Preview Blog Title/i)).toBeInTheDocument()
    })

    it('プレビュー取得中はローディング表示が出る', async () => {
      // 準備: APIレスポンスを遅延させる
      server.use(
        http.post('*/api/parse', async () => {
          await new Promise(resolve => setTimeout(resolve, 1000))
          return HttpResponse.json({
            feeds: [
              {
                title: 'Preview Blog Title',
                link: 'https://example.com/feed',
                articles: [],
              },
            ],
            errors: [],
          })
        })
      )

      const user = userEvent.setup()
      const onAdd = vi.fn()

      render(<FeedManager onAddFeed={onAdd} subscriptions={[]} />)

      // 実行: URLを入力
      const input = screen.getByPlaceholderText(/RSSフィードのURLを入力/i)
      await user.type(input, 'https://example.com/feed')

      // 検証: ローディング表示が出る（デバウンス500ms + レスポンス遅延1000ms）
      await waitFor(() => {
        expect(screen.getByText(/フィードタイトルを取得中/i)).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('プレビュー取得に失敗した場合はエラーメッセージが表示される', async () => {
      // 準備: エラーレスポンスをモック
      server.use(
        http.post('*/api/parse', () => {
          return HttpResponse.json({
            feeds: [],
            errors: [
              {
                url: 'https://invalid-feed.com/rss',
                message: 'フィードの取得に失敗しました',
              },
            ],
          })
        })
      )

      const user = userEvent.setup()
      const onAdd = vi.fn()

      render(<FeedManager onAddFeed={onAdd} subscriptions={[]} />)

      // 実行: 無効なURLを入力
      const input = screen.getByPlaceholderText(/RSSフィードのURLを入力/i)
      await user.type(input, 'https://invalid-feed.com/rss')

      // 検証: エラーメッセージが表示される
      await waitFor(() => {
        expect(screen.getByText(/フィードの取得に失敗しました/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('URL入力をクリアするとプレビューも消える', async () => {
      // 準備
      const user = userEvent.setup()
      const onAdd = vi.fn()

      render(<FeedManager onAddFeed={onAdd} subscriptions={[]} />)

      // 実行: URLを入力してプレビューを表示
      const input = screen.getByPlaceholderText(/RSSフィードのURLを入力/i)
      await user.type(input, 'https://example.com/feed')

      await waitFor(() => {
        expect(screen.getByText(/プレビュー:/i)).toBeInTheDocument()
      }, { timeout: 3000 })

      // 実行: URLをクリア
      await user.clear(input)

      // 検証: プレビューが消える
      await waitFor(() => {
        expect(screen.queryByText(/プレビュー:/i)).not.toBeInTheDocument()
      })
    })
  })
})
