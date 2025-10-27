import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadSubscriptions, saveSubscriptions } from './storage'
import type { Subscription } from '../types/models'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('loadSubscriptions', () => {
    it('データが存在しない場合は空配列を返す', () => {
      const result = loadSubscriptions()
      expect(result).toEqual([])
    })

    it('localStorageから購読情報を読み込む', () => {
      const subscriptions: Subscription[] = [
        {
          id: '1',
          url: 'https://example.com/rss',
          title: 'Test Feed',
          subscribedAt: '2025-01-01T10:00:00Z',
          lastFetchedAt: null,
          status: 'active',
        },
      ]

      localStorage.setItem('rss_reader_subscriptions', JSON.stringify({ subscriptions }))

      const result = loadSubscriptions()
      expect(result).toEqual(subscriptions)
    })

    it('無効なJSONを適切に処理する', () => {
      localStorage.setItem('rss_reader_subscriptions', 'invalid-json')
      const result = loadSubscriptions()
      expect(result).toEqual([])
    })
  })

  describe('saveSubscriptions', () => {
    it('localStorageに購読情報を保存する', () => {
      const subscriptions: Subscription[] = [
        {
          id: '1',
          url: 'https://example.com/rss',
          title: 'Test Feed',
          subscribedAt: '2025-01-01T10:00:00Z',
          lastFetchedAt: null,
          status: 'active',
        },
      ]

      saveSubscriptions(subscriptions)

      const saved = localStorage.getItem('rss_reader_subscriptions')
      expect(saved).toBeTruthy()
      const parsed = JSON.parse(saved!)
      expect(parsed.subscriptions).toEqual(subscriptions)
    })

    it('空配列を保存する', () => {
      saveSubscriptions([])
      const saved = localStorage.getItem('rss_reader_subscriptions')
      const parsed = JSON.parse(saved!)
      expect(parsed.subscriptions).toEqual([])
    })
  })
})
