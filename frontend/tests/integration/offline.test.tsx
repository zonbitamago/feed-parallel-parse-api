import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from '../../src/App'

describe('Offline Integration', () => {
  beforeEach(() => {
    // オンライン状態で開始
    vi.stubGlobal('navigator', {
      onLine: true,
      serviceWorker: {
        register: vi.fn().mockResolvedValue({})
      }
    })
  })

  it('should display offline notification when going offline', async () => {
    // このテストは失敗する（Red）- オフライン通知がまだ実装されていない
    render(<App />)

    // オフラインにする
    vi.stubGlobal('navigator', {
      onLine: false,
      serviceWorker: {
        register: vi.fn().mockResolvedValue({})
      }
    })
    window.dispatchEvent(new Event('offline'))

    await waitFor(() => {
      expect(screen.getByText(/オフラインです/i)).toBeInTheDocument()
    })
  })

  it('should display online notification when coming back online', async () => {
    // このテストは失敗する（Red）- オンライン通知がまだ実装されていない
    vi.stubGlobal('navigator', {
      onLine: false,
      serviceWorker: {
        register: vi.fn().mockResolvedValue({})
      }
    })

    render(<App />)

    // オンラインに戻る
    vi.stubGlobal('navigator', {
      onLine: true,
      serviceWorker: {
        register: vi.fn().mockResolvedValue({})
      }
    })
    window.dispatchEvent(new Event('online'))

    await waitFor(() => {
      expect(screen.getByText(/オンライン/i)).toBeInTheDocument()
    })
  })

  it('should handle fetch errors gracefully when offline', async () => {
    // このテストは失敗する（Red）
    // オフライン時のfetchエラーをテスト
    vi.stubGlobal('navigator', {
      onLine: false,
      serviceWorker: {
        register: vi.fn().mockResolvedValue({})
      }
    })

    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'))

    render(<App />)

    // フィード取得を試みる（オフライン状態）
    // エラーが適切に処理されることを確認
    await waitFor(() => {
      // アプリがクラッシュしないことを確認
      expect(screen.queryByText(/予期しないエラー/i)).not.toBeInTheDocument()
    })
  })
})
