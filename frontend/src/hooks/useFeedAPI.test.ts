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

    const { result } = renderHook(() => useFeedAPI())

    await result.current.fetchFeeds([
      { id: '1', url: 'https://example.com/rss', title: null, subscribedAt: new Date().toISOString(), lastFetchedAt: null, status: 'active' }
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
      { id: '1', url: 'https://example.com/rss', title: null, subscribedAt: new Date().toISOString(), lastFetchedAt: null, status: 'active' }
    ])

    await waitFor(() => {
      expect(result.current.errors.length).toBeGreaterThan(0)
    })

    expect(result.current.errors[0].message).toBe('Failed to fetch')
  })
})
