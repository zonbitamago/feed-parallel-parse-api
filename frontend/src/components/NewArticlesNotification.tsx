/**
 * NewArticlesNotification Component
 *
 * 新着記事が検出されたときに表示される通知コンポーネント
 *
 * @param visible - 通知の表示/非表示
 * @param count - 新着記事の数
 * @param onLoad - 「読み込む」ボタンクリック時のコールバック
 */

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
  if (!visible) {
    return null
  }

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4 animate-slide-down">
      <p className="font-medium">新着記事があります ({count}件)</p>
      <button
        onClick={onLoad}
        className="bg-white text-green-500 px-4 py-2 rounded font-medium hover:bg-green-50 transition-colors"
      >
        読み込む
      </button>
    </div>
  )
}
