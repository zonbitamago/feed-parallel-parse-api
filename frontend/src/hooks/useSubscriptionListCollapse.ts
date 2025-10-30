/**
 * 購読一覧の折りたたみ状態管理のカスタムフック
 *
 * localStorageを利用して折りたたみ状態を永続化し、
 * ユーザーが次回訪問時にも同じ状態を維持できるようにします。
 */

import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

/**
 * 購読一覧の折りたたみ状態管理の戻り値型
 */
export interface SubscriptionListCollapseState {
  /** 現在の折りたたみ状態（true = 折りたたまれている） */
  isCollapsed: boolean
  /** 折りたたみ状態をトグル（切り替え）する関数 */
  toggle: () => void
  /** 展開状態にする関数 */
  expand: () => void
  /** 折りたたみ状態にする関数 */
  collapse: () => void
}

/**
 * 購読一覧の折りたたみ状態を管理するカスタムフック
 *
 * @returns 折りたたみ状態と操作関数
 *
 * @example
 * ```tsx
 * const { isCollapsed, toggle, expand, collapse } = useSubscriptionListCollapse()
 *
 * // ボタンで状態をトグル
 * <button onClick={toggle}>{isCollapsed ? '展開' : '折りたたむ'}</button>
 *
 * // 条件付きレンダリング
 * {!isCollapsed && <div>購読リスト</div>}
 * ```
 */
export function useSubscriptionListCollapse(): SubscriptionListCollapseState {
  // localStorageで状態を永続化（キー: rss_reader_subscriptions_collapsed、デフォルト: true）
  const [isCollapsed, setIsCollapsed] = useLocalStorage<boolean>(
    'rss_reader_subscriptions_collapsed',
    true // デフォルトで折りたたまれている
  )

  /**
   * 折りたたみ状態をトグル（切り替え）
   */
  const toggle = useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [setIsCollapsed])

  /**
   * 展開状態にする
   */
  const expand = useCallback(() => {
    setIsCollapsed(false)
  }, [setIsCollapsed])

  /**
   * 折りたたみ状態にする
   */
  const collapse = useCallback(() => {
    setIsCollapsed(true)
  }, [setIsCollapsed])

  return {
    // 状態
    isCollapsed,
    // 操作関数
    toggle,
    expand,
    collapse,
  }
}
