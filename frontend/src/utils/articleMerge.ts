import type { Article } from '../types/models'
import { sortArticlesByDate } from './dateSort'

/**
 * 最新の記事一覧から、現在の記事一覧に存在しない新着記事を抽出
 *
 * 記事IDによる重複判定を行い、Set.has()を使用してO(n+m)の複雑度で実装。
 * n = 現在の記事数、m = 最新の記事数
 *
 * @param latestArticles ポーリングで取得した最新の記事一覧
 * @param currentArticles 現在表示中の記事一覧
 * @returns 新着記事のみの配列（currentArticlesに存在しない記事）
 * @example
 * ```ts
 * const current = [{ id: '1', ... }, { id: '2', ... }]
 * const latest = [{ id: '2', ... }, { id: '3', ... }]
 * findNewArticles(latest, current) // [{ id: '3', ... }]
 * ```
 */
export function findNewArticles(
  latestArticles: Article[],
  currentArticles: Article[]
): Article[] {
  // エッジケース: 最新記事が空の場合は早期リターン
  if (latestArticles.length === 0) {
    return []
  }

  // エッジケース: 現在の記事が空の場合は最新記事をすべて返す
  if (currentArticles.length === 0) {
    return latestArticles
  }

  // 現在の記事IDのSetを作成（O(n)）
  const currentIds = new Set(currentArticles.map(a => a.id))

  // 最新記事から現在の記事に存在しないものを抽出（O(m)）
  // Set.has()はO(1)なので、全体でO(m)
  return latestArticles.filter(article => !currentIds.has(article.id))
}

/**
 * 新着記事と既存記事をマージし、日付順（降順）にソート
 *
 * 新着記事を既存記事の先頭に追加してから、sortArticlesByDate()で
 * 日付順（降順）にソートします。
 *
 * 計算量: O((n+m) log (n+m))（ソートのため）
 * n = 既存記事数、m = 新着記事数
 *
 * @param currentArticles 既存の記事一覧
 * @param newArticles 新着記事一覧
 * @returns マージ＆ソート済みの記事一覧（新しい順）
 * @example
 * ```ts
 * const current = [
 *   { id: '1', pubDate: '2025-01-01', ... },
 *   { id: '2', pubDate: '2025-01-02', ... }
 * ]
 * const newArticles = [
 *   { id: '3', pubDate: '2025-01-03', ... }
 * ]
 * mergeArticles(current, newArticles)
 * // [{ id: '3', ... }, { id: '2', ... }, { id: '1', ... }]
 * ```
 */
export function mergeArticles(
  currentArticles: Article[],
  newArticles: Article[]
): Article[] {
  // 新着記事と既存記事を結合（新着を先頭に配置）
  const merged = [...newArticles, ...currentArticles]

  // 既存のsortArticlesByDate関数を使用して日付順（降順）にソート
  return sortArticlesByDate(merged)
}
