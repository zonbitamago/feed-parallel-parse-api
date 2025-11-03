import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFeedPolling } from './useFeedPolling'
import type { Subscription } from '../types/models'

describe('useFeedPolling', () => {
  beforeEach(() => {
    // タイマーをモック化
    vi.useFakeTimers()
  })

  afterEach(() => {
    // タイマーをリセット
    vi.restoreAllMocks()
  })

  it('初期状態では空のPollingStateを返す', () => {
    // Arrange: 準備
    const subscriptions: Subscription[] = []
    const onPoll = vi.fn()

    // Act: 実行
    const { result } = renderHook(() =>
      useFeedPolling({
        subscriptions,
        onPoll,
        isOnline: true,
      })
    )

    // Assert: 検証
    expect(result.current.pendingArticles).toEqual([])
    expect(result.current.hasNewArticles).toBe(false)
    expect(result.current.newArticlesCount).toBe(0)
    expect(result.current.lastPolledAt).toBe(null)
  })

  it('10分（600000ms）経過後にonPollコールバックが呼ばれる', () => {
    // Arrange: 準備
    const subscriptions: Subscription[] = [
      {
        id: '1',
        url: 'https://example.com/rss',
        title: 'Test Feed',
        customTitle: null,
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: null,
        status: 'active',
      },
    ]
    const onPoll = vi.fn()

    // Act: 実行
    renderHook(() =>
      useFeedPolling({
        subscriptions,
        onPoll,
        isOnline: true,
      })
    )

    // 10分経過前は呼ばれない
    vi.advanceTimersByTime(600000 - 1)
    expect(onPoll).not.toHaveBeenCalled()

    // 10分経過後に呼ばれる
    vi.advanceTimersByTime(1)

    // Assert: 検証
    expect(onPoll).toHaveBeenCalledTimes(1)
  })

  it('オフライン時はポーリングを停止する', () => {
    // Arrange: 準備
    const subscriptions: Subscription[] = [
      {
        id: '1',
        url: 'https://example.com/rss',
        title: 'Test Feed',
        customTitle: null,
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: null,
        status: 'active',
      },
    ]
    const onPoll = vi.fn()

    // Act: 実行
    renderHook(() =>
      useFeedPolling({
        subscriptions,
        onPoll,
        isOnline: false, // オフライン
      })
    )

    // 10分経過
    vi.advanceTimersByTime(600000)

    // Assert: 検証
    expect(onPoll).not.toHaveBeenCalled()
  })

  it('購読がない場合はポーリングを停止する', () => {
    // Arrange: 準備
    const subscriptions: Subscription[] = []
    const onPoll = vi.fn()

    // Act: 実行
    renderHook(() =>
      useFeedPolling({
        subscriptions,
        onPoll,
        isOnline: true,
      })
    )

    // 10分経過
    vi.advanceTimersByTime(600000)

    // Assert: 検証
    expect(onPoll).not.toHaveBeenCalled()
  })

  it('アンマウント時にタイマーをクリアする（メモリリーク防止）', () => {
    // Arrange: 準備
    const subscriptions: Subscription[] = [
      {
        id: '1',
        url: 'https://example.com/rss',
        title: 'Test Feed',
        customTitle: null,
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: null,
        status: 'active',
      },
    ]
    const onPoll = vi.fn()

    // Act: 実行
    const { unmount } = renderHook(() =>
      useFeedPolling({
        subscriptions,
        onPoll,
        isOnline: true,
      })
    )

    // アンマウント
    unmount()

    // 10分経過してもonPollは呼ばれない
    vi.advanceTimersByTime(600000)

    // Assert: 検証
    expect(onPoll).not.toHaveBeenCalled()
  })
})
