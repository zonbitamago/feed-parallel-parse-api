import { useState, useEffect, useCallback } from 'react'
import type { Article } from '../types/models'

const INITIAL_COUNT = 50
const LOAD_MORE_COUNT = 50

export function useVirtualScroll(articles: Article[]) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)

  // Reset when articles change
  useEffect(() => {
    setVisibleCount(INITIAL_COUNT)
  }, [articles])

  const visibleArticles = articles.slice(0, visibleCount)
  const hasMore = visibleCount < articles.length

  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + LOAD_MORE_COUNT, articles.length))
  }, [articles.length])

  return {
    visibleArticles,
    hasMore,
    loadMore,
  }
}
