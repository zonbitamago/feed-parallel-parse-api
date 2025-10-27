import { useEffect } from 'react'
import { useArticle } from '../contexts/ArticleContext'
import { useUI } from '../contexts/UIContext'
import { useVirtualScroll } from '../hooks/useVirtualScroll'
import { ArticleList } from '../components/ArticleList/ArticleList'
import { LoadingIndicator } from '../components/LoadingIndicator/LoadingIndicator'
import { ErrorMessage } from '../components/ErrorMessage/ErrorMessage'
import { SearchBar } from '../components/SearchBar/SearchBar'

interface ArticleContainerProps {
  onRefresh?: (() => void) | null
}

export function ArticleContainer({ onRefresh }: ArticleContainerProps) {
  const { state, dispatch } = useArticle()
  const { state: uiState } = useUI()
  const { visibleArticles, hasMore, loadMore } = useVirtualScroll(state.displayedArticles)

  const handleSearch = (query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query })
  }

  useEffect(() => {
    const handleScroll = () => {
      if (hasMore && window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadMore])

  if (state.isLoading) {
    return <LoadingIndicator />
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <div className="flex-1">
          <SearchBar onSearch={handleSearch} />
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={uiState.isRefreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {uiState.isRefreshing ? '読み込み中...' : '更新'}
          </button>
        )}
      </div>

      {state.errors.length > 0 && (
        <div className="mb-4">
          {state.errors.map((error, index) => (
            <ErrorMessage key={index} message={`${error.url}: ${error.message}`} />
          ))}
        </div>
      )}

      <ArticleList articles={visibleArticles} />

      {hasMore && (
        <div className="text-center py-4">
          <button
            onClick={loadMore}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
          >
            さらに読み込む
          </button>
        </div>
      )}
    </div>
  )
}
