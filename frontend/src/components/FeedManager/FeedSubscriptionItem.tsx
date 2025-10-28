import type { Subscription } from '../../types/models'
import { FeedEditRow } from './FeedEditRow'
import { FeedDisplayRow } from './FeedDisplayRow'

interface FeedSubscriptionItemProps {
  subscription: Subscription
  isEditing: boolean
  editValue: string
  editError: string | null
  editInputRef: React.RefObject<HTMLInputElement | null>
  onStartEdit: () => void
  onSave: () => void
  onCancel: () => void
  onRemove: () => void
  onChangeValue: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  showEditButton: boolean
  showRemoveButton: boolean
}

/**
 * フィード購読アイテムコンポーネント
 *
 * 個別の購読フィードを表示・編集するための統合コンポーネント
 */
export function FeedSubscriptionItem({
  subscription,
  isEditing,
  editValue,
  editError,
  editInputRef,
  onStartEdit,
  onSave,
  onCancel,
  onRemove,
  onChangeValue,
  onKeyDown,
  showEditButton,
  showRemoveButton,
}: FeedSubscriptionItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <FeedEditRow
            editValue={editValue}
            editError={editError}
            editInputRef={editInputRef}
            onChangeValue={onChangeValue}
            onKeyDown={onKeyDown}
            onSave={onSave}
            onCancel={onCancel}
          />
        ) : (
          <FeedDisplayRow subscription={subscription} />
        )}
      </div>

      {!isEditing && (
        <div className="ml-3 flex gap-2">
          {showEditButton && (
            <button
              onClick={onStartEdit}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              aria-label="編集"
            >
              編集
            </button>
          )}
          {showRemoveButton && (
            <button
              onClick={onRemove}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              aria-label="削除"
            >
              削除
            </button>
          )}
        </div>
      )}
    </div>
  )
}