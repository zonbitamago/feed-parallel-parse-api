/**
 * Article sorting by publication date
 */

import type { Article } from '../types/models';

export function sortArticlesByDate(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => {
    // Articles with dates come before articles without dates
    if (a.pubDate && !b.pubDate) return -1;
    if (!a.pubDate && b.pubDate) return 1;
    
    // Both have dates: sort by date descending (newest first)
    if (a.pubDate && b.pubDate) {
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    }
    
    // Both have null dates: maintain feed order (FR-005)
    return a.feedOrder - b.feedOrder;
  });
}
