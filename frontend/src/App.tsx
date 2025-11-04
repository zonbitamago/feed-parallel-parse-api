import { useState, useEffect, useRef } from 'react'
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext'
import { ArticleProvider, useArticle } from './contexts/ArticleContext'
import { UIProvider, useUI } from './contexts/UIContext'
import { UpdateProvider, useUpdate } from './contexts/UpdateContext'
import { FeedContainer } from './containers/FeedContainer'
import { ArticleContainer } from './containers/ArticleContainer'
import { useNetworkStatus } from './hooks/useNetworkStatus'
import { useTutorial } from './hooks/useTutorial'
import { OfflineNotification } from './components/OfflineNotification'
import { OnlineNotification } from './components/OnlineNotification'
import { UpdateNotification } from './components/UpdateNotification'
import { NewArticlesNotification } from './components/NewArticlesNotification'
import { PollingStatus } from './components/PollingStatus'
import { activateUpdate } from './registerSW'

function AppContent() {
  const { state: uiState } = useUI()
  const { state: articleState, dispatch: articleDispatch } = useArticle()
  const { state: subscriptionState } = useSubscription()
  const [refreshFn, setRefreshFn] = useState<(() => void) | null>(null)
  const { isOnline } = useNetworkStatus()
  const { hasUpdate } = useUpdate()
  const { shouldShowTutorial, startTutorial } = useTutorial()
  const prevOnlineRef = useRef<boolean>(isOnline)
  const [showOnlineNotification, setShowOnlineNotification] = useState(false)

  const handleRefreshReady = (refresh: () => void) => {
    setRefreshFn(() => refresh)
  }

  // オンライン状態の変化を監視
  useEffect(() => {
    // オフライン→オンラインに変化した場合のみ通知を表示
    if (!prevOnlineRef.current && isOnline) {
      setShowOnlineNotification(true)
    }
    prevOnlineRef.current = isOnline
  }, [isOnline])

  // Service Worker更新ハンドラー
  const handleUpdate = () => {
    activateUpdate()
  }

  // 新着記事読み込みハンドラー（US2: 新着記事を手動で反映）
  const handleLoadNewArticles = () => {
    articleDispatch({ type: 'APPLY_PENDING_ARTICLES' })
  }

  // 初回表示時の自動チュートリアル表示（US1: 初回訪問時にチュートリアルを自動表示）
  useEffect(() => {
    // 購読フィードが0件 かつ チュートリアル未表示の場合に自動表示
    if (subscriptionState.subscriptions.length === 0 && shouldShowTutorial) {
      startTutorial()
    }
  }, [subscriptionState.subscriptions.length, shouldShowTutorial, startTutorial])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* オフライン通知 */}
      <OfflineNotification visible={!isOnline} />

      {/* オンライン復帰通知 */}
      <OnlineNotification visible={showOnlineNotification} />

      {/* Service Worker更新通知 */}
      <UpdateNotification visible={hasUpdate} onUpdate={handleUpdate} />

      {/* 新着記事通知（US2: 新着記事を手動で反映） */}
      <NewArticlesNotification
        visible={articleState.hasNewArticles}
        count={articleState.newArticlesCount}
        onLoad={handleLoadNewArticles}
      />

      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">RSSリーダー</h1>
            <div className="flex items-center gap-4">
              {/* ポーリング状態表示（US3: ポーリング状態の可視化） */}
              <PollingStatus
                lastPolledAt={articleState.lastPolledAt}
                isLoading={articleState.isLoading}
              />
              {/* ヘルプボタン */}
              <button
                onClick={startTutorial}
                className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="チュートリアルを表示"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="hidden sm:inline">ヘルプ</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <FeedContainer onRefreshReady={handleRefreshReady} />

        {uiState.showWelcomeScreen ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              ウェルカム！
            </h2>
            <p className="text-gray-600">
              RSSフィードのURLを追加して、記事を表示しましょう
            </p>
          </div>
        ) : (
          <ArticleContainer onRefresh={refreshFn} />
        )}
      </main>
    </div>
  )
}

function App() {
  return (
    <UpdateProvider>
      <UIProvider>
        <SubscriptionProvider>
          <ArticleProvider>
            <AppContent />
          </ArticleProvider>
        </SubscriptionProvider>
      </UIProvider>
    </UpdateProvider>
  )
}

export default App
