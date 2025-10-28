/**
 * タイトル処理ユーティリティ
 */

/**
 * HTMLエンティティをデコード
 */
export function decodeHTMLEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * HTMLタグを除去
 */
export function stripHTMLTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/**
 * フィードタイトルのサニタイゼーション
 */
export function sanitizeFeedTitle(title: string): string {
  // 1. HTMLタグを除去
  let cleaned = stripHTMLTags(title);
  // 2. HTMLエンティティをデコード
  cleaned = decodeHTMLEntities(cleaned);
  // 3. 前後の空白を削除
  return cleaned.trim();
}

/**
 * 長いタイトルを切り詰め
 */
export function truncateTitle(title: string, maxLength: number = 100): string {
  if (title.length <= maxLength) {
    return title;
  }
  return title.slice(0, maxLength) + '...';
}