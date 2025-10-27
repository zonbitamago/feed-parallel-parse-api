import { useEffect } from 'react'
import { useArticle } from '../contexts/ArticleContext'
import { useVirtualScroll } from '../hooks/useVirtualScroll'
import { ArticleList } from '../components/ArticleList/ArticleList'
import { LoadingIndicator } from '../components/LoadingIndicator/LoadingIndicator'
import { ErrorMessage } from '../components/ErrorMessage/ErrorMessage'

export function ArticleContainer() {
  const { state } = useArticle()
  const { visibleArticles, hasMore, loadMore } = useVirtualScroll(state.displayedArticles)

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
