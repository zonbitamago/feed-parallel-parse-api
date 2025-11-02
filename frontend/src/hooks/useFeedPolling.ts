import { useState, useEffect } from 'react'
import type { Article, Subscription } from '../types/models'

/**
 * ポーリング状態
 */
export interface PollingState {
  pendingArticles: Article[]
  hasNewArticles: boolean
  newArticlesCount: number
  lastPolledAt: number | null
}

/**
 * useFeedPollingフックのパラメータ
 */
export interface UseFeedPollingParams {
  subscriptions: Subscription[]
  onPoll: () => void | Promise<void>
  isOnline: boolean
}

/**
 * フィードの自動ポーリングを管理するカスタムフック
 *
 * 10分間隔で自動的にフィードをポーリングし、新着記事を検出します。
 * オフライン時や購読がない場合はポーリングを停止します。
 *
 * @param params ポーリングパラメータ
 * @returns ポーリング状態
 *
 * @example
 * ```ts
 * const pollingState = useFeedPolling({
 *   subscriptions: subscriptions,
 *   onPoll: handlePoll,
 *   isOnline: isOnline,
 * })
 * ```
 */
export function useFeedPolling(params: UseFeedPollingParams): PollingState {
  const { subscriptions, onPoll, isOnline } = params

  const [pollingState] = useState<PollingState>({
    pendingArticles: [],
    hasNewArticles: false,
    newArticlesCount: 0,
    lastPolledAt: null,
  })

  useEffect(() => {
    // オフライン時または購読がない場合はポーリングしない
    if (!isOnline || subscriptions.length === 0) {
      return
    }

    // 10分間隔でポーリング
    const interval = setInterval(() => {
      onPoll()
    }, 600000) // 10分 = 600,000ミリ秒

    // クリーンアップ: タイマーをクリア（メモリリーク防止）
    return () => {
      clearInterval(interval)
    }
  }, [subscriptions, onPoll, isOnline])

  return pollingState
}
