import { useEffect, useState } from 'react'

/**
 * オンライン状態に復帰したことを示す通知コンポーネント
 *
 * ネットワーク接続が復帰したときに表示され、ユーザーに
 * オンライン状態に戻ったことを通知します。
 * 3秒後に自動的に消えます。
 *
 * @param {Object} props
 * @param {boolean} props.visible - 通知を表示するかどうか
 *
 * @example
 * <OnlineNotification visible={wasOffline && isOnline} />
 */
interface OnlineNotificationProps {
  visible: boolean
}

export function OnlineNotification({ visible }: OnlineNotificationProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)

      // 3秒後に自動的に非表示にする
      const timer = setTimeout(() => {
        setShow(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [visible])

  if (!show) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-100 border-l-4 border-green-500 text-green-900 p-4 rounded-lg shadow-lg max-w-md"
    >
      <div className="flex items-center gap-3">
        <svg
          className="w-6 h-6 text-green-600 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <h3 className="font-semibold">オンラインに戻りました</h3>
          <p className="text-sm mt-1">
            ネットワーク接続が復帰しました。
          </p>
        </div>
      </div>
    </div>
  )
}
