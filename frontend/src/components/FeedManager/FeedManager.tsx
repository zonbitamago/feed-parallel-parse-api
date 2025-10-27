import { useState, useEffect } from 'react'
import { isValidFeedURL, validateSubscriptionCount } from '../../utils/urlValidation'
import type { Subscription } from '../../types/models'

interface FeedManagerProps {
  onAddFeed: (url: string) => void
  subscriptions: Subscription[]
}

export function FeedManager({ onAddFeed, subscriptions }: FeedManagerProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const maxSubscriptions = 100
  const isAtLimit = subscriptions.length >= maxSubscriptions

  // Real-time URL validation
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

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="RSSフィードのURLを入力..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isAtLimit}
          />
          {error && (
            <p className="text-red-600 text-sm mt-1">{error}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isAtLimit || !url || !!error}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
          <p className="text-sm text-gray-600">
            購読中: {subscriptions.length}/{maxSubscriptions}件
          </p>
        </div>
      )}
    </div>
  )
}
