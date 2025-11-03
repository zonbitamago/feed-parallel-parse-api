import { useState, useEffect, useMemo } from 'react'
import { isValidFeedURL, validateSubscriptionCount } from '../../utils/urlValidation'
import type { Subscription, AddFeedResult } from '../../types/models'
import { useFeedTitleEdit } from '../../hooks/useFeedTitleEdit'
import { useFeedPreview } from '../../hooks/useFeedPreview'
import { useSubscriptionListCollapse } from '../../hooks/useSubscriptionListCollapse'
import { useImportExport } from '../../hooks/useImportExport'
import { FeedSubscriptionItem } from './FeedSubscriptionItem'
import { ImportExportButtons } from './ImportExportButtons'
import { URL_ERROR_MESSAGES } from '../../constants/errorMessages'

interface FeedManagerProps {
  onAddFeed: (url: string) => Promise<AddFeedResult>
  onRemoveFeed?: (id: string) => void
  onUpdateCustomTitle?: (id: string, customTitle: string) => void
  subscriptions: Subscription[]
  error?: string | null
  onClearError?: () => void
}

export function FeedManager({
  onAddFeed,
  onRemoveFeed,
  onUpdateCustomTitle,
  subscriptions,
  error: externalError,
  onClearError
}: FeedManagerProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  // 外部エラーと内部エラーを統合
  const displayError = externalError || error

  // カスタムタイトル編集ロジック（カスタムフックに委譲）
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

  // フィードタイトルプレビュー機能（カスタムフックに委譲）
  const {
    previewTitle,
    isLoadingPreview,
    previewError,
    fetchPreview,
    clearPreview,
  } = useFeedPreview()

  // 購読リストの折りたたみ状態管理
  const { isCollapsed, toggle } = useSubscriptionListCollapse()

  // インポート/エクスポート機能
  const { handleExport, handleImport } = useImportExport({
    onSuccess: (_message) => {
      // インポート成功時にページをリロードして反映
      window.location.reload()
    },
    onError: (error) => {
      setError(error)
    },
  })

  const maxSubscriptions = 100
  const isAtLimit = subscriptions.length >= maxSubscriptions

  // 購読リストのレンダリングをメモ化（大量データ時のパフォーマンス最適化）
  // Note: useFeedTitleEditの関数とeditInputRefは全てuseCallbackでメモ化/useRefで安定しているため、
  // 依存配列には状態（編集関連）とpropsのみを含め、メモ化された関数とrefは除外
  const subscriptionListItems = useMemo(() => {
    return subscriptions.map((subscription) => (
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
    ))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- useFeedTitleEditの関数は全てメモ化済み
  }, [
    subscriptions,
    editingId,
    editValue,
    editError,
    onRemoveFeed,
    onUpdateCustomTitle,
  ])

  // リアルタイムURL検証とプレビュー取得
  // Note: onClearErrorは条件付きで呼ばれるコールバックであり、依存配列に含める必要はない
  // これにより、2件目以降のフィード追加時にプレビューが正常に表示される（Issue #012）
  useEffect(() => {
    // 空の場合はプレビューをクリア（エラーメッセージは保持する）
    if (!url) {
      clearPreview()
      return
    }

    if (!isValidFeedURL(url)) {
      setError(URL_ERROR_MESSAGES.INVALID_URL_DETAILED)
      clearPreview()
      // 外部エラーもクリア（無効なURLに変更された場合）
      if (onClearError) {
        onClearError()
      }
    } else {
      setError(null)
      // 有効なURLの場合はプレビューを取得
      fetchPreview(url)
      // 注意: 外部エラーは、ユーザーがURLを変更して異なる有効なURLになった場合のみクリア
      // しかし、同じURLを再入力した場合（重複エラー）はエラーを保持する必要がある
      // この判定は難しいため、外部エラーのクリアはここでは行わない
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onClearErrorは条件付きで呼ばれるコールバック
  }, [url, fetchPreview, clearPreview])

  const handleSubmit = async (e: React.FormEvent) => {
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

    // フィード追加を実行（エラーはFeedContainerから外部エラーとして返される）
    const result = await onAddFeed(url.trim())

    // 結果に応じて入力をクリアするかどうかを決定
    if (result.shouldClearInput) {
      setUrl('')
      setError(null)
      clearPreview()
    }
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
            aria-invalid={!!displayError}
            aria-describedby={displayError ? "url-error" : undefined}
          />
          {displayError && (
            <p id="url-error" className="text-red-600 text-sm mt-1" role="alert">
              {displayError}
            </p>
          )}
          {/* フィードタイトルプレビュー表示UI（ローディング・成功・エラー状態） */}
          {!displayError && isLoadingPreview && (
            <div
              className="flex items-center gap-2 mt-2 px-3 py-2 bg-blue-50 rounded-md border border-blue-200"
              role="status"
              aria-live="polite"
              aria-label="フィードタイトルを取得中"
            >
              <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-blue-700">フィードタイトルを取得中...</span>
            </div>
          )}
          {!displayError && previewTitle && !isLoadingPreview && (
            <div
              className="mt-2 px-3 py-2 bg-green-50 rounded-md border border-green-200"
              role="status"
              aria-live="polite"
              aria-label={`プレビュー: ${previewTitle}`}
            >
              <p className="text-sm text-green-800">
                <span className="font-semibold">プレビュー:</span> {previewTitle}
              </p>
            </div>
          )}
          {!displayError && previewError && !isLoadingPreview && (
            <div
              className="mt-2 px-3 py-2 bg-red-50 rounded-md border border-red-200"
              role="alert"
              aria-live="assertive"
              aria-label={`エラー: ${previewError}`}
            >
              <p className="text-sm text-red-700">
                <span className="font-semibold">エラー:</span> {previewError}
              </p>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={isAtLimit || !url || !!displayError}
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
      
      {/* 購読リスト（折りたたみ可能） */}
      <div className="mt-4">
        {/* 購読件数と折りたたみボタン（購読がある場合のみ表示） */}
        {subscriptions.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">
              購読中: {subscriptions.length}/{maxSubscriptions}件
            </p>
            <button
              type="button"
              onClick={toggle}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              aria-expanded={!isCollapsed}
              aria-controls="subscription-list"
              aria-label={isCollapsed ? '購読フィードを表示' : '購読フィードを隠す'}
            >
              {isCollapsed ? '表示' : '隠す'}
            </button>
          </div>
        )}

        {/* 購読リスト本体（折りたたまれている場合は非表示） */}
        {!isCollapsed && (
          <div
            id="subscription-list"
            className="transition-all duration-300"
          >
            <ImportExportButtons
              onExport={handleExport}
              onImport={handleImport}
              subscriptionCount={subscriptions.length}
            />
            {subscriptions.length > 0 && (
              <div className="space-y-2">
                {subscriptionListItems}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
