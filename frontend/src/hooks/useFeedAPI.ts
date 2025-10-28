import { useState, useCallback } from 'react'
import { parseFeeds } from '../services/feedAPI'
import { sortArticlesByDate } from '../utils/dateSort'
import { truncate } from '../utils/truncate'
import type { Subscription } from '../types/models'
import type { Article, FeedError } from '../types/models'

export function useFeedAPI() {
  const [articles, setArticles] = useState<Article[]>([])
  const [errors, setErrors] = useState<FeedError[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [updatedSubscriptions, setUpdatedSubscriptions] = useState<Subscription[]>([])

  const fetchFeeds = useCallback(async (subscriptions: Subscription[]) => {
    if (subscriptions.length === 0) {
      setArticles([])
      setErrors([])
      return
    }

    setIsLoading(true)
    setErrors([])

    try {
      const urls = subscriptions.map(sub => sub.url)
      const response = await parseFeeds(urls)

      // APIレスポンスをフロントエンドの記事形式に変換
      const allArticles: Article[] = []
      const updatedSubs: Subscription[] = []

      subscriptions.forEach((subscription, subIndex) => {
        // URLまたはインデックスで一致するフィードを検索
        const feed = response.feeds.find(f => f.link === subscription.url) || response.feeds[subIndex]

        if (feed) {
          // フィードタイトルを更新したSubscriptionを作成
          const updatedSubscription: Subscription = {
            ...subscription,
            title: feed.title,
          }
          updatedSubs.push(updatedSubscription)

          feed.articles.forEach((apiArticle, articleIndex) => {
            allArticles.push({
              id: `${subscription.id}-${apiArticle.link}`,
              title: apiArticle.title,
              link: apiArticle.link,
              pubDate: apiArticle.pubDate || null,
              summary: truncate(apiArticle.summary, 300),
              feedId: subscription.id,
              feedTitle: feed.title,
              feedOrder: articleIndex,
            })
          })
        } else {
          // フィードが見つからない場合はそのまま追加
          updatedSubs.push(subscription)
        }
      })

      // 更新されたSubscriptionを保存
      setUpdatedSubscriptions(updatedSubs)

      // 日付でソート
      const sorted = sortArticlesByDate(allArticles)
      setArticles(sorted)

      // エラー処理
      if (response.errors.length > 0) {
        const feedErrors: FeedError[] = response.errors.map(err => ({
          url: err.url,
          message: err.message,
          timestamp: new Date().toISOString(),
        }))
        setErrors(feedErrors)
      }
    } catch (error) {
      const feedError: FeedError = {
        url: '',
        message: error instanceof Error ? error.message : 'フィードの取得に失敗しました',
        timestamp: new Date().toISOString(),
      }
      setErrors([feedError])
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    articles,
    errors,
    isLoading,
    fetchFeeds,
    updatedSubscriptions,
  }
}
