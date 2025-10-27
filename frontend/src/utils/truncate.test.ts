import { describe, it, expect } from 'vitest'
import { truncate } from './truncate'

describe('truncate', () => {
  it('should not truncate text shorter than limit', () => {
    const text = 'Short text'
    expect(truncate(text, 300)).toBe(text)
  })

  it('should truncate text exactly at 300 characters by default', () => {
    const text = 'a'.repeat(350)
    const result = truncate(text)
    expect(result.length).toBe(303) // 300 + '...'
    expect(result.endsWith('...')).toBe(true)
  })

  it('should truncate at custom length', () => {
    const text = 'a'.repeat(100)
    const result = truncate(text, 50)
    expect(result.length).toBe(53) // 50 + '...'
    expect(result.endsWith('...')).toBe(true)
  })

  it('should handle text at exact boundary', () => {
    const text = 'a'.repeat(300)
    expect(truncate(text, 300)).toBe(text)
  })

  it('should handle empty string', () => {
    expect(truncate('', 300)).toBe('')
  })
})
