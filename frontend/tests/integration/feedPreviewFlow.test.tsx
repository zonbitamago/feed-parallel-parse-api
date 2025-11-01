import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import App from '../../src/App'

/**
 * フィード追加時のタイトルプレビュー - 統合テスト
 *
 * プレビュー表示からフィード追加までの完全なフロー
 * 無効なURLでのプレビューエラー処理
 */

const server = setupServer(
  http.post('*/api/parse', () => {
    return HttpResponse.json({
      feeds: [
        {
          title: 'Tech Blog',
          link: 'https://example.com/feed',
          feedUrl: 'https://example.com/feed',
          articles: [
            {
              title: 'First Article',
              link: 'https://example.com/article1',
              published: new Date().toISOString(),
              summary: 'Article summary',
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

describe('フィードプレビューフロー統合テスト', () => {
  it('URL入力→プレビュー表示→フィード追加の一連のフロー', async () => {
    // 準備
    const user = userEvent.setup()
    render(<App />)

    // ステップ1: URL入力フィールドを見つける
    const input = screen.getByPlaceholderText(/RSSフィードのURLを入力/i)
    expect(input).toBeInTheDocument()

    // ステップ2: 有効なURLを入力
    await user.type(input, 'https://example.com/feed')

    // ステップ3: プレビューが表示されることを確認（デバウンス後）
    await waitFor(
      () => {
        expect(screen.getByText(/プレビュー:/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // プレビュータイトルが正しく表示される
    expect(screen.getByText(/Tech Blog/i)).toBeInTheDocument()

    // ステップ4: 追加ボタンをクリック
    const addButton = screen.getByRole('button', { name: /追加/i })
    await user.click(addButton)

    // ステップ5: フィードが購読リストに追加されることを確認
    await waitFor(
      () => {
        expect(screen.getByText(/購読中: 1/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // ステップ6: プレビューが消えることを確認
    expect(screen.queryByText(/プレビュー:/i)).not.toBeInTheDocument()

    // ステップ7: URL入力フィールドがクリアされることを確認
    expect(input).toHaveValue('')

    // ステップ8: 購読数が表示される
    expect(screen.getByText(/購読中: 1/i)).toBeInTheDocument()
  })

  it('無効なURLでプレビューエラーが表示されるが、追加は試行できる', async () => {
    // 準備: 常にエラーレスポンスをモック
    server.use(
      http.post('*/api/parse', () => {
        return HttpResponse.json({
          feeds: [],
          errors: [
            {
              url: 'https://invalid-feed.example.com/rss',
              message: 'フィードの取得に失敗しました',
            },
          ],
        })
      })
    )

    const user = userEvent.setup()
    render(<App />)

    // ステップ1: URL入力フィールドを見つける
    const input = screen.getByPlaceholderText(/RSSフィードのURLを入力/i)

    // ステップ2: 無効なURLを入力
    await user.type(input, 'https://invalid-feed.example.com/rss')

    // ステップ3: プレビューエラーメッセージが表示されることを確認（デバウンス後）
    await waitFor(
      () => {
        expect(screen.getByText(/エラー:/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    expect(screen.getByText(/フィードの取得に失敗しました/i)).toBeInTheDocument()

    // ステップ4: プレビュータイトルは表示されない
    expect(screen.queryByText(/プレビュー:/i)).not.toBeInTheDocument()

    // ステップ5: 追加ボタンは有効（プレビューエラーでも追加を試行できる設計）
    const addButton = screen.getByRole('button', { name: /追加/i })
    expect(addButton).not.toBeDisabled()

    // ステップ6: 追加ボタンをクリック
    await user.click(addButton)

    // ステップ7: フィードは追加されるが、エラー状態で表示される
    await waitFor(
      () => {
        expect(screen.getByText(/購読中: 1/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // エラー状態のフィード表示を確認（URLが購読リストに表示される）
    expect(screen.getAllByText(/invalid-feed.example.com/i).length).toBeGreaterThan(0)
  })

  it('URL入力中にプレビューがデバウンスされることを確認', async () => {
    // APIコールカウンター
    let apiCallCount = 0
    server.use(
      http.post('*/api/parse', () => {
        apiCallCount++
        return HttpResponse.json({
          feeds: [
            {
              title: 'Debounced Tech Blog',
              link: 'https://example.com/feed',
              feedUrl: 'https://example.com/feed',
              articles: [],
            },
          ],
          errors: [],
        })
      })
    )

    const user = userEvent.setup()
    render(<App />)

    // ステップ1: 連続してURL文字を入力
    const input = screen.getByPlaceholderText(/RSSフィードのURLを入力/i)
    await user.type(input, 'https://example.com/feed')

    // ステップ2: 少し待ってからプレビューが表示されることを確認
    await waitFor(
      () => {
        expect(screen.getByText(/Debounced Tech Blog/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // ステップ3: API呼び出しが1回だけであることを確認（デバウンスの効果）
    // 文字数は26文字だが、デバウンスにより1回のみのAPI呼び出し
    expect(apiCallCount).toBe(1)
  })

  it('URL変更時に古いプレビューがクリアされる', async () => {
    const user = userEvent.setup()
    render(<App />)

    // ステップ1: 最初のURLを入力
    const input = screen.getByPlaceholderText(/RSSフィードのURLを入力/i)
    await user.type(input, 'https://example.com/feed')

    // ステップ2: プレビューが表示されることを確認
    await waitFor(
      () => {
        expect(screen.getByText(/Tech Blog/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // ステップ3: URLをクリア
    await user.clear(input)

    // ステップ4: プレビューが消えることを確認
    await waitFor(() => {
      expect(screen.queryByText(/Tech Blog/i)).not.toBeInTheDocument()
    })

    expect(screen.queryByText(/プレビュー:/i)).not.toBeInTheDocument()
  })
})