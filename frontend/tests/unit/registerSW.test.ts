import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('registerSW', () => {
  beforeEach(() => {
    // Service Worker APIのモック
    const mockRegistration = {
      addEventListener: vi.fn(),
      installing: null,
      waiting: null,
      active: null
    } as unknown as ServiceWorkerRegistration

    vi.stubGlobal('navigator', {
      serviceWorker: {
        register: vi.fn().mockResolvedValue(mockRegistration),
        controller: null
      }
    })
  })

  it('should call navigator.serviceWorker.register with correct path', async () => {
    // このテストは失敗する（Red）- registerSW関数がまだ実装されていない
    const { registerSW } = await import('../../src/registerSW')

    await registerSW()

    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', { scope: '/' })
  })

  it('should handle registration success', async () => {
    // このテストは失敗する（Red）
    const mockRegistration = {
      addEventListener: vi.fn(),
      installing: null,
      waiting: null,
      active: null
    } as unknown as ServiceWorkerRegistration

    vi.mocked(navigator.serviceWorker.register).mockResolvedValue(mockRegistration)

    const { registerSW } = await import('../../src/registerSW')
    const result = await registerSW()

    expect(result).toBe(mockRegistration)
  })

  it('should handle registration failure', async () => {
    // このテストは失敗する（Red）
    const mockError = new Error('Registration failed')
    vi.mocked(navigator.serviceWorker.register).mockRejectedValue(mockError)

    const { registerSW } = await import('../../src/registerSW')

    await expect(registerSW()).rejects.toThrow('Registration failed')
  })

  it('should call onUpdate when Service Worker update is detected', async () => {
    // Service Worker更新検出のテスト
    const mockOnUpdate = vi.fn()
    const mockNewWorker = {
      state: 'installed',
      addEventListener: vi.fn((event, handler) => {
        if (event === 'statechange') {
          // statechangeイベントをシミュレート
          setTimeout(() => handler(), 0)
        }
      })
    }

    const mockRegistration = {
      addEventListener: vi.fn((event, handler) => {
        if (event === 'updatefound') {
          // updatefoundイベントをシミュレート
          setTimeout(() => handler(), 0)
        }
      }),
      installing: mockNewWorker,
      waiting: null,
      active: null
    } as unknown as ServiceWorkerRegistration

    vi.mocked(navigator.serviceWorker.register).mockResolvedValue(mockRegistration)
    vi.stubGlobal('navigator', {
      serviceWorker: {
        register: vi.fn().mockResolvedValue(mockRegistration),
        controller: {} // 既存のService Workerが制御中
      }
    })

    const { registerSW } = await import('../../src/registerSW')
    await registerSW(mockOnUpdate)

    // イベントハンドラーが非同期なので少し待つ
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(mockOnUpdate).toHaveBeenCalled()
  })
})
