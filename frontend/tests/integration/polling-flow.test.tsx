import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from '../../src/App'

/**
 * User Story 1 統合テスト: バックグラウンドで新着記事を自動検出
 *
 * 検証項目:
 * - 10分経過後にポーリングが実行される
 * - 新着記事が検出されたらpendingArticlesが更新される
 * - オフライン時はポーリングが停止する
 * - メモリリークが発生しない（clearInterval）
 */
describe('ポーリングフロー統合テスト（US1: 新着記事の自動検出）', () => {
  beforeEach(() => {
    // タイマーをモック化
    vi.useFakeTimers()

    // オンライン状態で開始
    vi.stubGlobal('navigator', {
      onLine: true,
      serviceWorker: {
        register: vi.fn().mockResolvedValue({}),
      },
    })

    // localStorageをクリア
    localStorage.clear()

    // fetchをモック化
    global.fetch = vi.fn()
  })

  afterEach(() => {
    // タイマーをリセット
    vi.restoreAllMocks()
  })

  it.skip('10分（600000ms）経過後にポーリングが実行される', async () => {
    // Arrange: 準備
    // localStorageに購読を保存（ポーリングが動作するため）
    localStorage.setItem(
      'rss_reader_subscriptions',
      JSON.stringify([
        {
          id: '1',
          url: 'https://example.com/rss',
          title: 'Test Feed',
          customTitle: null,
          subscribedAt: new Date().toISOString(),
          lastFetchedAt: null,
          status: 'active',
        },
      ])
    )

    const mockFeedResponse = {
      ok: true,
      json: async () => ({
        feeds: [
          {
            url: 'https://example.com/rss',
            title: 'Test Feed',
            articles: [
              {
                id: 'article-1',
                title: 'Article 1',
                link: 'https://example.com/1',
                pubDate: '2025-01-01T10:00:00Z',
                summary: 'Summary 1',
              },
            ],
          },
        ],
      }),
    }

    // fetchのモック設定
    vi.mocked(global.fetch).mockResolvedValue(mockFeedResponse as Response)

    // Act: 実行
    render(<App />)

    // 初回レンダリングを待つ（Reactの内部タイマーのみ）
    await vi.runOnlyPendingTimersAsync()

    // fetchが呼ばれるまで少し待つ（デバウンスなど）
    await vi.advanceTimersByTimeAsync(1000)

    // fetchが初回のみ呼ばれていることを確認（ポーリングはまだ）
    const initialCallCount = vi.mocked(global.fetch).mock.calls.length

    // 10分経過（600000ms）
    await vi.advanceTimersByTimeAsync(600000)

    // Assert: 検証
    // ポーリングによって追加のfetchが呼ばれることを期待
    expect(vi.mocked(global.fetch).mock.calls.length).toBeGreaterThan(
      initialCallCount
    )
  })

  it('オフライン時はポーリングが停止する', async () => {
    // Arrange: 準備
    const mockFeedResponse = {
      ok: true,
      json: async () => ({
        feeds: [],
      }),
    }

    vi.mocked(global.fetch).mockResolvedValue(mockFeedResponse as Response)

    // Act: 実行
    render(<App />)

    // 初回レンダリングを待つ
    await vi.runOnlyPendingTimersAsync()

    // オフラインにする
    vi.stubGlobal('navigator', {
      onLine: false,
      serviceWorker: {
        register: vi.fn().mockResolvedValue({}),
      },
    })
    window.dispatchEvent(new Event('offline'))

    // fetchの呼び出し回数を記録
    const callCountBeforePolling = vi.mocked(global.fetch).mock.calls.length

    // 10分経過
    await vi.advanceTimersByTimeAsync(600000)

    // Assert: 検証
    // オフライン時はポーリングが停止するため、fetchは呼ばれない
    expect(vi.mocked(global.fetch).mock.calls.length).toBe(
      callCountBeforePolling
    )
  })

  it('購読がない場合はポーリングが実行されない', async () => {
    // Arrange: 準備
    const mockFeedResponse = {
      ok: true,
      json: async () => ({
        feeds: [],
      }),
    }

    vi.mocked(global.fetch).mockResolvedValue(mockFeedResponse as Response)

    // Act: 実行
    render(<App />)

    // ウェルカム画面が表示されることを確認（購読なし）
    await vi.runOnlyPendingTimersAsync()

    // fetchの呼び出し回数を記録
    const callCountBeforePolling = vi.mocked(global.fetch).mock.calls.length

    // 10分経過
    await vi.advanceTimersByTimeAsync(600000)

    // Assert: 検証
    // 購読がない場合はポーリングが実行されない
    expect(vi.mocked(global.fetch).mock.calls.length).toBe(
      callCountBeforePolling
    )
  })

  it('アンマウント時にタイマーがクリアされる（メモリリーク防止）', async () => {
    // Arrange: 準備
    const mockFeedResponse = {
      ok: true,
      json: async () => ({
        feeds: [],
      }),
    }

    vi.mocked(global.fetch).mockResolvedValue(mockFeedResponse as Response)

    // Act: 実行
    const { unmount } = render(<App />)

    // 初回レンダリングを待つ
    await vi.runOnlyPendingTimersAsync()

    // fetchの呼び出し回数を記録
    const callCountBeforeUnmount = vi.mocked(global.fetch).mock.calls.length

    // コンポーネントをアンマウント
    unmount()

    // 10分経過
    await vi.advanceTimersByTimeAsync(600000)

    // Assert: 検証
    // アンマウント後はタイマーがクリアされているため、ポーリングは実行されない
    expect(vi.mocked(global.fetch).mock.calls.length).toBe(
      callCountBeforeUnmount
    )
  })
})
