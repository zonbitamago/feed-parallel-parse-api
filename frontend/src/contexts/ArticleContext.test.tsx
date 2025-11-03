import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ArticleProvider, useArticle } from './ArticleContext'
import type { Article, FeedError } from '../types/models'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ArticleProvider>{children}</ArticleProvider>
)

describe('ArticleContext', () => {
  it('空の記事リストで初期化する', () => {
    const { result } = renderHook(() => useArticle(), { wrapper })
    expect(result.current.state.articles).toEqual([])
    expect(result.current.state.displayedArticles).toEqual([])
    expect(result.current.state.isLoading).toBe(false)
  })

  it('記事を設定する', () => {
    // 準備
    const { result } = renderHook(() => useArticle(), { wrapper })
    const articles: Article[] = [
      {
        id: '1',
        title: 'Article 1',
        link: 'https://example.com/1',
        pubDate: '2025-01-01T10:00:00Z',
        summary: 'Summary 1',
        feedId: 'feed-1',
        feedTitle: 'Test Feed',
        feedOrder: 0,
      },
    ]

    // 実行
    act(() => {
      result.current.dispatch({ type: 'SET_ARTICLES', payload: articles })
    })

    // 検証
    expect(result.current.state.articles).toEqual(articles)
    expect(result.current.state.displayedArticles).toEqual(articles)
  })

  it('ローディング状態を設定する', () => {
    // 準備
    const { result } = renderHook(() => useArticle(), { wrapper })

    // 実行
    act(() => {
      result.current.dispatch({ type: 'SET_LOADING', payload: true })
    })

    // 検証
    expect(result.current.state.isLoading).toBe(true)
  })

  it('エラーを追加する', () => {
    // 準備
    const { result } = renderHook(() => useArticle(), { wrapper })
    const error: FeedError = {
      url: 'https://example.com/rss',
      message: 'Failed to fetch',
      timestamp: new Date().toISOString(),
    }

    // 実行
    act(() => {
      result.current.dispatch({ type: 'ADD_ERROR', payload: error })
    })

    // 検証
    expect(result.current.state.errors).toHaveLength(1)
    expect(result.current.state.errors[0]).toEqual(error)
  })

  it('検索クエリで記事をフィルタリングする', () => {
    // 準備
    const { result } = renderHook(() => useArticle(), { wrapper })
    const articles: Article[] = [
      {
        id: '1',
        title: 'React Tutorial',
        link: 'https://example.com/1',
        pubDate: '2025-01-01T10:00:00Z',
        summary: 'Learn React',
        feedId: 'feed-1',
        feedTitle: 'Tech Blog',
        feedOrder: 0,
      },
      {
        id: '2',
        title: 'Vue Guide',
        link: 'https://example.com/2',
        pubDate: '2025-01-02T10:00:00Z',
        summary: 'Learn Vue',
        feedId: 'feed-1',
        feedTitle: 'Tech Blog',
        feedOrder: 1,
      },
    ]
    act(() => {
      result.current.dispatch({ type: 'SET_ARTICLES', payload: articles })
    })

    // 実行
    act(() => {
      result.current.dispatch({ type: 'SET_SEARCH_QUERY', payload: 'react' })
    })

    // 検証
    expect(result.current.state.displayedArticles).toHaveLength(1)
    expect(result.current.state.displayedArticles[0].title).toBe('React Tutorial')
  })

  it('フィードで記事をフィルタリングする', () => {
    // 準備
    const { result } = renderHook(() => useArticle(), { wrapper })
    const articles: Article[] = [
      {
        id: '1',
        title: 'Article 1',
        link: 'https://example.com/1',
        pubDate: '2025-01-01T10:00:00Z',
        summary: 'Summary 1',
        feedId: 'feed-1',
        feedTitle: 'Feed 1',
        feedOrder: 0,
      },
      {
        id: '2',
        title: 'Article 2',
        link: 'https://example.com/2',
        pubDate: '2025-01-02T10:00:00Z',
        summary: 'Summary 2',
        feedId: 'feed-2',
        feedTitle: 'Feed 2',
        feedOrder: 0,
      },
    ]
    act(() => {
      result.current.dispatch({ type: 'SET_ARTICLES', payload: articles })
    })

    // 実行
    act(() => {
      result.current.dispatch({ type: 'SET_SELECTED_FEED', payload: 'feed-1' })
    })

    // 検証
    expect(result.current.state.displayedArticles).toHaveLength(1)
    expect(result.current.state.displayedArticles[0].feedId).toBe('feed-1')
  })

  describe('ポーリング状態管理（US1: 新着記事の自動検出）', () => {
    it('SET_PENDING_ARTICLESで新着記事を保存する', () => {
      // Arrange: 準備
      const { result } = renderHook(() => useArticle(), { wrapper })
      const pendingArticles: Article[] = [
        {
          id: 'new-1',
          title: 'New Article 1',
          link: 'https://example.com/new-1',
          pubDate: '2025-01-03T10:00:00Z',
          summary: 'New Summary 1',
          feedId: 'feed-1',
          feedTitle: 'Test Feed',
          feedOrder: 0,
        },
        {
          id: 'new-2',
          title: 'New Article 2',
          link: 'https://example.com/new-2',
          pubDate: '2025-01-03T11:00:00Z',
          summary: 'New Summary 2',
          feedId: 'feed-1',
          feedTitle: 'Test Feed',
          feedOrder: 1,
        },
      ]

      // Act: 実行
      act(() => {
        result.current.dispatch({
          type: 'SET_PENDING_ARTICLES',
          payload: pendingArticles,
        })
      })

      // Assert: 検証
      expect(result.current.state.pendingArticles).toEqual(pendingArticles)
      expect(result.current.state.hasNewArticles).toBe(true)
      expect(result.current.state.newArticlesCount).toBe(2)
    })

    it('SET_PENDING_ARTICLESで空配列を渡すとhasNewArticlesがfalseになる', () => {
      // Arrange: 準備
      const { result } = renderHook(() => useArticle(), { wrapper })

      // Act: 実行
      act(() => {
        result.current.dispatch({
          type: 'SET_PENDING_ARTICLES',
          payload: [],
        })
      })

      // Assert: 検証
      expect(result.current.state.pendingArticles).toEqual([])
      expect(result.current.state.hasNewArticles).toBe(false)
      expect(result.current.state.newArticlesCount).toBe(0)
    })

    it('APPLY_PENDING_ARTICLESで新着記事を既存記事にマージする', () => {
      // Arrange: 準備
      const { result } = renderHook(() => useArticle(), { wrapper })
      const existingArticles: Article[] = [
        {
          id: '1',
          title: 'Article 1',
          link: 'https://example.com/1',
          pubDate: '2025-01-01T10:00:00Z',
          summary: 'Summary 1',
          feedId: 'feed-1',
          feedTitle: 'Test Feed',
          feedOrder: 0,
        },
      ]
      const pendingArticles: Article[] = [
        {
          id: 'new-1',
          title: 'New Article 1',
          link: 'https://example.com/new-1',
          pubDate: '2025-01-03T10:00:00Z',
          summary: 'New Summary 1',
          feedId: 'feed-1',
          feedTitle: 'Test Feed',
          feedOrder: 0,
        },
      ]

      act(() => {
        result.current.dispatch({ type: 'SET_ARTICLES', payload: existingArticles })
        result.current.dispatch({
          type: 'SET_PENDING_ARTICLES',
          payload: pendingArticles,
        })
      })

      // Act: 実行
      act(() => {
        result.current.dispatch({ type: 'APPLY_PENDING_ARTICLES' })
      })

      // Assert: 検証
      expect(result.current.state.articles).toHaveLength(2)
      expect(result.current.state.articles[0].id).toBe('new-1') // 新しい記事が先頭
      expect(result.current.state.articles[1].id).toBe('1')
      expect(result.current.state.pendingArticles).toEqual([]) // クリアされる
      expect(result.current.state.hasNewArticles).toBe(false)
      expect(result.current.state.newArticlesCount).toBe(0)
    })

    it('SET_LAST_POLLED_ATで最終ポーリング時刻を更新する', () => {
      // Arrange: 準備
      const { result } = renderHook(() => useArticle(), { wrapper })
      const timestamp = 1699000000000 // 2023-11-03

      // Act: 実行
      act(() => {
        result.current.dispatch({
          type: 'SET_LAST_POLLED_AT',
          payload: timestamp,
        })
      })

      // Assert: 検証
      expect(result.current.state.lastPolledAt).toBe(timestamp)
    })

    it('SET_LAST_POLLED_ATでnullを渡すと初期化される', () => {
      // Arrange: 準備
      const { result } = renderHook(() => useArticle(), { wrapper })

      // まず値をセット
      act(() => {
        result.current.dispatch({
          type: 'SET_LAST_POLLED_AT',
          payload: 1699000000000,
        })
      })

      // Act: 実行 - nullで初期化
      act(() => {
        result.current.dispatch({
          type: 'SET_LAST_POLLED_AT',
          payload: null,
        })
      })

      // Assert: 検証
      expect(result.current.state.lastPolledAt).toBe(null)
    })
  })
})
