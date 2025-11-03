import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PollingStatus } from './PollingStatus'

describe('PollingStatus', () => {
  beforeEach(() => {
    // 現在時刻を固定（2025-01-01 12:00:00）
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T12:00:00Z'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lastPolledAtがnullの場合は「未取得」と表示される', () => {
    // Arrange: 準備
    // Act: 実行
    render(<PollingStatus lastPolledAt={null} />)

    // Assert: 検証
    expect(screen.getByText(/未取得/i)).toBeInTheDocument()
  })

  it('lastPolledAtがある場合は相対時刻を表示する', () => {
    // Arrange: 準備
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
    // 11分前（660秒前）
    const elevenMinutesAgo = Date.now() - 11 * 60 * 1000

    // Act: 実行
    render(<PollingStatus lastPolledAt={elevenMinutesAgo} />)

    // Assert: 検証
    expect(screen.getByText(/次回取得まで/i)).toBeInTheDocument()
    expect(screen.getByText(/まもなく/i)).toBeInTheDocument()
  })
})
