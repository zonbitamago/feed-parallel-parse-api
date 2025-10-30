/**
 * useSubscriptionListCollapse フックのユニットテスト
 *
 * TDD Red Phase: このテストは実装前に作成され、FAILすることを確認する
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSubscriptionListCollapse } from './useSubscriptionListCollapse'

describe('useSubscriptionListCollapse', () => {
  beforeEach(() => {
    // 各テスト前にlocalStorageをクリア
    localStorage.clear()
  })

  it('デフォルトで折りたたまれている状態を返す', () => {
    const { result } = renderHook(() => useSubscriptionListCollapse())

    // デフォルト値はtrue（折りたたまれている）
    expect(result.current.isCollapsed).toBe(true)
  })

  it('toggle()で状態が切り替わる', () => {
    const { result } = renderHook(() => useSubscriptionListCollapse())

    // 初期状態: 折りたたみ
    expect(result.current.isCollapsed).toBe(true)

    // toggle()を実行
    act(() => {
      result.current.toggle()
    })

    // 展開状態に変わる
    expect(result.current.isCollapsed).toBe(false)

    // もう一度toggle()
    act(() => {
      result.current.toggle()
    })

    // 折りたたみ状態に戻る
    expect(result.current.isCollapsed).toBe(true)
  })

  it('expand()で展開状態になる', () => {
    const { result } = renderHook(() => useSubscriptionListCollapse())

    // 初期状態: 折りたたみ
    expect(result.current.isCollapsed).toBe(true)

    // expand()を実行
    act(() => {
      result.current.expand()
    })

    // 展開状態になる
    expect(result.current.isCollapsed).toBe(false)

    // 既に展開されている状態でexpand()を実行
    act(() => {
      result.current.expand()
    })

    // 展開状態のまま
    expect(result.current.isCollapsed).toBe(false)
  })

  it('collapse()で折りたたみ状態になる', () => {
    const { result } = renderHook(() => useSubscriptionListCollapse())

    // まず展開する
    act(() => {
      result.current.expand()
    })
    expect(result.current.isCollapsed).toBe(false)

    // collapse()を実行
    act(() => {
      result.current.collapse()
    })

    // 折りたたみ状態になる
    expect(result.current.isCollapsed).toBe(true)

    // 既に折りたたまれている状態でcollapse()を実行
    act(() => {
      result.current.collapse()
    })

    // 折りたたみ状態のまま
    expect(result.current.isCollapsed).toBe(true)
  })

  it('localStorageに状態を永続化する', () => {
    const { result } = renderHook(() => useSubscriptionListCollapse())

    // toggle()を実行
    act(() => {
      result.current.toggle()
    })

    // localStorageに保存されている
    const stored = localStorage.getItem('rss_reader_subscriptions_collapsed')
    expect(stored).toBe('false')
  })

  it('ページリロード後も状態を復元する', () => {
    // localStorageに展開状態を保存
    localStorage.setItem('rss_reader_subscriptions_collapsed', 'false')

    // フックを初期化
    const { result } = renderHook(() => useSubscriptionListCollapse())

    // 保存された状態（展開）が復元される
    expect(result.current.isCollapsed).toBe(false)
  })

  it('localStorageに何も保存されていない場合はデフォルト値を使用', () => {
    // localStorageをクリア（何も保存されていない状態）
    localStorage.clear()

    const { result } = renderHook(() => useSubscriptionListCollapse())

    // デフォルト値（折りたたみ）が使用される
    expect(result.current.isCollapsed).toBe(true)
  })

  it('localStorageのJSONパースエラーをハンドリングする', () => {
    // 不正なJSON文字列を保存
    localStorage.setItem('rss_reader_subscriptions_collapsed', 'invalid-json')

    const { result } = renderHook(() => useSubscriptionListCollapse())

    // エラーハンドリングされ、デフォルト値が使用される
    expect(result.current.isCollapsed).toBe(true)
  })
})
