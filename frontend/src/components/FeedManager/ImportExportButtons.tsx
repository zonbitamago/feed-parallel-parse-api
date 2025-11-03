/**
 * インポート/エクスポートボタンコンポーネント
 */

interface ImportExportButtonsProps {
  onExport: () => void
  onImport: () => void
  subscriptionCount: number  // 購読フィード数（新規追加）
}

export function ImportExportButtons({ onExport, onImport, subscriptionCount }: ImportExportButtonsProps) {
  return (
    <div className="flex gap-2 mb-4">
      <button
        type="button"
        onClick={onExport}
        disabled={subscriptionCount === 0}
        className={`
          px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors
          ${subscriptionCount === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}
        `}
      >
        エクスポート
      </button>
      <button
        type="button"
        onClick={onImport}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        インポート
      </button>
    </div>
  )
}
