import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('デフォルト値で初期化する', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('値を更新する', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    act(() => {
      result.current[1]('updated')
    })

    expect(result.current[0]).toBe('updated')
  })

  it('localStorageに値を永続化する', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    act(() => {
      result.current[1]('persisted')
    })

    const stored = localStorage.getItem('test-key')
    expect(stored).toBe(JSON.stringify('persisted'))
  })

  it('localStorageから既存の値を読み込む', () => {
    localStorage.setItem('test-key', JSON.stringify('existing'))

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
    expect(result.current[0]).toBe('existing')
  })

  it('複雑なオブジェクトを処理する', () => {
    const obj = { name: 'test', count: 42 }
    const { result } = renderHook(() => useLocalStorage('test-key', obj))

    expect(result.current[0]).toEqual(obj)

    act(() => {
      result.current[1]({ name: 'updated', count: 100 })
    })

    expect(result.current[0]).toEqual({ name: 'updated', count: 100 })
  })
})
