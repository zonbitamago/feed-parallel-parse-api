import { describe, it, expect } from 'vitest'
import { sortArticlesByDate } from './dateSort'
import type { Article } from '../types/models'

describe('sortArticlesByDate', () => {
  const createArticle = (id: string, pubDate: string | null, feedOrder: number): Article => ({
    id,
    title: `Article ${id}`,
    link: `https://example.com/${id}`,
    pubDate,
    summary: 'Summary',
    feedId: 'feed-1',
    feedTitle: 'Test Feed',
    feedOrder,
  })

  it('記事を公開日の降順でソートする', () => {
    const articles: Article[] = [
      createArticle('1', '2025-01-01T10:00:00Z', 0),
      createArticle('2', '2025-01-03T10:00:00Z', 1),
      createArticle('3', '2025-01-02T10:00:00Z', 2),
    ]

    const sorted = sortArticlesByDate(articles)
    expect(sorted[0].id).toBe('2') // 最新
    expect(sorted[1].id).toBe('3')
    expect(sorted[2].id).toBe('1') // 最古
  })

  it('公開日がnullの記事を末尾に配置する', () => {
    const articles: Article[] = [
      createArticle('1', '2025-01-01T10:00:00Z', 0),
      createArticle('2', null, 1),
      createArticle('3', '2025-01-02T10:00:00Z', 2),
    ]

    const sorted = sortArticlesByDate(articles)
    expect(sorted[0].id).toBe('3')
    expect(sorted[1].id).toBe('1')
    expect(sorted[2].id).toBe('2') // null date at end
  })

  it('公開日がnullの記事はfeedOrderを維持する（FR-005）', () => {
    const articles: Article[] = [
      createArticle('1', null, 2),
      createArticle('2', null, 0),
      createArticle('3', null, 1),
    ]

    const sorted = sortArticlesByDate(articles)
    expect(sorted[0].id).toBe('2') // feedOrder 0
    expect(sorted[1].id).toBe('3') // feedOrder 1
    expect(sorted[2].id).toBe('1') // feedOrder 2
  })

  it('空配列を処理する', () => {
    expect(sortArticlesByDate([])).toEqual([])
  })
})
