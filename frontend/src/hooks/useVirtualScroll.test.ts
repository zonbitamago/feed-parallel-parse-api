import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVirtualScroll } from './useVirtualScroll'
import type { Article } from '../types/models'

const createArticles = (count: number): Article[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `article-${i}`,
    title: `Article ${i}`,
    link: `https://example.com/${i}`,
    pubDate: new Date().toISOString(),
    summary: `Summary ${i}`,
    feedId: 'feed-1',
    feedTitle: 'Test Feed',
    feedOrder: i,
  }))
}

describe('useVirtualScroll', () => {
  it('初期表示で50件の記事を表示する', () => {
    const articles = createArticles(100)
    const { result } = renderHook(() => useVirtualScroll(articles))

    expect(result.current.visibleArticles).toHaveLength(50)
    expect(result.current.hasMore).toBe(true)
  })

  it('スクロール時に追加の記事を読み込む', () => {
    const articles = createArticles(100)
    const { result } = renderHook(() => useVirtualScroll(articles))

    act(() => {
      result.current.loadMore()
    })

    expect(result.current.visibleArticles.length).toBeGreaterThan(50)
  })

  it('50件未満の記事を処理する', () => {
    const articles = createArticles(30)
    const { result } = renderHook(() => useVirtualScroll(articles))

    expect(result.current.visibleArticles).toHaveLength(30)
    expect(result.current.hasMore).toBe(false)
  })

  it('記事が変更されたときにリセットする', () => {
    const { result, rerender } = renderHook(
      ({ articles }) => useVirtualScroll(articles),
      { initialProps: { articles: createArticles(100) } }
    )

    expect(result.current.visibleArticles).toHaveLength(50)

    rerender({ articles: createArticles(200) })

    expect(result.current.visibleArticles).toHaveLength(50)
    expect(result.current.hasMore).toBe(true)
  })
})
