import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus'

describe('useNetworkStatus', () => {
  beforeEach(() => {
    // navigator.onLineの初期値を設定
    vi.stubGlobal('navigator', {
      onLine: true
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should return initial online status', () => {
    // このテストは失敗する（Red）- useNetworkStatusがまだ実装されていない
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isOnline).toBe(true)
  })

  it('should return false when navigator.onLine is false', () => {
    // このテストは失敗する（Red）
    vi.stubGlobal('navigator', {
      onLine: false
    })

    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isOnline).toBe(false)
  })

  it('should update status when online event is fired', () => {
    // このテストは失敗する（Red）
    vi.stubGlobal('navigator', {
      onLine: false
    })

    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isOnline).toBe(false)

    // オンラインイベントを発火
    act(() => {
      vi.stubGlobal('navigator', {
        onLine: true
      })
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current.isOnline).toBe(true)
  })

  it('should update status when offline event is fired', () => {
    // このテストは失敗する（Red）
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isOnline).toBe(true)

    // オフラインイベントを発火
    act(() => {
      vi.stubGlobal('navigator', {
        onLine: false
      })
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current.isOnline).toBe(false)
  })

  it('should cleanup event listeners on unmount', () => {
    // このテストは失敗する（Red）
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useNetworkStatus())

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })
})
