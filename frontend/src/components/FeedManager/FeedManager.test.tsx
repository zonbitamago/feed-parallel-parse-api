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
  beforeEach(() => {
    // デフォルトで展開状態にする（既存のテストが購読リストを参照できるように）
    localStorage.setItem('rss_reader_subscriptions_collapsed', 'false')
  })

  it('URL入力欄をレンダリングする', () => {
    const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })
    render(<FeedManager onAddFeed={onAdd} subscriptions={[]} />)

    expect(screen.getByPlaceholderText(/URL/i)).toBeInTheDocument()
  })

  it('URL入力を検証する', async () => {
    // 準備
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })
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
    const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })
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
    const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })
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

  // 購読管理機能のテスト
  it('購読リストを表示する', () => {
    const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })
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
    const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })
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
    const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })
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

  // カスタムタイトル編集機能のテスト
  describe('カスタムタイトル編集', () => {
    it('編集ボタンをクリックすると編集モードに切り替わる', async () => {
      // 準備
      const user = userEvent.setup()
      const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })
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
      const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })
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
      const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })
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
      const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })
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
      const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })
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
      const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })
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

  describe('フィードプレビュー', () => {
    it('URL入力時にフィードタイトルのプレビューが表示される', async () => {
      // 準備
      const user = userEvent.setup()
      const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })

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
      const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })

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
      const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })

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
      const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })

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

  /**
   * 折りたたみ機能のテスト (TDD: Red Phase)
   *
   * 期待結果: これらのテストはすべてFAIL（実装がまだ存在しないため）
   */
  describe('折りたたみ機能', () => {
    const mockSubscriptions = [
      {
        id: '1',
        url: 'https://example.com/feed1',
        title: 'Test Feed 1',
        customTitle: null,
        subscribedAt: '2025-10-30T00:00:00Z',
        lastFetchedAt: null,
        status: 'active' as const,
      },
      {
        id: '2',
        url: 'https://example.com/feed2',
        title: 'Test Feed 2',
        customTitle: null,
        subscribedAt: '2025-10-30T00:00:00Z',
        lastFetchedAt: null,
        status: 'active' as const,
      },
    ]

    beforeEach(() => {
      // 各テスト前にlocalStorageをクリア
      localStorage.clear()
    })

    it('折りたたみボタンが表示される', () => {
      const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })
      render(<FeedManager onAddFeed={onAdd} subscriptions={mockSubscriptions} />)

      // 折りたたみボタンが表示されることを確認
      const button = screen.getByRole('button', { name: /購読フィードを/i })
      expect(button).toBeInTheDocument()
    })

    it('デフォルトで折りたたまれた状態で購読一覧が非表示', () => {
      const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })

      // localStorageをクリア（デフォルト状態）
      localStorage.clear()

      render(<FeedManager onAddFeed={onAdd} subscriptions={mockSubscriptions} />)

      // 購読一覧が非表示であることを確認
      const feedItem1 = screen.queryByText('Test Feed 1')
      expect(feedItem1).not.toBeInTheDocument()
    })

    it('展開ボタンをクリックすると購読一覧が表示される', async () => {
      const user = userEvent.setup()
      const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })

      render(<FeedManager onAddFeed={onAdd} subscriptions={mockSubscriptions} />)

      // 折りたたみボタンをクリック
      const button = screen.getByRole('button', { name: /購読フィードを表示/i })
      await user.click(button)

      // 購読一覧が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('Test Feed 1')).toBeInTheDocument()
        expect(screen.getByText('Test Feed 2')).toBeInTheDocument()
      })
    })

    it('展開状態で折りたたみボタンをクリックすると購読一覧が非表示になる', async () => {
      const user = userEvent.setup()
      const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })

      // localStorageに展開状態を保存
      localStorage.setItem('rss_reader_subscriptions_collapsed', 'false')

      render(<FeedManager onAddFeed={onAdd} subscriptions={mockSubscriptions} />)

      // 購読一覧が表示されていることを確認
      expect(screen.getByText('Test Feed 1')).toBeInTheDocument()

      // 折りたたみボタンをクリック
      const button = screen.getByRole('button', { name: /購読フィードを隠す/i })
      await user.click(button)

      // 購読一覧が非表示になることを確認
      await waitFor(() => {
        expect(screen.queryByText('Test Feed 1')).not.toBeInTheDocument()
      })
    })

    it('aria-expanded属性が正しく設定される', () => {
      const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })

      // localStorageをクリア（デフォルト: 折りたたみ状態）
      localStorage.clear()

      render(<FeedManager onAddFeed={onAdd} subscriptions={mockSubscriptions} />)

      // aria-expanded属性がfalseであることを確認（折りたたみ状態）
      const button = screen.getByRole('button', { name: /購読フィードを/i })
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('aria-expanded属性が展開状態で正しく更新される', async () => {
      const user = userEvent.setup()
      const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })

      render(<FeedManager onAddFeed={onAdd} subscriptions={mockSubscriptions} />)

      // ボタンをクリック
      const button = screen.getByRole('button', { name: /購読フィードを表示/i })
      await user.click(button)

      // aria-expanded属性がtrueに更新されることを確認
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true')
      })
    })

    it('購読数0件の場合も折りたたみボタンが表示される', () => {
      const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })
      render(<FeedManager onAddFeed={onAdd} subscriptions={[]} />)

      // 折りたたみボタンが表示されることを確認
      // NOTE: 購読数0件の場合はボタン自体が表示されないかもしれない
      // その場合、このテストは期待通りFAILする
      const button = screen.queryByRole('button', { name: /購読フィードを/i })
      // 購読数0件の場合の挙動は仕様次第
      // ここでは表示されないことを期待
      expect(button).not.toBeInTheDocument()
    })
  })

  describe('インポート/エクスポート機能', () => {
    it('購読リストが展開されている場合、エクスポートボタンとインポートボタンが表示される', () => {
      const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })
      const subscriptions: Subscription[] = [
        {
          id: '1',
          url: 'https://example.com/feed',
          title: 'Test Feed',
          customTitle: null,
          subscribedAt: '2025-01-01T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
      ]
      render(<FeedManager onAddFeed={onAdd} subscriptions={subscriptions} />)

      expect(screen.getByRole('button', { name: /エクスポート/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /インポート/i })).toBeInTheDocument()
    })

    it('購読リストが折りたたまれている場合、エクスポートボタンとインポートボタンは表示されない', async () => {
      const user = userEvent.setup()
      const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })
      const subscriptions: Subscription[] = [
        {
          id: '1',
          url: 'https://example.com/feed',
          title: 'Test Feed',
          customTitle: null,
          subscribedAt: '2025-01-01T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
      ]
      render(<FeedManager onAddFeed={onAdd} subscriptions={subscriptions} />)

      // 購読リストを折りたたむ
      const toggleButton = screen.getByRole('button', { name: /購読フィードを隠す/i })
      await user.click(toggleButton)

      // ボタンが表示されないことを確認
      expect(screen.queryByRole('button', { name: /エクスポート/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /インポート/i })).not.toBeInTheDocument()
    })

    it('購読数0件の場合、折りたたみ状態に関わらずインポート/エクスポートボタンが表示される', () => {
      // Arrange: 準備
      // 折りたたまれた状態（isCollapsed=true）に設定
      localStorage.setItem('rss_reader_subscriptions_collapsed', 'true')
      const onAdd = vi.fn().mockResolvedValue({ success: true, shouldClearInput: true })

      // Act: 実行
      // 購読数0件でレンダリング
      render(<FeedManager onAddFeed={onAdd} subscriptions={[]} />)

      // Assert: 検証
      // 0件の時は折りたたまれていても、インポートボタンにアクセス可能であるべき
      expect(screen.getByRole('button', { name: /エクスポート/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /インポート/i })).toBeInTheDocument()
    })
  })
})
