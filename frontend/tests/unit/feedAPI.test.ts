import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { fetchFeedTitle } from '../../src/services/feedAPI'

const API_BASE_URL = 'https://feed-parallel-parse-api.vercel.app'

// MSWサーバーのセットアップ
const server = setupServer(
  http.post(`${API_BASE_URL}/api/parse`, () => {
    return HttpResponse.json({
      feeds: [
        {
          title: 'Example Blog',
          link: 'https://example.com/feed.xml',
          articles: [],
        },
      ],
      errors: [],
    })
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('fetchFeedTitle', () => {
  it('フィードURLからタイトルを取得する', async () => {
    const title = await fetchFeedTitle('https://example.com/feed.xml')
    expect(title).toBe('Example Blog')
  })

  it('タイムアウト時にエラーをスローする', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/parse`, async () => {
        // 11秒待機（タイムアウトは10秒）
        await new Promise(resolve => setTimeout(resolve, 11000))
        return HttpResponse.json({
          feeds: [],
          errors: [],
        })
      })
    )

    await expect(fetchFeedTitle('https://example.com/feed.xml')).rejects.toThrow(
      'APIリクエストがタイムアウトしました'
    )
  }, 15000) // テスト自体のタイムアウトを15秒に設定

  it('APIエラー時にエラーをスローする', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/parse`, () => {
        return HttpResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        )
      })
    )

    await expect(fetchFeedTitle('https://example.com/feed.xml')).rejects.toThrow()
  })

  it('結果が空の場合にエラーをスローする', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/parse`, () => {
        return HttpResponse.json({
          feeds: [],
          errors: [],
        })
      })
    )

    await expect(fetchFeedTitle('https://example.com/feed.xml')).rejects.toThrow(
      'フィードのタイトルを取得できませんでした'
    )
  })
})