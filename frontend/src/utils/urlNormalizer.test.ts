/**
 * URL正規化関数のテスト
 *
 * TDDサイクル1: httpをhttpsに変換
 * TDDサイクル2: ドメインを小文字化
 * TDDサイクル3: www prefixを除去
 * TDDサイクル4: 末尾スラッシュを除去
 * TDDサイクル5: クエリパラメータを保持
 * TDDサイクル6: エラーハンドリング
 * TDDサイクル7: 冪等性
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

  describe('クエリパラメータ', () => {
    it('クエリパラメータを保持する', () => {
      const input = 'http://example.com/feed?page=1&limit=10'
      const expected = 'https://example.com/feed?page=1&limit=10'
      expect(normalizeUrl(input)).toBe(expected)
    })

    it('クエリパラメータ付きURLの末尾スラッシュも除去する', () => {
      const input = 'https://example.com/feed/?page=1'
      const expected = 'https://example.com/feed?page=1'
      expect(normalizeUrl(input)).toBe(expected)
    })
  })

  describe('エラーハンドリング', () => {
    it('無効なURLの場合は元のURLを返す', () => {
      const input = 'not-a-valid-url'
      expect(normalizeUrl(input)).toBe(input)
    })
  })

  describe('冪等性', () => {
    it('2回正規化しても同じ結果になる', () => {
      const input = 'http://www.EXAMPLE.COM/feed/'
      const firstPass = normalizeUrl(input)
      const secondPass = normalizeUrl(firstPass)
      expect(firstPass).toBe(secondPass)
      expect(firstPass).toBe('https://example.com/feed')
    })
  })
})
