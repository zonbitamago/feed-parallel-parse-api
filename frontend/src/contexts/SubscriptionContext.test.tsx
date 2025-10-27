import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { SubscriptionProvider, useSubscription } from './SubscriptionContext'
import type { Subscription } from '../types/models'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SubscriptionProvider>{children}</SubscriptionProvider>
)

describe('SubscriptionContext', () => {
  it('空の購読リストで初期化する', () => {
    const { result } = renderHook(() => useSubscription(), { wrapper })
    expect(result.current.state.subscriptions).toEqual([])
    expect(result.current.state.isLoading).toBe(false)
  })

  it('購読を追加する', () => {
    // 準備
    const { result } = renderHook(() => useSubscription(), { wrapper })
    const newSub: Subscription = {
      id: '1',
      url: 'https://example.com/rss',
      title: 'Test Feed',
      subscribedAt: new Date().toISOString(),
      lastFetchedAt: null,
      status: 'active',
    }

    // 実行
    act(() => {
      result.current.dispatch({ type: 'ADD_SUBSCRIPTION', payload: newSub })
    })

    // 検証
    expect(result.current.state.subscriptions).toHaveLength(1)
    expect(result.current.state.subscriptions[0]).toEqual(newSub)
  })

  it('購読を削除する', () => {
    // 準備
    const { result } = renderHook(() => useSubscription(), { wrapper })
    const sub: Subscription = {
      id: '1',
      url: 'https://example.com/rss',
      title: 'Test',
      subscribedAt: new Date().toISOString(),
      lastFetchedAt: null,
      status: 'active',
    }
    act(() => {
      result.current.dispatch({ type: 'ADD_SUBSCRIPTION', payload: sub })
    })

    // 実行
    act(() => {
      result.current.dispatch({ type: 'REMOVE_SUBSCRIPTION', payload: '1' })
    })

    // 検証
    expect(result.current.state.subscriptions).toHaveLength(0)
  })

  it('購読を更新する', () => {
    // 準備
    const { result } = renderHook(() => useSubscription(), { wrapper })
    const sub: Subscription = {
      id: '1',
      url: 'https://example.com/rss',
      title: null,
      subscribedAt: new Date().toISOString(),
      lastFetchedAt: null,
      status: 'active',
    }
    act(() => {
      result.current.dispatch({ type: 'ADD_SUBSCRIPTION', payload: sub })
    })
    const updated = { ...sub, title: 'Updated Title', status: 'error' as const }

    // 実行
    act(() => {
      result.current.dispatch({ type: 'UPDATE_SUBSCRIPTION', payload: updated })
    })

    // 検証
    expect(result.current.state.subscriptions[0].title).toBe('Updated Title')
    expect(result.current.state.subscriptions[0].status).toBe('error')
  })

  it('購読リストを読み込む', () => {
    // 準備
    const { result } = renderHook(() => useSubscription(), { wrapper })
    const subs: Subscription[] = [
      {
        id: '1',
        url: 'https://example.com/rss',
        title: 'Feed 1',
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: null,
        status: 'active',
      },
      {
        id: '2',
        url: 'https://example.com/feed.xml',
        title: 'Feed 2',
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: null,
        status: 'active',
      },
    ]

    // 実行
    act(() => {
      result.current.dispatch({ type: 'LOAD_SUBSCRIPTIONS', payload: subs })
    })

    // 検証
    expect(result.current.state.subscriptions).toHaveLength(2)
    expect(result.current.state.subscriptions).toEqual(subs)
  })
})
