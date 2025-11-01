/**
 * URL正規化関数のテスト
 *
 * TDDサイクル1: httpをhttpsに変換
 * TDDサイクル2: ドメインを小文字化
 * TDDサイクル3: www prefixを除去
 * TDDサイクル4: 末尾スラッシュを除去
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

  describe('ドメイン正規化', () => {
    it('ドメインを小文字化する', () => {
      const input = 'https://EXAMPLE.COM/feed'
      const expected = 'https://example.com/feed'
      expect(normalizeUrl(input)).toBe(expected)
    })

    it('www prefixを除去する', () => {
      const input = 'https://www.example.com/feed'
      const expected = 'https://example.com/feed'
      expect(normalizeUrl(input)).toBe(expected)
    })
  })

  describe('パス正規化', () => {
    it('末尾スラッシュを除去する', () => {
      const input = 'https://example.com/feed/'
      const expected = 'https://example.com/feed'
      expect(normalizeUrl(input)).toBe(expected)
    })
  })
})
