import { memo } from 'react'
import type { Subscription } from '../../types/models'
import { getDisplayTitle } from '../../types/models'
import { FEED_ERROR_MESSAGES } from '../../constants/errorMessages'

interface FeedDisplayRowProps {
  subscription: Subscription
}

/**
 * フィード表示行コンポーネント
 *
 * フィードのタイトル、URL、ステータスを表示
 * React.memoで最適化済み（subscriptionが変更されない限り再レンダリングを防止）
 */
export const FeedDisplayRow = memo(function FeedDisplayRow({ subscription }: FeedDisplayRowProps) {
  const displayTitle = getDisplayTitle(subscription)

  return (
    <>
      <p className="font-medium text-gray-900 truncate" title={displayTitle}>
        {displayTitle}
      </p>
      <p className="text-sm text-gray-500 truncate" title={subscription.url}>
        {subscription.url}
      </p>
      {subscription.status === 'error' && (
        <p className="text-xs text-red-600 mt-1">
          {FEED_ERROR_MESSAGES.FETCH_FAILED_DISPLAY}
        </p>
      )}
      {subscription.status === 'active' && subscription.lastFetchedAt && (
        <p className="text-xs text-green-600 mt-1">
          最終取得: {new Date(subscription.lastFetchedAt).toLocaleString('ja-JP')}
        </p>
      )}
    </>
  )
})