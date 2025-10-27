/**
 * 記事を公開日でソートするユーティリティ
 */

import type { Article } from '../types/models';

export function sortArticlesByDate(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => {
    // 日付のある記事を日付のない記事より前に配置
    if (a.pubDate && !b.pubDate) return -1;
    if (!a.pubDate && b.pubDate) return 1;

    // 両方とも日付がある場合：降順（新しい順）でソート
    if (a.pubDate && b.pubDate) {
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    }

    // 両方とも日付がnullの場合：フィード順を維持（FR-005）
    return a.feedOrder - b.feedOrder;
  });
}
