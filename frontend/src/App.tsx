import { useState, useEffect, useRef } from 'react'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import { ArticleProvider } from './contexts/ArticleContext'
import { UIProvider, useUI } from './contexts/UIContext'
import { UpdateProvider, useUpdate } from './contexts/UpdateContext'
import { FeedContainer } from './containers/FeedContainer'
import { ArticleContainer } from './containers/ArticleContainer'
import { useNetworkStatus } from './hooks/useNetworkStatus'
import { OfflineNotification } from './components/OfflineNotification'
import { OnlineNotification } from './components/OnlineNotification'
import { UpdateNotification } from './components/UpdateNotification'
import { activateUpdate } from './registerSW'

function AppContent() {
  const { state: uiState } = useUI()
  const [refreshFn, setRefreshFn] = useState<(() => void) | null>(null)
  const { isOnline } = useNetworkStatus()
  const { hasUpdate } = useUpdate()
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* オフライン通知 */}
      <OfflineNotification visible={!isOnline} />

      {/* オンライン復帰通知 */}
      <OnlineNotification visible={showOnlineNotification} />

      {/* Service Worker更新通知 */}
      <UpdateNotification visible={hasUpdate} onUpdate={handleUpdate} />

      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">RSSリーダー</h1>
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
