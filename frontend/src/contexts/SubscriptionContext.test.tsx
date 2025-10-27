import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { SubscriptionProvider, useSubscription } from './SubscriptionContext'
import type { Subscription } from '../types/models'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SubscriptionProvider>{children}</SubscriptionProvider>
)

describe('SubscriptionContext', () => {
  it('should initialize with empty subscriptions', () => {
    const { result } = renderHook(() => useSubscription(), { wrapper })
    expect(result.current.state.subscriptions).toEqual([])
    expect(result.current.state.isLoading).toBe(false)
  })

  it('should add subscription', () => {
    const { result } = renderHook(() => useSubscription(), { wrapper })
    
    const newSub: Subscription = {
      id: '1',
      url: 'https://example.com/rss',
      title: 'Test Feed',
      subscribedAt: new Date().toISOString(),
      lastFetchedAt: null,
      status: 'active',
    }
    
    act(() => {
      result.current.dispatch({ type: 'ADD_SUBSCRIPTION', payload: newSub })
    })
    
    expect(result.current.state.subscriptions).toHaveLength(1)
    expect(result.current.state.subscriptions[0]).toEqual(newSub)
  })

  it('should remove subscription', () => {
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
    
    act(() => {
      result.current.dispatch({ type: 'REMOVE_SUBSCRIPTION', payload: '1' })
    })
    
    expect(result.current.state.subscriptions).toHaveLength(0)
  })

  it('should update subscription', () => {
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
    
    act(() => {
      result.current.dispatch({ type: 'UPDATE_SUBSCRIPTION', payload: updated })
    })
    
    expect(result.current.state.subscriptions[0].title).toBe('Updated Title')
    expect(result.current.state.subscriptions[0].status).toBe('error')
  })

  it('should load subscriptions', () => {
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
    
    act(() => {
      result.current.dispatch({ type: 'LOAD_SUBSCRIPTIONS', payload: subs })
    })
    
    expect(result.current.state.subscriptions).toHaveLength(2)
    expect(result.current.state.subscriptions).toEqual(subs)
  })
})
