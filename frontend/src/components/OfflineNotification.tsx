import { useState } from 'react'

/**
 * オフライン状態を示す通知コンポーネント
 *
 * ネットワーク接続が失われたときに表示され、ユーザーに
 * オフライン状態であることを通知します。
 * ユーザーが手動で閉じることができます。
 *
 * @param {Object} props
 * @param {boolean} props.visible - 通知を表示するかどうか
 *
 * @example
 * <OfflineNotification visible={!isOnline} />
 */
interface OfflineNotificationProps {
  visible: boolean
}

export function OfflineNotification({ visible }: OfflineNotificationProps) {
  const [dismissed, setDismissed] = useState(false)

  // 非表示状態または手動で閉じられた場合は何も表示しない
  if (!visible || dismissed) {
    return null
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-4 rounded-lg shadow-lg max-w-md"
    >
      <div className="flex items-start gap-3">
        <svg
          className="w-6 h-6 text-yellow-600 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="flex-1">
          <h3 className="font-semibold">オフラインです</h3>
          <p className="text-sm mt-1">
            ネットワーク接続が失われました。キャッシュされたコンテンツを表示しています。
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-yellow-700 hover:text-yellow-900 flex-shrink-0"
          aria-label="通知を閉じる"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
