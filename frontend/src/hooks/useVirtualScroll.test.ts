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
  it('should show initial 50 articles', () => {
    const articles = createArticles(100)
    const { result } = renderHook(() => useVirtualScroll(articles))
    
    expect(result.current.visibleArticles).toHaveLength(50)
    expect(result.current.hasMore).toBe(true)
  })

  it('should load more articles on scroll', () => {
    const articles = createArticles(100)
    const { result } = renderHook(() => useVirtualScroll(articles))
    
    act(() => {
      result.current.loadMore()
    })
    
    expect(result.current.visibleArticles.length).toBeGreaterThan(50)
  })

  it('should handle articles less than 50', () => {
    const articles = createArticles(30)
    const { result } = renderHook(() => useVirtualScroll(articles))
    
    expect(result.current.visibleArticles).toHaveLength(30)
    expect(result.current.hasMore).toBe(false)
  })

  it('should reset when articles change', () => {
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
