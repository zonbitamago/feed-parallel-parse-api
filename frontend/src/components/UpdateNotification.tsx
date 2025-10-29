/**
 * Service Worker更新通知コンポーネント
 *
 * アプリケーションの新しいバージョンが利用可能な場合に表示され、
 * ユーザーに更新を促します。
 *
 * @param {Object} props
 * @param {boolean} props.visible - 通知を表示するかどうか
 * @param {() => void} props.onUpdate - 更新ボタンがクリックされたときのコールバック
 *
 * @example
 * <UpdateNotification
 *   visible={hasUpdate}
 *   onUpdate={handleUpdate}
 * />
 */
interface UpdateNotificationProps {
  visible: boolean
  onUpdate: () => void
}

export function UpdateNotification({ visible, onUpdate }: UpdateNotificationProps) {
  if (!visible) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-blue-100 border-l-4 border-blue-500 text-blue-900 p-4 rounded-lg shadow-lg max-w-md"
    >
      <div className="flex items-center gap-3">
        <svg
          className="w-6 h-6 text-blue-600 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <h3 className="font-semibold">新しいバージョンが利用可能です</h3>
          <p className="text-sm mt-1">
            アプリを更新して最新機能をご利用ください。
          </p>
        </div>
        <button
          onClick={onUpdate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors flex-shrink-0"
          aria-label="更新"
        >
          更新
        </button>
      </div>
    </div>
  )
}
