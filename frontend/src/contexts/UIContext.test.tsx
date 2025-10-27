import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { UIProvider, useUI } from './UIContext'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UIProvider>{children}</UIProvider>
)

describe('UIContext', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useUI(), { wrapper })
    
    expect(result.current.state.isRefreshing).toBe(false)
    expect(result.current.state.showWelcomeScreen).toBe(true)
    expect(result.current.state.toast).toBeNull()
  })

  it('should set refreshing state', () => {
    const { result } = renderHook(() => useUI(), { wrapper })
    
    act(() => {
      result.current.dispatch({ type: 'SET_REFRESHING', payload: true })
    })
    
    expect(result.current.state.isRefreshing).toBe(true)
  })

  it('should set welcome screen state', () => {
    const { result } = renderHook(() => useUI(), { wrapper })
    
    act(() => {
      result.current.dispatch({ type: 'SET_WELCOME_SCREEN', payload: false })
    })
    
    expect(result.current.state.showWelcomeScreen).toBe(false)
  })

  it('should show and hide toast', () => {
    const { result } = renderHook(() => useUI(), { wrapper })
    
    act(() => {
      result.current.dispatch({
        type: 'SHOW_TOAST',
        payload: { message: 'Test message', type: 'success' }
      })
    })
    
    expect(result.current.state.toast).toEqual({
      message: 'Test message',
      type: 'success'
    })
    
    act(() => {
      result.current.dispatch({ type: 'HIDE_TOAST' })
    })
    
    expect(result.current.state.toast).toBeNull()
  })
})
