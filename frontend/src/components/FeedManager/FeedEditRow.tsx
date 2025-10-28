import type { RefObject } from 'react'

interface FeedEditRowProps {
  editValue: string
  editError: string | null
  editInputRef: RefObject<HTMLInputElement | null>
  onChangeValue: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onSave: () => void
  onCancel: () => void
}

/**
 * フィード編集行コンポーネント
 *
 * フィードタイトル編集時の入力フィールドとボタンを表示
 */
export function FeedEditRow({
  editValue,
  editError,
  editInputRef,
  onChangeValue,
  onKeyDown,
  onSave,
  onCancel,
}: FeedEditRowProps) {
  return (
    <div className="space-y-2">
      <input
        ref={editInputRef}
        type="text"
        value={editValue}
        onChange={(e) => onChangeValue(e.target.value)}
        onKeyDown={onKeyDown}
        className="w-full px-3 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="フィード名編集"
      />
      {editError && (
        <p className="text-red-600 text-xs" role="alert">
          {editError}
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          aria-label="保存"
        >
          保存
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          aria-label="キャンセル"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}