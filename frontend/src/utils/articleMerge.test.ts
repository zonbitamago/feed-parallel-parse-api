import { describe, it, expect } from 'vitest'
import type { Article } from '../types/models'
import { findNewArticles, mergeArticles } from './articleMerge'

describe('findNewArticles', () => {
  const createArticle = (id: string, title: string): Article => ({
    id,
    title,
    link: `https://example.com/${id}`,
    summary: `Summary for ${title}`,
    pubDate: new Date().toISOString(),
    feed: {
      id: 'feed1',
      title: 'Test Feed',
      url: 'https://example.com/rss',
    },
  })

  it('新着記事がない場合は空配列を返す', () => {
    // Arrange: 準備
    const currentArticles: Article[] = [
      createArticle('article1', 'Article 1'),
      createArticle('article2', 'Article 2'),
    ]
    const latestArticles: Article[] = [
      createArticle('article1', 'Article 1'),
      createArticle('article2', 'Article 2'),
    ]

    // Act: 実行
    const result = findNewArticles(latestArticles, currentArticles)

    // Assert: 検証
    expect(result).toEqual([])
  })

  it('新着記事が1件ある場合はその記事を返す', () => {
    // Arrange: 準備
    const currentArticles: Article[] = [
      createArticle('article1', 'Article 1'),
    ]
    const latestArticles: Article[] = [
      createArticle('article1', 'Article 1'),
      createArticle('article2', 'Article 2'), // 新着
    ]

    // Act: 実行
    const result = findNewArticles(latestArticles, currentArticles)

    // Assert: 検証
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('article2')
    expect(result[0].title).toBe('Article 2')
  })

  it('新着記事が複数ある場合はすべて返す', () => {
    // Arrange: 準備
    const currentArticles: Article[] = [
      createArticle('article1', 'Article 1'),
    ]
    const latestArticles: Article[] = [
      createArticle('article1', 'Article 1'),
      createArticle('article2', 'Article 2'), // 新着
      createArticle('article3', 'Article 3'), // 新着
    ]

    // Act: 実行
    const result = findNewArticles(latestArticles, currentArticles)

    // Assert: 検証
    expect(result).toHaveLength(2)
    expect(result.map(a => a.id)).toEqual(['article2', 'article3'])
  })

  it('現在の記事が空の場合は最新記事をすべて返す', () => {
    // Arrange: 準備
    const currentArticles: Article[] = []
    const latestArticles: Article[] = [
      createArticle('article1', 'Article 1'),
      createArticle('article2', 'Article 2'),
    ]

    // Act: 実行
    const result = findNewArticles(latestArticles, currentArticles)

    // Assert: 検証
    expect(result).toHaveLength(2)
    expect(result.map(a => a.id)).toEqual(['article1', 'article2'])
  })

  it('最新記事が空の場合は空配列を返す', () => {
    // Arrange: 準備
    const currentArticles: Article[] = [
      createArticle('article1', 'Article 1'),
    ]
    const latestArticles: Article[] = []

    // Act: 実行
    const result = findNewArticles(latestArticles, currentArticles)

    // Assert: 検証
    expect(result).toEqual([])
  })

  it('記事IDによる重複判定が正しく動作する', () => {
    // Arrange: 準備
    const currentArticles: Article[] = [
      createArticle('article1', 'Article 1'),
      createArticle('article2', 'Article 2'),
    ]
    const latestArticles: Article[] = [
      createArticle('article2', 'Article 2 Updated'), // 既存（IDが同じ）
      createArticle('article3', 'Article 3'), // 新着
    ]

    // Act: 実行
    const result = findNewArticles(latestArticles, currentArticles)

    // Assert: 検証
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('article3')
  })
})

describe('mergeArticles', () => {
  const createArticle = (id: string, title: string, pubDate: string): Article => ({
    id,
    title,
    link: `https://example.com/${id}`,
    summary: `Summary for ${title}`,
    pubDate,
    feed: {
      id: 'feed1',
      title: 'Test Feed',
      url: 'https://example.com/rss',
    },
  })

  it('新着記事と既存記事をマージして日付順（降順）にソートする', () => {
    // Arrange: 準備
    const currentArticles: Article[] = [
      createArticle('article1', 'Article 1', '2025-01-01T00:00:00Z'),
      createArticle('article2', 'Article 2', '2025-01-02T00:00:00Z'),
    ]
    const newArticles: Article[] = [
      createArticle('article3', 'Article 3', '2025-01-03T00:00:00Z'), // 最新
    ]

    // Act: 実行
    const result = mergeArticles(currentArticles, newArticles)

    // Assert: 検証
    expect(result).toHaveLength(3)
    expect(result.map(a => a.id)).toEqual(['article3', 'article2', 'article1'])
  })

  it('新着記事が空の場合は既存記事をそのまま返す', () => {
    // Arrange: 準備
    const currentArticles: Article[] = [
      createArticle('article1', 'Article 1', '2025-01-01T00:00:00Z'),
    ]
    const newArticles: Article[] = []

    // Act: 実行
    const result = mergeArticles(currentArticles, newArticles)

    // Assert: 検証
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('article1')
  })

  it('既存記事が空の場合は新着記事をそのまま返す', () => {
    // Arrange: 準備
    const currentArticles: Article[] = []
    const newArticles: Article[] = [
      createArticle('article1', 'Article 1', '2025-01-01T00:00:00Z'),
    ]

    // Act: 実行
    const result = mergeArticles(currentArticles, newArticles)

    // Assert: 検証
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('article1')
  })

  it('両方が空の場合は空配列を返す', () => {
    // Arrange: 準備
    const currentArticles: Article[] = []
    const newArticles: Article[] = []

    // Act: 実行
    const result = mergeArticles(currentArticles, newArticles)

    // Assert: 検証
    expect(result).toEqual([])
  })

  it('複数の新着記事を正しくソートする', () => {
    // Arrange: 準備
    const currentArticles: Article[] = [
      createArticle('article1', 'Article 1', '2025-01-01T00:00:00Z'),
    ]
    const newArticles: Article[] = [
      createArticle('article2', 'Article 2', '2025-01-02T00:00:00Z'),
      createArticle('article3', 'Article 3', '2025-01-03T00:00:00Z'),
      createArticle('article4', 'Article 4', '2025-01-04T00:00:00Z'),
    ]

    // Act: 実行
    const result = mergeArticles(currentArticles, newArticles)

    // Assert: 検証
    expect(result).toHaveLength(4)
    expect(result.map(a => a.id)).toEqual(['article4', 'article3', 'article2', 'article1'])
  })
})
