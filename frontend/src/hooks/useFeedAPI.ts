import { useState, useCallback } from 'react'
import { parseFeeds } from '../services/feedAPI'
import { sortArticlesByDate } from '../utils/dateSort'
import { truncate } from '../utils/truncate'
import { normalizeUrl } from '../utils/urlNormalizer'
import type { Subscription } from '../types/models'
import type { Article, FeedError } from '../types/models'
import type { RSSFeed, APIArticle, ErrorInfo } from '../types/api'
import { FEED_ERROR_MESSAGES } from '../constants/errorMessages'

/**
 * 記事サマリーの最大文字数
 */
const ARTICLE_SUMMARY_MAX_LENGTH = 300

/**
 * フィードと購読情報を紐付ける
 *
 * URL正規化により、末尾スラッシュ、プロトコル、www prefix、ドメイン大文字小文字の違いを吸収してマッチング。
 * インデックスフォールバックは削除（誤ったマッチングの原因）。
 *
 * @param subscription 購読情報
 * @param feeds API応答のフィードリスト
 * @returns マッチしたフィード、またはundefined
 */
function findMatchingFeed(
  subscription: Subscription,
  feeds: RSSFeed[]
): RSSFeed | undefined {
  const normalizedSubscriptionUrl = normalizeUrl(subscription.url)
  const matchedFeed = feeds.find(f => normalizeUrl(f.feedUrl) === normalizedSubscriptionUrl)

  if (!matchedFeed) {
    console.warn(
      `フィードマッチング失敗: subscription.url="${subscription.url}" (正規化後: "${normalizedSubscriptionUrl}")`,
      `利用可能なフィードURL:`,
      feeds.map(f => f.feedUrl)
    )
  }

  return matchedFeed
}

/**
 * Subscriptionにフィードタイトルを適用
 */
function updateSubscriptionWithTitle(subscription: Subscription, feedTitle: string): Subscription {
  return {
    ...subscription,
    title: feedTitle,
  }
}

/**
 * APIの記事データをフロントエンドの記事形式に変換
 */
function transformArticles(
  feed: RSSFeed,
  subscription: Subscription
): Article[] {
  return feed.articles.map((apiArticle: APIArticle, articleIndex: number): Article => ({
    id: `${subscription.id}-${apiArticle.link}`,
    title: apiArticle.title,
    link: apiArticle.link,
    pubDate: apiArticle.pubDate || null,
    summary: truncate(apiArticle.summary, ARTICLE_SUMMARY_MAX_LENGTH),
    feedId: subscription.id,
    feedTitle: feed.title,
    feedOrder: articleIndex,
  }))
}

/**
 * APIエラーをFeedError形式に変換
 */
function transformErrors(errors: ErrorInfo[]): FeedError[] {
  return errors.map((err: ErrorInfo): FeedError => ({
    url: err.url,
    message: err.message,
    timestamp: new Date().toISOString(),
  }))
}

/**
 * キャッチした例外をFeedError形式に変換
 */
function createErrorFromException(error: unknown): FeedError {
  return {
    url: '',
    message: error instanceof Error ? error.message : FEED_ERROR_MESSAGES.FETCH_FAILED,
    timestamp: new Date().toISOString(),
  }
}

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

      const allArticles: Article[] = []
      const updatedSubs: Subscription[] = []

      // 各購読に対してフィードデータを処理
      subscriptions.forEach((subscription) => {
        const feed = findMatchingFeed(subscription, response.feeds)

        if (feed) {
          // タイトルを更新したSubscriptionを作成
          const updatedSubscription = updateSubscriptionWithTitle(subscription, feed.title)
          updatedSubs.push(updatedSubscription)

          // 記事を変換して追加
          const articles = transformArticles(feed, subscription)
          allArticles.push(...articles)
        } else {
          // フィードが見つからない場合は変更なし
          updatedSubs.push(subscription)
        }
      })

      setUpdatedSubscriptions(updatedSubs)
      setArticles(sortArticlesByDate(allArticles))

      // APIエラーを処理
      if (response.errors.length > 0) {
        setErrors(transformErrors(response.errors))
      }
    } catch (error) {
      setErrors([createErrorFromException(error)])
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
