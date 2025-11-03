import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { PollingStatus } from './PollingStatus'

describe('PollingStatus', () => {
  beforeEach(() => {
    // 現在時刻を固定（2025-01-01 12:00:00）
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lastPolledAtがnullの場合は「未取得」と表示される', () => {
    // Arrange: 準備
    vi.setSystemTime(new Date('2025-01-01T12:00:00Z'))

    // Act: 実行
    render(<PollingStatus lastPolledAt={null} />)

    // Assert: 検証
    expect(screen.getByText(/未取得/i)).toBeInTheDocument()
  })

  it('lastPolledAtがある場合は相対時刻を表示する', () => {
    // Arrange: 準備
    vi.setSystemTime(new Date('2025-01-01T12:00:00Z'))
    // 3分前（180秒前）
    const threeMinutesAgo = Date.now() - 3 * 60 * 1000

    // Act: 実行
    render(<PollingStatus lastPolledAt={threeMinutesAgo} />)

    // Assert: 検証
    expect(screen.getByText(/最終取得/i)).toBeInTheDocument()
    expect(screen.getByText(/3分前/i)).toBeInTheDocument()
  })

  it('次回取得まで の時間が表示される', () => {
    // Arrange: 準備
    vi.setSystemTime(new Date('2025-01-01T12:00:00Z'))
    // 3分前（180秒前）= 次回まで7分
    const threeMinutesAgo = Date.now() - 3 * 60 * 1000

    // Act: 実行
    render(<PollingStatus lastPolledAt={threeMinutesAgo} />)

    // Assert: 検証
    expect(screen.getByText(/次回取得まで/i)).toBeInTheDocument()
    expect(screen.getByText(/7分/i)).toBeInTheDocument()
  })

  it('lastPolledAtが10分以上前の場合は「次回取得まで: まもなく」と表示される', () => {
    // Arrange: 準備
    vi.setSystemTime(new Date('2025-01-01T12:00:00Z'))
    // 11分前（660秒前）
    const elevenMinutesAgo = Date.now() - 11 * 60 * 1000

    // Act: 実行
    render(<PollingStatus lastPolledAt={elevenMinutesAgo} />)

    // Assert: 検証
    expect(screen.getByText(/次回取得まで/i)).toBeInTheDocument()
    expect(screen.getByText(/まもなく/i)).toBeInTheDocument()
  })

  it.skip('1分ごとに自動更新される', async () => {
    // Arrange: 準備
    // 初期時刻: 2025-01-01 12:00:00
    // lastPolledAt: 2025-01-01 11:57:00（3分前）→ 次回まで7分
    const initialTime = new Date('2025-01-01T12:00:00Z')
    const threeMinutesAgo = new Date('2025-01-01T11:57:00Z').getTime()

    vi.setSystemTime(initialTime)

    // Act: 実行
    render(<PollingStatus lastPolledAt={threeMinutesAgo} />)

    // Assert: 検証（初期状態: 3分経過 → 次回まで7分）
    expect(screen.getByText(/7分/i)).toBeInTheDocument()

    // Act: 1分進める（12:00:00 → 12:01:00）
    // 経過時間: 4分 → 次回まで6分
    act(() => {
      const oneMinuteLater = new Date('2025-01-01T12:01:00Z')
      vi.setSystemTime(oneMinuteLater)
      vi.advanceTimersByTime(60000)
    })

    // Assert: 検証（1分後: 4分経過 → 次回まで6分）
    await waitFor(() => {
      expect(screen.getByText(/6分/i)).toBeInTheDocument()
    })

    // Act: さらに1分進める（12:01:00 → 12:02:00）
    // 経過時間: 5分 → 次回まで5分
    act(() => {
      const twoMinutesLater = new Date('2025-01-01T12:02:00Z')
      vi.setSystemTime(twoMinutesLater)
      vi.advanceTimersByTime(60000)
    })

    // Assert: 検証（2分後: 5分経過 → 次回まで5分）
    await waitFor(() => {
      expect(screen.getByText(/5分/i)).toBeInTheDocument()
    })
  })
})
