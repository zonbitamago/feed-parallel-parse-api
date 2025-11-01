/**
 * URL正規化関数のテスト
 *
 * TDDサイクル1: httpをhttpsに変換
 */

import { describe, it, expect } from 'vitest'
import { normalizeUrl } from './urlNormalizer'

describe('normalizeUrl', () => {
  describe('プロトコル正規化', () => {
    it('httpをhttpsに変換する', () => {
      const input = 'http://example.com/feed'
      const expected = 'https://example.com/feed'
      expect(normalizeUrl(input)).toBe(expected)
    })
  })
})
