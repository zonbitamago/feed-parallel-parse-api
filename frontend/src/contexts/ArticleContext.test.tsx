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

    act(() => {
      result.current.dispatch({ type: 'SET_ARTICLES', payload: articles })
    })

    expect(result.current.state.articles).toEqual(articles)
    expect(result.current.state.displayedArticles).toEqual(articles)
  })

  it('ローディング状態を設定する', () => {
    const { result } = renderHook(() => useArticle(), { wrapper })

    act(() => {
      result.current.dispatch({ type: 'SET_LOADING', payload: true })
    })

    expect(result.current.state.isLoading).toBe(true)
  })

  it('エラーを追加する', () => {
    const { result } = renderHook(() => useArticle(), { wrapper })

    const error: FeedError = {
      url: 'https://example.com/rss',
      message: 'Failed to fetch',
      timestamp: new Date().toISOString(),
    }

    act(() => {
      result.current.dispatch({ type: 'ADD_ERROR', payload: error })
    })

    expect(result.current.state.errors).toHaveLength(1)
    expect(result.current.state.errors[0]).toEqual(error)
  })

  it('検索クエリで記事をフィルタリングする', () => {
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

    act(() => {
      result.current.dispatch({ type: 'SET_SEARCH_QUERY', payload: 'react' })
    })

    expect(result.current.state.displayedArticles).toHaveLength(1)
    expect(result.current.state.displayedArticles[0].title).toBe('React Tutorial')
  })

  it('フィードで記事をフィルタリングする', () => {
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

    act(() => {
      result.current.dispatch({ type: 'SET_SELECTED_FEED', payload: 'feed-1' })
    })

    expect(result.current.state.displayedArticles).toHaveLength(1)
    expect(result.current.state.displayedArticles[0].feedId).toBe('feed-1')
  })
})
