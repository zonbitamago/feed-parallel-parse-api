/**
 * API型定義のテスト
 */

import { describe, it, expect } from 'vitest'
import type { RSSFeed, APIArticle } from './api'

// 🔴 Red: User Story 1 - RSSFeed型にfeedUrlフィールド追加のテスト
describe('RSSFeed型定義', () => {
  it('feedUrlフィールドが存在する', () => {
    const feed: RSSFeed = {
      title: 'Test Feed',
      link: 'https://example.com',
      feedUrl: 'https://example.com/rss', // ← まだ存在しないフィールド（これが失敗の原因）
      articles: [],
    }

    expect(feed.feedUrl).toBeDefined()
    expect(feed.feedUrl).toBe('https://example.com/rss')
  })

  // 🔴 Red: User Story 1 - feedUrlとlinkが異なる値を持てることを確認
  it('feedUrlとlinkは異なる値を持つ（Rebuild.fmの実例）', () => {
    const feed: RSSFeed = {
      title: 'Rebuild',
      link: 'https://rebuild.fm', // ホームページURL
      feedUrl: 'https://feeds.rebuild.fm/rebuildfm', // 実際のRSSフィードURL
      articles: [],
    }

    expect(feed.link).not.toBe(feed.feedUrl)
    expect(feed.link).toBe('https://rebuild.fm')
    expect(feed.feedUrl).toBe('https://feeds.rebuild.fm/rebuildfm')
  })

  it('feedUrlは必須フィールドである', () => {
    // TypeScriptのコンパイル時型チェックで以下はエラーになるべき
    // @ts-expect-error feedUrlが欠けている
    const invalidFeed: RSSFeed = {
      title: 'Test',
      link: 'https://example.com',
      articles: [],
    }

    // テストの主目的はTypeScriptコンパイラの型チェック
    // 実行時チェックは補助的
    expect(invalidFeed).toBeDefined()
  })

  it('既存のlinkフィールドは維持される（後方互換性）', () => {
    const feed: RSSFeed = {
      title: 'Test Feed',
      link: 'https://example.com',
      feedUrl: 'https://example.com/rss',
      articles: [],
    }

    // linkフィールドは既存のホームページURL用途で維持
    expect(feed.link).toBe('https://example.com')
  })
})

describe('APIArticle型定義（変更なし）', () => {
  it('既存のフィールドが全て存在する', () => {
    const article: APIArticle = {
      title: 'Test Article',
      link: 'https://example.com/article',
      pubDate: '2025-01-01T00:00:00Z',
      summary: 'Test summary',
    }

    expect(article.title).toBeDefined()
    expect(article.link).toBeDefined()
    expect(article.pubDate).toBeDefined()
    expect(article.summary).toBeDefined()
  })
})
