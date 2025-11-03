/**
 * PollingStatus Component
 *
 * ポーリング状態（最終取得時刻、次回取得まで）を表示するコンポーネント
 *
 * @param lastPolledAt - 最終ポーリング時刻（timestamp）
 * @param isLoading - ポーリング中かどうか
 */

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

interface PollingStatusProps {
  lastPolledAt: number | null
  isLoading?: boolean
}

export function PollingStatus({ lastPolledAt, isLoading = false }: PollingStatusProps) {
  const [, setTick] = useState(0) // 強制再レンダリング用

  // 1分ごとに再レンダリング
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(tick => tick + 1)
    }, 60000) // 60秒ごと

    return () => clearInterval(timer)
  }, [])

  if (lastPolledAt === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500" data-tutorial="polling-status">
        {isLoading && (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
        )}
        <span>最終取得: <span className="font-medium">未取得</span></span>
      </div>
    )
  }

  // 経過時間を計算
  const elapsedTimeMs = Date.now() - lastPolledAt

  // 相対時刻を計算（1分未満は「たった今」、1分以上は「3分前」など）
  let relativeTime: string
  if (elapsedTimeMs < 60000) {
    // 1分未満の場合は「たった今」
    relativeTime = 'たった今'
  } else {
    // 1分以上の場合はdate-fnsで相対時刻を表示
    relativeTime = formatDistanceToNow(lastPolledAt, {
      addSuffix: true,
      locale: ja,
    })
  }

  // 次回ポーリングまでの残り時間を計算
  const POLLING_INTERVAL = 10 * 60 * 1000 // 10分
  const remainingTime = POLLING_INTERVAL - elapsedTimeMs

  let nextPollingText = 'まもなく'
  if (remainingTime > 0) {
    const remainingMinutes = Math.ceil(remainingTime / 60000)
    nextPollingText = `${remainingMinutes}分`
  }

  return (
    <div className="flex items-center gap-4 text-sm text-gray-500" data-tutorial="polling-status">
      {isLoading && (
        <div className="w-4 h-4 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
      )}
      <div>
        最終取得: <span className="font-medium">{relativeTime}</span>
      </div>
      <div>
        次回取得まで: <span className="font-medium">{nextPollingText}</span>
      </div>
    </div>
  )
}
