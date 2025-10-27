import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadSubscriptions, saveSubscriptions } from './storage'
import type { Subscription } from '../types/models'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('loadSubscriptions', () => {
    it('should return empty array if no data exists', () => {
      const result = loadSubscriptions()
      expect(result).toEqual([])
    })

    it('should load subscriptions from localStorage', () => {
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

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('rss_reader_subscriptions', 'invalid-json')
      const result = loadSubscriptions()
      expect(result).toEqual([])
    })
  })

  describe('saveSubscriptions', () => {
    it('should save subscriptions to localStorage', () => {
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

    it('should save empty array', () => {
      saveSubscriptions([])
      const saved = localStorage.getItem('rss_reader_subscriptions')
      const parsed = JSON.parse(saved!)
      expect(parsed.subscriptions).toEqual([])
    })
  })
})
