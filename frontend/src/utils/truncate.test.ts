import { describe, it, expect } from 'vitest'
import { truncate } from './truncate'

describe('truncate', () => {
  it('制限より短いテキストは切り詰めない', () => {
    const text = 'Short text'
    expect(truncate(text, 300)).toBe(text)
  })

  it('デフォルトで300文字ちょうどで切り詰める', () => {
    const text = 'a'.repeat(350)
    const result = truncate(text)
    expect(result.length).toBe(303) // 300 + '...'
    expect(result.endsWith('...')).toBe(true)
  })

  it('カスタム長で切り詰める', () => {
    const text = 'a'.repeat(100)
    const result = truncate(text, 50)
    expect(result.length).toBe(53) // 50 + '...'
    expect(result.endsWith('...')).toBe(true)
  })

  it('境界値ちょうどのテキストを処理する', () => {
    const text = 'a'.repeat(300)
    expect(truncate(text, 300)).toBe(text)
  })

  it('空文字列を処理する', () => {
    expect(truncate('', 300)).toBe('')
  })
})
