import { describe, it, expect } from 'vitest'
import { isValidFeedURL, validateSubscriptionCount } from './urlValidation'

describe('urlValidation', () => {
  describe('isValidFeedURL', () => {
    it('should accept valid HTTP URLs', () => {
      expect(isValidFeedURL('http://example.com/rss')).toBe(true)
    })

    it('should accept valid HTTPS URLs', () => {
      expect(isValidFeedURL('https://example.com/feed.xml')).toBe(true)
    })

    it('should reject invalid URLs', () => {
      expect(isValidFeedURL('not-a-url')).toBe(false)
      expect(isValidFeedURL('ftp://example.com')).toBe(false)
      expect(isValidFeedURL('')).toBe(false)
    })

    it('should reject non-HTTP protocols', () => {
      expect(isValidFeedURL('file:///path/to/file')).toBe(false)
      expect(isValidFeedURL('javascript:alert(1)')).toBe(false)
    })
  })

  describe('validateSubscriptionCount', () => {
    it('should return null if count is within limit', () => {
      expect(validateSubscriptionCount(50, 100)).toBeNull()
      expect(validateSubscriptionCount(99, 100)).toBeNull()
    })

    it('should return error message if count exceeds limit', () => {
      const result = validateSubscriptionCount(100, 100)
      expect(result).toBeTruthy()
      expect(result).toContain('100')
    })

    it('should return error message at boundary', () => {
      const result = validateSubscriptionCount(101, 100)
      expect(result).toBeTruthy()
    })
  })
})
