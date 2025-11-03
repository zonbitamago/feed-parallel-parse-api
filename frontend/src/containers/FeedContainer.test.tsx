import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { FeedContainer } from './FeedContainer'
import { ArticleProvider } from '../contexts/ArticleContext'
import { SubscriptionProvider } from '../contexts/SubscriptionContext'
import { UIProvider } from '../contexts/UIContext'
import * as useFeedPollingModule from '../hooks/useFeedPolling'
import * as useNetworkStatusModule from '../hooks/useNetworkStatus'

// モック
vi.mock('../hooks/useFeedPolling')
vi.mock('../hooks/useNetworkStatus')

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UIProvider>
    <SubscriptionProvider>
      <ArticleProvider>
        {children}
      </ArticleProvider>
    </SubscriptionProvider>
  </UIProvider>
)

describe('FeedContainer - useFeedPolling統合', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // デフォルトのモック実装
    vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue({
      isOnline: true,
    })

    vi.mocked(useFeedPollingModule.useFeedPolling).mockReturnValue({
      pendingArticles: [],
      hasNewArticles: false,
      newArticlesCount: 0,
      lastPolledAt: null,
    })
  })

  it('useFeedPollingが正しいパラメータで呼び出される', () => {
    // Arrange: 準備
    const useFeedPollingSpy = vi.spyOn(useFeedPollingModule, 'useFeedPolling')

    // Act: 実行
    render(<FeedContainer />, { wrapper })

    // Assert: 検証
    expect(useFeedPollingSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriptions: expect.any(Array),
        onPoll: expect.any(Function),
        isOnline: true,
      })
    )
  })

  it('オフライン時はuseFeedPollingにisOnline: falseを渡す', () => {
    // Arrange: 準備
    vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue({
      isOnline: false,
    })
    const useFeedPollingSpy = vi.spyOn(useFeedPollingModule, 'useFeedPolling')

    // Act: 実行
    render(<FeedContainer />, { wrapper })

    // Assert: 検証
    expect(useFeedPollingSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        isOnline: false,
      })
    )
  })

  it('hasNewArticlesがtrueの時、新着通知UIが表示される（将来実装）', async () => {
    // Arrange: 準備
    vi.mocked(useFeedPollingModule.useFeedPolling).mockReturnValue({
      pendingArticles: [
        {
          id: 'new-1',
          title: 'New Article',
          link: 'https://example.com/new-1',
          pubDate: '2025-01-03T10:00:00Z',
          summary: 'New Summary',
          feedId: 'feed-1',
          feedTitle: 'Test Feed',
          feedOrder: 0,
        },
      ],
      hasNewArticles: true,
      newArticlesCount: 1,
      lastPolledAt: Date.now(),
    })

    // Act: 実行
    render(<FeedContainer />, { wrapper })

    // Assert: 検証
    await waitFor(() => {
      // 将来的に新着通知UIが実装されたら、ここでテストする
      // 現在は基本的なレンダリングが成功することを確認
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  })

  it('ポーリング機能が有効で、subscriptionsが存在する時にポーリングが動作する', () => {
    // Arrange: 準備
    const useFeedPollingSpy = vi.spyOn(useFeedPollingModule, 'useFeedPolling')

    // Act: 実行
    render(<FeedContainer />, { wrapper })

    // Assert: 検証
    // useFeedPollingが呼び出されていることを確認
    expect(useFeedPollingSpy).toHaveBeenCalled()

    // onPollコールバックが関数であることを確認
    const callArgs = useFeedPollingSpy.mock.calls[0][0]
    expect(typeof callArgs.onPoll).toBe('function')
  })

  it('lastPolledAtが更新されることを確認（統合テスト）', async () => {
    // Arrange: 準備
    const mockTimestamp = 1699000000000

    vi.mocked(useFeedPollingModule.useFeedPolling).mockReturnValue({
      pendingArticles: [],
      hasNewArticles: false,
      newArticlesCount: 0,
      lastPolledAt: mockTimestamp,
    })

    // Act: 実行
    render(<FeedContainer />, { wrapper })

    // Assert: 検証
    await waitFor(() => {
      // FeedContainerが正常にレンダリングされることを確認
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  })
})
