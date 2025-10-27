import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { parseFeeds, FeedAPIError } from './feedAPI'

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('feedAPI', () => {
  describe('parseFeeds', () => {
    it('フィードを正常に解析する', async () => {
      server.use(
        http.post('*/api/parse', () => {
          return HttpResponse.json({
            feeds: [
              {
                title: 'Test Feed',
                link: 'https://example.com',
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

      const result = await parseFeeds(['https://example.com/rss'])
      expect(result.feeds).toHaveLength(1)
      expect(result.feeds[0].title).toBe('Test Feed')
      expect(result.feeds[0].articles).toHaveLength(1)
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

      const result = await parseFeeds(['https://example.com/rss'])
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toBe('Failed to fetch')
    })

    it('10秒後にタイムアウトする', async () => {
      server.use(
        http.post('*/api/parse', async () => {
          await new Promise((resolve) => setTimeout(resolve, 15000))
          return HttpResponse.json({ feeds: [], errors: [] })
        })
      )

      await expect(parseFeeds(['https://example.com/rss'])).rejects.toThrow(FeedAPIError)
    }, 12000)

    it('ネットワークエラーを処理する', async () => {
      server.use(
        http.post('*/api/parse', () => {
          return HttpResponse.error()
        })
      )

      await expect(parseFeeds(['https://example.com/rss'])).rejects.toThrow(FeedAPIError)
    })
  })
})
