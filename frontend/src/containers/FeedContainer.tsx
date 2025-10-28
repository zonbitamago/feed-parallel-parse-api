import { useEffect, useCallback } from 'react'
import { useSubscription } from '../contexts/SubscriptionContext'
import { useArticle } from '../contexts/ArticleContext'
import { useUI } from '../contexts/UIContext'
import { useFeedAPI } from '../hooks/useFeedAPI'
import { loadSubscriptions, saveSubscriptions } from '../services/storage'
import { FeedManager } from '../components/FeedManager/FeedManager'
import type { Subscription } from '../types/models'

interface FeedContainerProps {
  onRefreshReady?: (refresh: () => void) => void
}

export function FeedContainer({ onRefreshReady }: FeedContainerProps) {
  const { state: subState, dispatch: subDispatch } = useSubscription()
  const { dispatch: articleDispatch } = useArticle()
  const { dispatch: uiDispatch } = useUI()
  const { articles, errors, isLoading, fetchFeeds, updatedSubscriptions } = useFeedAPI()

  // マウント時にlocalStorageから購読情報を読み込む
  useEffect(() => {
    const stored = loadSubscriptions()
    if (stored.length > 0) {
      subDispatch({ type: 'LOAD_SUBSCRIPTIONS', payload: stored })
      uiDispatch({ type: 'SET_WELCOME_SCREEN', payload: false })
    }
  }, [subDispatch, uiDispatch])

  // 購読の数が変更されたらフィードを取得（titleの更新では再取得しない）
  useEffect(() => {
    if (subState.subscriptions.length > 0) {
      fetchFeeds(subState.subscriptions)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subState.subscriptions.length])

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

  const handleAddFeed = (url: string) => {
    const newSubscription: Subscription = {
      id: crypto.randomUUID(),
      url,
      title: null,
      customTitle: null,
      subscribedAt: new Date().toISOString(),
      lastFetchedAt: null,
      status: 'active',
    }

    const updated = [...subState.subscriptions, newSubscription]
    subDispatch({ type: 'ADD_SUBSCRIPTION', payload: newSubscription })
    saveSubscriptions(updated)
    uiDispatch({ type: 'SET_WELCOME_SCREEN', payload: false })
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

  return (
    <FeedManager
      onAddFeed={handleAddFeed}
      onRemoveFeed={handleRemoveFeed}
      subscriptions={subState.subscriptions}
    />
  )
}
