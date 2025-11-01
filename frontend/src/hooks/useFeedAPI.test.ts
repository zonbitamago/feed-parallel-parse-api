import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { useFeedAPI } from './useFeedAPI'

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useFeedAPI', () => {
  it('空の状態で初期化する', () => {
    const { result } = renderHook(() => useFeedAPI())
    expect(result.current.articles).toEqual([])
    expect(result.current.errors).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('フィードを正常に取得する', async () => {
    server.use(
      http.post('*/api/parse', () => {
        return HttpResponse.json({
          feeds: [
            {
              title: 'Test Feed',
              link: 'https://example.com/rss',
              feedUrl: 'https://example.com/rss',
              articles: [
                {
                  title: 'Article 1',
                  link: 'https://example.com/1',
                  pubDate: '2025-01-01T10:00:00Z',
                  summary: 'Summary 1',
                },
              ],
            },
          ],
          errors: [],
        })
      })
    )

    const { result } = renderHook(() => useFeedAPI())

    await result.current.fetchFeeds([
      { id: '1', url: 'https://example.com/rss', title: null, customTitle: null, subscribedAt: new Date().toISOString(), lastFetchedAt: null, status: 'active' }
    ])

    await waitFor(() => {
      expect(result.current.articles.length).toBeGreaterThan(0)
    })

    expect(result.current.errors).toHaveLength(0)
  })

  it('APIエラーを処理する', async () => {
    server.use(
      http.post('*/api/parse', () => {
        return HttpResponse.json({
          feeds: [],
          errors: [
            {
              url: 'https://example.com/rss',
              message: 'Failed to fetch',
            },
          ],
        })
      })
    )

    const { result } = renderHook(() => useFeedAPI())

    await result.current.fetchFeeds([
      { id: '1', url: 'https://example.com/rss', title: null, customTitle: null, subscribedAt: new Date().toISOString(), lastFetchedAt: null, status: 'active' }
    ])

    await waitFor(() => {
      expect(result.current.errors.length).toBeGreaterThan(0)
    })

    expect(result.current.errors[0].message).toBe('Failed to fetch')
  })

  // 🔴 Red: User Story 1 - feedUrlを使用したマッチングのテスト
  describe('feedUrlマッチング（本番バグ修正）', () => {
    it('linkとfeedUrlが異なる場合、feedUrlでマッチングする（Rebuild.fmの実例）', async () => {
      server.use(
        http.post('*/api/parse', () => {
          return HttpResponse.json({
            feeds: [
              {
                title: 'Rebuild',
                link: 'https://rebuild.fm', // ホームページURL
                feedUrl: 'https://feeds.rebuild.fm/rebuildfm', // 実際のRSSフィードURL
                articles: [
                  {
                    title: 'Episode 400',
                    link: 'https://rebuild.fm/400/',
                    pubDate: '2025-01-15T10:00:00Z',
                    summary: 'Test episode',
                  },
                ],
              },
            ],
            errors: [],
          })
        })
      )

      const { result } = renderHook(() => useFeedAPI())

      await result.current.fetchFeeds([
        {
          id: '1',
          url: 'https://feeds.rebuild.fm/rebuildfm', // ユーザーが登録したURL
          title: null,
          customTitle: null,
          subscribedAt: new Date().toISOString(),
          lastFetchedAt: null,
          status: 'active',
        },
      ])

      await waitFor(() => {
        expect(result.current.articles.length).toBeGreaterThan(0)
      })

      // 検証: feedUrlでマッチングしたため、記事が取得できた
      expect(result.current.articles[0].title).toBe('Episode 400')
      expect(result.current.errors).toHaveLength(0)
    })
  })

  describe('URL/タイトルマッチング（バグ修正）', () => {
    it('3つのフィードを登録した際、API応答順序が逆でもURL正規化により正しく紐付く', async () => {
      // 購読リスト: 末尾スラッシュなし
      // API応答: 末尾スラッシュあり、かつ逆順
      // URL正規化により正しくマッチすることを確認
      server.use(
        http.post('*/api/parse', () => {
          return HttpResponse.json({
            feeds: [
              { title: 'Feed C Title', link: 'https://feed-c.com/rss/', feedUrl: 'https://feed-c.com/rss/', articles: [] },
              { title: 'Feed B Title', link: 'https://feed-b.com/rss/', feedUrl: 'https://feed-b.com/rss/', articles: [] },
              { title: 'Feed A Title', link: 'https://feed-a.com/rss/', feedUrl: 'https://feed-a.com/rss/', articles: [] },
            ],
            errors: [],
          })
        })
      )

      const { result } = renderHook(() => useFeedAPI())

      await result.current.fetchFeeds([
        { id: 'a', url: 'https://feed-a.com/rss', title: null, customTitle: null, subscribedAt: new Date().toISOString(), lastFetchedAt: null, status: 'active' },
        { id: 'b', url: 'https://feed-b.com/rss', title: null, customTitle: null, subscribedAt: new Date().toISOString(), lastFetchedAt: null, status: 'active' },
        { id: 'c', url: 'https://feed-c.com/rss', title: null, customTitle: null, subscribedAt: new Date().toISOString(), lastFetchedAt: null, status: 'active' },
      ])

      await waitFor(() => {
        expect(result.current.updatedSubscriptions.length).toBe(3)
      })

      // 各URLに対応する正しいタイトルが設定されているか確認
      const subA = result.current.updatedSubscriptions.find(s => s.id === 'a')
      const subB = result.current.updatedSubscriptions.find(s => s.id === 'b')
      const subC = result.current.updatedSubscriptions.find(s => s.id === 'c')

      expect(subA?.title).toBe('Feed A Title')
      expect(subB?.title).toBe('Feed B Title')
      expect(subC?.title).toBe('Feed C Title')
    })
  })

  // 🔴 Red: User Story 3 - URL正規化互換性テスト
  describe('URL正規化互換性（User Story 3）', () => {
    it('[T036] 末尾スラッシュの違いでマッチング成功する', async () => {
      // APIがfeedUrl="https://example.com/rss/"を返す
      // ユーザーが"https://example.com/rss"（末尾スラッシュなし）を登録
      // URL正規化により両方とも"https://example.com/rss"になるためマッチング成功
      server.use(
        http.post('*/api/parse', () => {
          return HttpResponse.json({
            feeds: [
              {
                title: 'Test Feed',
                link: 'https://example.com',
                feedUrl: 'https://example.com/rss/', // 末尾スラッシュあり
                articles: [
                  {
                    title: 'Article 1',
                    link: 'https://example.com/article1',
                    pubDate: '2025-01-01T10:00:00Z',
                    summary: 'Test summary',
                  },
                ],
              },
            ],
            errors: [],
          })
        })
      )

      const { result } = renderHook(() => useFeedAPI())

      await result.current.fetchFeeds([
        {
          id: '1',
          url: 'https://example.com/rss', // 末尾スラッシュなし
          title: null,
          customTitle: null,
          subscribedAt: new Date().toISOString(),
          lastFetchedAt: null,
          status: 'active',
        },
      ])

      await waitFor(() => {
        expect(result.current.articles.length).toBeGreaterThan(0)
      })

      // 検証: 末尾スラッシュの違いを吸収してマッチング成功
      expect(result.current.articles[0].title).toBe('Article 1')
      expect(result.current.errors).toHaveLength(0)
    })

    it('[T037] プロトコル（http/https）の違いでマッチング成功する', async () => {
      // APIがfeedUrl="http://example.com/feed"を返す
      // ユーザーが"https://example.com/feed"を登録
      // URL正規化により両方とも"https://example.com/feed"になるためマッチング成功
      server.use(
        http.post('*/api/parse', () => {
          return HttpResponse.json({
            feeds: [
              {
                title: 'HTTP Feed',
                link: 'http://example.com',
                feedUrl: 'http://example.com/feed', // httpプロトコル
                articles: [
                  {
                    title: 'HTTP Article',
                    link: 'http://example.com/article',
                    pubDate: '2025-01-01T10:00:00Z',
                    summary: 'HTTP test',
                  },
                ],
              },
            ],
            errors: [],
          })
        })
      )

      const { result } = renderHook(() => useFeedAPI())

      await result.current.fetchFeeds([
        {
          id: '1',
          url: 'https://example.com/feed', // httpsプロトコル
          title: null,
          customTitle: null,
          subscribedAt: new Date().toISOString(),
          lastFetchedAt: null,
          status: 'active',
        },
      ])

      await waitFor(() => {
        expect(result.current.articles.length).toBeGreaterThan(0)
      })

      // 検証: プロトコルの違いを吸収してマッチング成功
      expect(result.current.articles[0].title).toBe('HTTP Article')
      expect(result.current.errors).toHaveLength(0)
    })
  })
})
