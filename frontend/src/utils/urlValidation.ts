/**
 * RSSフィードのURL検証ユーティリティ
 */

export function isValidFeedURL(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateSubscriptionCount(
  currentCount: number,
  maxCount: number
): string | null {
  if (currentCount >= maxCount) {
    return `購読数が上限（${maxCount}件）に達しています`;
  }
  return null;
}
