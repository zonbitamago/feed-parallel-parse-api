import { describe, it, expect } from 'vitest'
import { isValidFeedURL, validateSubscriptionCount } from './urlValidation'

describe('urlValidation', () => {
  describe('isValidFeedURL', () => {
    it('有効なHTTP URLを受け入れる', () => {
      expect(isValidFeedURL('http://example.com/rss')).toBe(true)
    })

    it('有効なHTTPS URLを受け入れる', () => {
      expect(isValidFeedURL('https://example.com/feed.xml')).toBe(true)
    })

    it('無効なURLを拒否する', () => {
      expect(isValidFeedURL('not-a-url')).toBe(false)
      expect(isValidFeedURL('ftp://example.com')).toBe(false)
      expect(isValidFeedURL('')).toBe(false)
    })

    it('HTTP/HTTPS以外のプロトコルを拒否する', () => {
      expect(isValidFeedURL('file:///path/to/file')).toBe(false)
      expect(isValidFeedURL('javascript:alert(1)')).toBe(false)
    })
  })

  describe('validateSubscriptionCount', () => {
    it('購読数が制限内の場合はnullを返す', () => {
      expect(validateSubscriptionCount(50, 100)).toBeNull()
      expect(validateSubscriptionCount(99, 100)).toBeNull()
    })

    it('購読数が制限を超えた場合はエラーメッセージを返す', () => {
      const result = validateSubscriptionCount(100, 100)
      expect(result).toBeTruthy()
      expect(result).toContain('100')
    })

    it('境界値でエラーメッセージを返す', () => {
      const result = validateSubscriptionCount(101, 100)
      expect(result).toBeTruthy()
    })
  })
})
