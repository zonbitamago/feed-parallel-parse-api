import { useState, useEffect } from 'react'
import { isValidFeedURL, validateSubscriptionCount } from '../../utils/urlValidation'
import type { Subscription } from '../../types/models'
import { useFeedTitleEdit } from '../../hooks/useFeedTitleEdit'
import { useFeedPreview } from '../../hooks/useFeedPreview'
import { FeedSubscriptionItem } from './FeedSubscriptionItem'
import { URL_ERROR_MESSAGES } from '../../constants/errorMessages'

interface FeedManagerProps {
  onAddFeed: (url: string) => void
  onRemoveFeed?: (id: string) => void
  onUpdateCustomTitle?: (id: string, customTitle: string) => void
  subscriptions: Subscription[]
}

export function FeedManager({ onAddFeed, onRemoveFeed, onUpdateCustomTitle, subscriptions }: FeedManagerProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  // T051: 編集ロジックをカスタムフックに委譲
  const {
    editingId,
    editValue,
    editError,
    editInputRef,
    startEdit,
    saveEdit,
    cancelEdit,
    handleKeyDown,
    changeEditValue,
  } = useFeedTitleEdit(onUpdateCustomTitle)

  // T064: プレビュー機能をカスタムフックに委譲
  const {
    previewTitle,
    isLoadingPreview,
    previewError,
    fetchPreview,
    clearPreview,
  } = useFeedPreview()

  const maxSubscriptions = 100
  const isAtLimit = subscriptions.length >= maxSubscriptions

  // リアルタイムURL検証とプレビュー取得
  useEffect(() => {
    if (url && !isValidFeedURL(url)) {
      setError(URL_ERROR_MESSAGES.INVALID_URL_DETAILED)
      clearPreview()
    } else {
      setError(null)
      // 有効なURLの場合はプレビューを取得
      fetchPreview(url)
    }
  }, [url, fetchPreview, clearPreview])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      return
    }

    if (!isValidFeedURL(url)) {
      setError(URL_ERROR_MESSAGES.INVALID_URL)
      return
    }

    const limitError = validateSubscriptionCount(subscriptions.length, maxSubscriptions)
    if (limitError) {
      setError(limitError)
      return
    }

    onAddFeed(url.trim())
    setUrl('')
    setError(null)
    clearPreview()
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit(e)
              }
            }}
            placeholder="RSSフィードのURLを入力..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isAtLimit}
            aria-label="フィードURL"
            aria-invalid={!!error}
            aria-describedby={error ? "url-error" : undefined}
          />
          {error && (
            <p id="url-error" className="text-red-600 text-sm mt-1" role="alert">
              {error}
            </p>
          )}
          {/* T065-T066-T069: プレビュー表示UI（成功・ローディング・エラー） */}
          {!error && isLoadingPreview && (
            <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-blue-50 rounded-md border border-blue-200">
              <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-blue-700">フィードタイトルを取得中...</span>
            </div>
          )}
          {!error && previewTitle && !isLoadingPreview && (
            <div className="mt-2 px-3 py-2 bg-green-50 rounded-md border border-green-200">
              <p className="text-sm text-green-800">
                <span className="font-semibold">プレビュー:</span> {previewTitle}
              </p>
            </div>
          )}
          {!error && previewError && !isLoadingPreview && (
            <div className="mt-2 px-3 py-2 bg-red-50 rounded-md border border-red-200">
              <p className="text-sm text-red-700">
                <span className="font-semibold">エラー:</span> {previewError}
              </p>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={isAtLimit || !url || !!error}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          aria-label="フィードを追加"
        >
          追加
        </button>
      </form>
      
      {isAtLimit && (
        <p className="text-sm text-orange-600 mt-2">
          購読数が上限（{maxSubscriptions}件）に達しています
        </p>
      )}
      
      {subscriptions.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-3">
            購読中: {subscriptions.length}/{maxSubscriptions}件
          </p>

          <div className="space-y-2">
            {subscriptions.map((subscription) => (
              <FeedSubscriptionItem
                key={subscription.id}
                subscription={subscription}
                isEditing={editingId === subscription.id}
                editValue={editValue}
                editError={editError}
                editInputRef={editInputRef}
                onStartEdit={() => startEdit(subscription)}
                onSave={() => saveEdit(subscription.id)}
                onCancel={cancelEdit}
                onRemove={() => onRemoveFeed?.(subscription.id)}
                onChangeValue={changeEditValue}
                onKeyDown={(e) => handleKeyDown(e, subscription.id)}
                showEditButton={!!onUpdateCustomTitle}
                showRemoveButton={!!onRemoveFeed}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
