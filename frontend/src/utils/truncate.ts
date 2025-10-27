/**
 * テキスト切り詰めユーティリティ
 */

export function truncate(text: string, maxLength: number = 300): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}
