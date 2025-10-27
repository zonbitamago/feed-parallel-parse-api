import { useState } from 'react'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import { ArticleProvider } from './contexts/ArticleContext'
import { UIProvider, useUI } from './contexts/UIContext'
import { FeedContainer } from './containers/FeedContainer'
import { ArticleContainer } from './containers/ArticleContainer'

function AppContent() {
  const { state: uiState } = useUI()
  const [refreshFn, setRefreshFn] = useState<(() => void) | null>(null)

  const handleRefreshReady = (refresh: () => void) => {
    setRefreshFn(() => refresh)
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
    <UIProvider>
      <SubscriptionProvider>
        <ArticleProvider>
          <AppContent />
        </ArticleProvider>
      </SubscriptionProvider>
    </UIProvider>
  )
}

export default App
