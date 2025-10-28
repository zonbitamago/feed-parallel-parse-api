import { useState, useEffect, useRef } from 'react'
import { isValidFeedURL, validateSubscriptionCount } from '../../utils/urlValidation'
import type { Subscription } from '../../types/models'
import { getDisplayTitle, validateCustomTitle } from '../../types/models'

interface FeedManagerProps {
  onAddFeed: (url: string) => void
  onRemoveFeed?: (id: string) => void
  onUpdateCustomTitle?: (id: string, customTitle: string) => void
  subscriptions: Subscription[]
}

export function FeedManager({ onAddFeed, onRemoveFeed, onUpdateCustomTitle, subscriptions }: FeedManagerProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  // T043: 編集状態管理
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const maxSubscriptions = 100
  const isAtLimit = subscriptions.length >= maxSubscriptions

  // リアルタイムURL検証
  useEffect(() => {
    if (url && !isValidFeedURL(url)) {
      setError('無効なURLです。http://またはhttps://で始まるURLを入力してください')
    } else {
      setError(null)
    }
  }, [url])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      return
    }

    if (!isValidFeedURL(url)) {
      setError('無効なURLです')
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
  }

  // T044: 編集モード開始
  const handleStartEdit = (subscription: Subscription) => {
    setEditingId(subscription.id)
    setEditValue(getDisplayTitle(subscription))
    setEditError(null)
  }

  // T045: 編集保存
  const handleSaveEdit = (id: string) => {
    const validation = validateCustomTitle(editValue)
    if (!validation.valid) {
      setEditError(validation.error || null)
      return
    }

    if (onUpdateCustomTitle) {
      onUpdateCustomTitle(id, editValue.trim())
    }

    setEditingId(null)
    setEditValue('')
    setEditError(null)
  }

  // T046: 編集キャンセル
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditValue('')
    setEditError(null)
  }

  // T049: キーボード操作（Enter: 保存、Escape: キャンセル）
  const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit(id)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  // 編集モード開始時にinputにフォーカス
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingId])

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
            {subscriptions.map((subscription) => {
              const isEditing = editingId === subscription.id

              return (
                <div
                  key={subscription.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1 min-w-0">
                    {/* T047: 編集モードUI */}
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => handleEditKeyDown(e, subscription.id)}
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
                            onClick={() => handleSaveEdit(subscription.id)}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            aria-label="保存"
                          >
                            保存
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                            aria-label="キャンセル"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-gray-900 truncate">
                          {getDisplayTitle(subscription)}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {subscription.url}
                        </p>
                        {subscription.status === 'error' && (
                          <p className="text-xs text-red-600 mt-1">
                            エラー: 取得に失敗しました
                          </p>
                        )}
                        {subscription.status === 'active' && subscription.lastFetchedAt && (
                          <p className="text-xs text-green-600 mt-1">
                            最終取得: {new Date(subscription.lastFetchedAt).toLocaleString('ja-JP')}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* T048: 編集ボタンと削除ボタン */}
                  {!isEditing && (
                    <div className="ml-3 flex gap-2">
                      {onUpdateCustomTitle && (
                        <button
                          onClick={() => handleStartEdit(subscription)}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          aria-label="編集"
                        >
                          編集
                        </button>
                      )}
                      {onRemoveFeed && (
                        <button
                          onClick={() => onRemoveFeed(subscription.id)}
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
            })}
          </div>
        </div>
      )}
    </div>
  )
}
