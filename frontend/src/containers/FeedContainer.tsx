import { useEffect } from 'react'
import { useSubscription } from '../contexts/SubscriptionContext'
import { useArticle } from '../contexts/ArticleContext'
import { useUI } from '../contexts/UIContext'
import { useFeedAPI } from '../hooks/useFeedAPI'
import { loadSubscriptions, saveSubscriptions } from '../services/storage'
import { FeedManager } from '../components/FeedManager/FeedManager'
import type { Subscription } from '../types/models'

export function FeedContainer() {
  const { state: subState, dispatch: subDispatch } = useSubscription()
  const { dispatch: articleDispatch } = useArticle()
  const { dispatch: uiDispatch } = useUI()
  const { articles, errors, isLoading, fetchFeeds } = useFeedAPI()

  // Load subscriptions from localStorage on mount
  useEffect(() => {
    const stored = loadSubscriptions()
    if (stored.length > 0) {
      subDispatch({ type: 'LOAD_SUBSCRIPTIONS', payload: stored })
      uiDispatch({ type: 'SET_WELCOME_SCREEN', payload: false })
    }
  }, [subDispatch, uiDispatch])

  // Fetch feeds when subscriptions change
  useEffect(() => {
    if (subState.subscriptions.length > 0) {
      fetchFeeds(subState.subscriptions)
    }
  }, [subState.subscriptions, fetchFeeds])

  // Update article context when API results change
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

  const handleAddFeed = (url: string) => {
    const newSubscription: Subscription = {
      id: crypto.randomUUID(),
      url,
      title: null,
      subscribedAt: new Date().toISOString(),
      lastFetchedAt: null,
      status: 'active',
    }

    const updated = [...subState.subscriptions, newSubscription]
    subDispatch({ type: 'ADD_SUBSCRIPTION', payload: newSubscription })
    saveSubscriptions(updated)
    uiDispatch({ type: 'SET_WELCOME_SCREEN', payload: false })
  }

  return (
    <FeedManager
      onAddFeed={handleAddFeed}
      subscriptions={subState.subscriptions}
    />
  )
}
