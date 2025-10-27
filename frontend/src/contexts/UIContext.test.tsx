import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { UIProvider, useUI } from './UIContext'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UIProvider>{children}</UIProvider>
)

describe('UIContext', () => {
  it('デフォルトの状態で初期化する', () => {
    const { result } = renderHook(() => useUI(), { wrapper })

    expect(result.current.state.isRefreshing).toBe(false)
    expect(result.current.state.showWelcomeScreen).toBe(true)
    expect(result.current.state.toast).toBeNull()
  })

  it('更新中の状態を設定する', () => {
    const { result } = renderHook(() => useUI(), { wrapper })

    act(() => {
      result.current.dispatch({ type: 'SET_REFRESHING', payload: true })
    })

    expect(result.current.state.isRefreshing).toBe(true)
  })

  it('ウェルカム画面の状態を設定する', () => {
    const { result } = renderHook(() => useUI(), { wrapper })

    act(() => {
      result.current.dispatch({ type: 'SET_WELCOME_SCREEN', payload: false })
    })

    expect(result.current.state.showWelcomeScreen).toBe(false)
  })

  it('トーストを表示・非表示にする', () => {
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
