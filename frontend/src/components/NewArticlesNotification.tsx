/**
 * NewArticlesNotification Component
 *
 * 新着記事が検出されたときに表示される通知コンポーネント
 *
 * @param visible - 通知の表示/非表示
 * @param count - 新着記事の数
 * @param onLoad - 「読み込む」ボタンクリック時のコールバック
 */

import { useState, useEffect } from 'react'

interface NewArticlesNotificationProps {
  visible: boolean
  count: number
  onLoad: () => void
}

export function NewArticlesNotification({
  visible,
  count,
  onLoad,
}: NewArticlesNotificationProps) {
  const [isClosing, setIsClosing] = useState(false)

  // visibleがfalseになったらフェードアウトアニメーションを開始
  useEffect(() => {
    if (!visible) {
      setIsClosing(false)
    }
  }, [visible])

  // 閉じるハンドラー（フェードアウト後にonLoadを呼ぶ）
  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onLoad()
    }, 200) // fade-outアニメーション時間と同じ
  }

  if (!visible) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-40 bg-green-500 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg flex flex-col sm:flex-row items-center gap-2 sm:gap-4 max-w-[90vw] sm:max-w-none ${
        isClosing ? 'animate-fade-out' : 'animate-slide-down'
      }`}
    >
      <p className="font-medium text-sm sm:text-base">新着記事があります ({count}件)</p>
      <button
        onClick={handleClose}
        aria-label="新着記事を読み込む"
        className="bg-white text-green-500 px-4 py-2 rounded font-medium hover:bg-green-50 transition-colors text-sm sm:text-base whitespace-nowrap"
      >
        読み込む
      </button>
    </div>
  )
}
