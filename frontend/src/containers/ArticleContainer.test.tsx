import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArticleContainer } from './ArticleContainer'
import * as ArticleContextModule from '../contexts/ArticleContext'
import * as UIContextModule from '../contexts/UIContext'
import * as useVirtualScrollModule from '../hooks/useVirtualScroll'

// モック
vi.mock('../contexts/ArticleContext')
vi.mock('../contexts/UIContext')
vi.mock('../hooks/useVirtualScroll')

// テスト用の記事データ
const mockArticle = {
  id: 'test-article-1',
  title: 'テスト記事',
  link: 'https://example.com/article-1',
  pubDate: '2025-01-01T00:00:00Z',
  summary: 'テスト記事の要約',
  feedId: 'feed-1',
  feedTitle: 'テストフィード',
  feedOrder: 0,
}

describe('ArticleContainer - ローディング表示', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // デフォルトのモック実装
    vi.mocked(UIContextModule.useUI).mockReturnValue({
      state: { isRefreshing: false },
      dispatch: vi.fn(),
    })

    vi.mocked(useVirtualScrollModule.useVirtualScroll).mockReturnValue({
      visibleArticles: [],
      hasMore: false,
      loadMore: vi.fn(),
    })
  })

  describe('Red Phase: 失敗するテストを確認', () => {
    it('T004 [US1] 記事がある場合、ローディング中でも記事一覧を表示する', () => {
      // Arrange: 準備
      // 記事がある + isLoading=true の状態をセットアップ
      vi.mocked(ArticleContextModule.useArticle).mockReturnValue({
        state: {
          articles: [mockArticle],
          displayedArticles: [mockArticle],
          searchQuery: '',
          selectedFeedId: null,
          isLoading: true, // ローディング中
          errors: [],
          pendingArticles: [],
          hasNewArticles: false,
          newArticlesCount: 0,
          lastPolledAt: null,
        },
        dispatch: vi.fn(),
      })

      vi.mocked(useVirtualScrollModule.useVirtualScroll).mockReturnValue({
        visibleArticles: [mockArticle],
        hasMore: false,
        loadMore: vi.fn(),
      })

      // Act: 実行
      render(<ArticleContainer />)

      // Assert: 検証
      // 記事一覧が表示されることを確認
      expect(screen.getByTestId('article-list-container')).toBeInTheDocument()
      // ローディングアイコンは表示されないことを確認
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    it('T005 [US2] 記事が0件でローディング中の場合、ローディングアイコンを表示する', () => {
      // Arrange: 準備
      // 記事が0件 + isLoading=true の状態をセットアップ
      vi.mocked(ArticleContextModule.useArticle).mockReturnValue({
        state: {
          articles: [], // 記事なし
          displayedArticles: [],
          searchQuery: '',
          selectedFeedId: null,
          isLoading: true, // ローディング中
          errors: [],
          pendingArticles: [],
          hasNewArticles: false,
          newArticlesCount: 0,
          lastPolledAt: null,
        },
        dispatch: vi.fn(),
      })

      // Act: 実行
      render(<ArticleContainer />)

      // Assert: 検証
      // ローディングアイコンが表示されることを確認
      expect(screen.getByText('読み込み中...')).toBeInTheDocument()
    })

    it('T006 [US1] 手動更新時も記事があれば記事一覧を表示し続ける', () => {
      // Arrange: 準備
      // 記事がある + isLoading=true + isRefreshing=true の状態
      vi.mocked(ArticleContextModule.useArticle).mockReturnValue({
        state: {
          articles: [mockArticle],
          displayedArticles: [mockArticle],
          searchQuery: '',
          selectedFeedId: null,
          isLoading: true, // ローディング中
          errors: [],
          pendingArticles: [],
          hasNewArticles: false,
          newArticlesCount: 0,
          lastPolledAt: null,
        },
        dispatch: vi.fn(),
      })

      vi.mocked(UIContextModule.useUI).mockReturnValue({
        state: { isRefreshing: true }, // 手動更新中
        dispatch: vi.fn(),
      })

      vi.mocked(useVirtualScrollModule.useVirtualScroll).mockReturnValue({
        visibleArticles: [mockArticle],
        hasMore: false,
        loadMore: vi.fn(),
      })

      // Act: 実行
      const mockRefresh = vi.fn()
      render(<ArticleContainer onRefresh={mockRefresh} />)

      // Assert: 検証
      // 記事一覧が表示されることを確認
      expect(screen.getByTestId('article-list-container')).toBeInTheDocument()
      // ローディングアイコンは表示されないことを確認
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  })

  describe('基本的なレンダリング', () => {
    it('記事がなくローディングも終わっている場合、空の記事一覧を表示する', () => {
      // Arrange: 準備
      vi.mocked(ArticleContextModule.useArticle).mockReturnValue({
        state: {
          articles: [],
          displayedArticles: [],
          searchQuery: '',
          selectedFeedId: null,
          isLoading: false,
          errors: [],
          pendingArticles: [],
          hasNewArticles: false,
          newArticlesCount: 0,
          lastPolledAt: null,
        },
        dispatch: vi.fn(),
      })

      // Act: 実行
      render(<ArticleContainer />)

      // Assert: 検証
      expect(screen.getByTestId('article-list-container')).toBeInTheDocument()
    })
  })
})
