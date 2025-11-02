/**
 * インポート/エクスポートボタンコンポーネント
 */

interface ImportExportButtonsProps {
  onExport: () => void
  onImport: () => void
}

export function ImportExportButtons({ onExport, onImport }: ImportExportButtonsProps) {
  return (
    <div className="flex gap-2 mb-4">
      <button
        type="button"
        onClick={onExport}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
