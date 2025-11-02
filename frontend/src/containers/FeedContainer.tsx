import { useEffect, useCallback, useState } from 'react'
import { useSubscription } from '../contexts/SubscriptionContext'
import { useArticle } from '../contexts/ArticleContext'
import { useUI } from '../contexts/UIContext'
import { useFeedAPI } from '../hooks/useFeedAPI'
import { useFeedPolling } from '../hooks/useFeedPolling'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { loadSubscriptions, saveSubscriptions } from '../services/storage'
import { fetchFeedTitle } from '../services/feedAPI'
import { FeedManager } from '../components/FeedManager/FeedManager'
import type { Subscription, AddFeedResult } from '../types/models'
import { FEED_ERROR_MESSAGES } from '../constants/errorMessages'

interface FeedContainerProps {
  onRefreshReady?: (refresh: () => void) => void
}

export function FeedContainer({ onRefreshReady }: FeedContainerProps) {
  const { state: subState, dispatch: subDispatch } = useSubscription()
  const { dispatch: articleDispatch } = useArticle()
  const { dispatch: uiDispatch } = useUI()
  const { articles, errors, isLoading, fetchFeeds, updatedSubscriptions } = useFeedAPI()
  const [feedError, setFeedError] = useState<string | null>(null)
  const { isOnline } = useNetworkStatus()

  // ポーリング機能（US1: 新着記事の自動検出）
  const handlePoll = useCallback(() => {
    if (subState.subscriptions.length > 0) {
      fetchFeeds(subState.subscriptions)
    }
  }, [subState.subscriptions, fetchFeeds])

  const pollingState = useFeedPolling({
    subscriptions: subState.subscriptions,
    onPoll: handlePoll,
    isOnline,
  })

  // ポーリング状態をArticleContextに同期（T038-T039）
  useEffect(() => {
    if (pollingState.hasNewArticles && pollingState.pendingArticles.length > 0) {
      articleDispatch({
        type: 'SET_PENDING_ARTICLES',
        payload: pollingState.pendingArticles,
      })
    }
  }, [pollingState.hasNewArticles, pollingState.pendingArticles, articleDispatch])

  useEffect(() => {
    if (pollingState.lastPolledAt !== null) {
      articleDispatch({
        type: 'SET_LAST_POLLED_AT',
        payload: pollingState.lastPolledAt,
      })
    }
  }, [pollingState.lastPolledAt, articleDispatch])

  // マウント時にlocalStorageから購読情報を読み込む
  useEffect(() => {
    const stored = loadSubscriptions()
    if (stored.length > 0) {
      subDispatch({ type: 'LOAD_SUBSCRIPTIONS', payload: stored })
      uiDispatch({ type: 'SET_WELCOME_SCREEN', payload: false })
    }
  }, [subDispatch, uiDispatch])

  // 購読の数が変更されたらフィードを取得
  // 注: 依存配列にsubState.subscriptionsではなくlengthのみを指定することで、
  // タイトル更新時の不要な再フェッチを防止（フィード追加・削除時のみ実行）
  useEffect(() => {
    if (subState.subscriptions.length > 0) {
      fetchFeeds(subState.subscriptions)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subState.subscriptions.length, fetchFeeds])

  // API結果が変更されたら記事Contextを更新
  useEffect(() => {
    articleDispatch({ type: 'SET_LOADING', payload: isLoading })
  }, [isLoading, articleDispatch])

  useEffect(() => {
    if (articles.length > 0) {
      articleDispatch({ type: 'SET_ARTICLES', payload: articles })
    }
  }, [articles, articleDispatch])

  useEffect(() => {
    errors.forEach(error => {
      articleDispatch({ type: 'ADD_ERROR', payload: error })
    })
  }, [errors, articleDispatch])

  // フィード取得後にtitleを更新したSubscriptionを永続化
  // 重要: titleのみが変更された場合は再フェッチを避けるため、subscriptionsオブジェクトへの依存を避ける
  useEffect(() => {
    if (updatedSubscriptions.length === 0) return

    // タイトルが実際に変更されたSubscriptionのみを抽出
    const changedSubscriptions = updatedSubscriptions.filter(updatedSub => {
      const current = subState.subscriptions.find(s => s.id === updatedSub.id)
      return current && current.title !== updatedSub.title
    })

    // 変更がない場合は何もしない（無限ループ防止）
    if (changedSubscriptions.length === 0) return

    // Contextを更新
    changedSubscriptions.forEach(updatedSub => {
      subDispatch({ type: 'UPDATE_SUBSCRIPTION', payload: updatedSub })
    })

    // localStorageを更新（マージ処理）
    const mergedSubscriptions = subState.subscriptions.map(sub => {
      const updated = updatedSubscriptions.find(u => u.id === sub.id)
      return updated && updated.title !== sub.title ? updated : sub
    })
    saveSubscriptions(mergedSubscriptions)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatedSubscriptions])

  const handleRefresh = useCallback(() => {
    if (subState.subscriptions.length > 0) {
      uiDispatch({ type: 'SET_REFRESHING', payload: true })
      fetchFeeds(subState.subscriptions).finally(() => {
        uiDispatch({ type: 'SET_REFRESHING', payload: false })
      })
    }
  }, [subState.subscriptions, uiDispatch, fetchFeeds])

  // 更新関数を親コンポーネントに提供
  useEffect(() => {
    if (onRefreshReady) {
      onRefreshReady(handleRefresh)
    }
  }, [onRefreshReady, handleRefresh])

  const handleAddFeed = async (url: string): Promise<AddFeedResult> => {
    // エラーをクリア
    setFeedError(null)

    // 重複チェック
    if (subState.subscriptions.some(sub => sub.url === url)) {
      setFeedError(FEED_ERROR_MESSAGES.DUPLICATE_FEED)
      return { success: false, shouldClearInput: false }
    }

    let title = url // フォールバック値
    let hasTitleError = false

    // タイトルを取得（タイムアウト10秒）
    try {
      title = await fetchFeedTitle(url)
    } catch (error) {
      console.error('フィードタイトルの取得に失敗しました:', error)
      hasTitleError = true
      // エラー時はURLをタイトルとして使用（フォールバック）
    }

    const newSubscription: Subscription = {
      id: crypto.randomUUID(),
      url,
      title,
      customTitle: null,
      subscribedAt: new Date().toISOString(),
      lastFetchedAt: new Date().toISOString(),
      status: 'active',
    }

    const updated = [...subState.subscriptions, newSubscription]
    subDispatch({ type: 'ADD_SUBSCRIPTION', payload: newSubscription })
    saveSubscriptions(updated)
    uiDispatch({ type: 'SET_WELCOME_SCREEN', payload: false })

    // タイトル取得に失敗した場合、エラーメッセージを表示
    if (hasTitleError) {
      setFeedError(FEED_ERROR_MESSAGES.TITLE_FETCH_FAILED)
      return { success: true, shouldClearInput: true }
    }

    return { success: true, shouldClearInput: true }
  }

  const handleRemoveFeed = (id: string) => {
    const updated = subState.subscriptions.filter(sub => sub.id !== id)
    subDispatch({ type: 'REMOVE_SUBSCRIPTION', payload: id })
    saveSubscriptions(updated)

    // 全て削除した場合、ウェルカム画面を表示
    if (updated.length === 0) {
      uiDispatch({ type: 'SET_WELCOME_SCREEN', payload: true })
      articleDispatch({ type: 'SET_ARTICLES', payload: [] })
    }
  }

  // カスタムタイトル更新ハンドラー
  const handleUpdateCustomTitle = (id: string, customTitle: string) => {
    const subscription = subState.subscriptions.find(sub => sub.id === id)
    if (!subscription) return

    const updatedSubscription: Subscription = {
      ...subscription,
      customTitle,
    }

    subDispatch({ type: 'UPDATE_SUBSCRIPTION', payload: updatedSubscription })

    const updated = subState.subscriptions.map(sub =>
      sub.id === id ? updatedSubscription : sub
    )
    saveSubscriptions(updated)
  }

  return (
    <FeedManager
      onAddFeed={handleAddFeed}
      onRemoveFeed={handleRemoveFeed}
      onUpdateCustomTitle={handleUpdateCustomTitle}
      subscriptions={subState.subscriptions}
      error={feedError}
      onClearError={() => setFeedError(null)}
    />
  )
}
