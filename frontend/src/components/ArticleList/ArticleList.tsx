import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Article } from '../../types/models'

interface ArticleListProps {
  articles: Article[]
}

export function ArticleList({ articles }: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>記事がありません</p>
        <p className="text-sm mt-2">フィードを追加して記事を表示しましょう</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <article
          key={article.id}
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
        >
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-800 mb-2">
              {article.title}
            </h3>
          </a>
          
          <div className="text-sm text-gray-600 mb-2 flex items-center gap-3">
            <span className="font-medium">{article.feedTitle}</span>
            {article.pubDate && (
              <>
                <span>•</span>
                <time dateTime={article.pubDate}>
                  {format(new Date(article.pubDate), 'PPP', { locale: ja })}
                </time>
              </>
            )}
          </div>
          
          <p className="text-gray-700 text-sm line-clamp-3">{article.summary}</p>
        </article>
      ))}
    </div>
  )
}
