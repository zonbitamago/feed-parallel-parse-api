import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTutorial } from './useTutorial'
import { driver } from 'driver.js'

// localStorageモック
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// driver.jsモック
const mockDrive = vi.fn()

vi.mock('driver.js', () => ({
  driver: vi.fn(),
}))

describe('useTutorial', () => {
  beforeEach(() => {
    // Arrange: 準備
    localStorageMock.clear()
    mockDrive.mockClear()
    vi.mocked(driver).mockClear()
    // デフォルトのモック実装を復元
    vi.mocked(driver).mockReturnValue({
      drive: mockDrive,
    } as any)
  })

  it('初回訪問時にshouldShowTutorialがtrueを返す', () => {
    // Arrange: 準備
    // localStorage is empty

    // Act: 実行
    const { result } = renderHook(() => useTutorial())

    // Assert: 検証
    expect(result.current.shouldShowTutorial).toBe(true)
  })

  it('startTutorial呼び出し後、localStorageに保存される（driver.js onDestroyedコールバック経由）', () => {
    // Arrange: 準備
    let onDestroyedCallback: (() => void) | undefined

    // driver()が呼ばれたときにonDestroyedコールバックを保存
    vi.mocked(driver).mockImplementation((config: any) => {
      onDestroyedCallback = config.onDestroyed
      return { drive: mockDrive } as any
    })

    const { result } = renderHook(() => useTutorial())

    // Act: 実行
    act(() => {
      result.current.startTutorial()
    })

    // driver.jsのonDestroyedコールバックを手動で呼ぶ（実際のチュートリアル終了をシミュレート）
    if (onDestroyedCallback) {
      act(() => {
        onDestroyedCallback()
      })
    }

    // Assert: 検証
    expect(localStorageMock.getItem('rss_reader_tutorial_seen')).toBe('true')
  })

  it('2回目訪問時にshouldShowTutorialがfalseを返す', () => {
    // Arrange: 準備
    localStorageMock.setItem('rss_reader_tutorial_seen', 'true')

    // Act: 実行
    const { result } = renderHook(() => useTutorial())

    // Assert: 検証
    expect(result.current.shouldShowTutorial).toBe(false)
  })

  it('resetTutorialでlocalStorageがクリアされる', () => {
    // Arrange: 準備
    localStorageMock.setItem('rss_reader_tutorial_seen', 'true')
    const { result } = renderHook(() => useTutorial())

    // Act: 実行
    act(() => {
      result.current.resetTutorial()
    })

    // Assert: 検証
    expect(localStorageMock.getItem('rss_reader_tutorial_seen')).toBe('false')
    expect(result.current.shouldShowTutorial).toBe(true)
  })
})
