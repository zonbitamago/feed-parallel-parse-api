/**
 * タイトル処理ユーティリティ
 *
 * RSSフィードのタイトルに含まれるHTMLタグやエンティティを
 * 適切に処理し、ユーザーフレンドリーな表示を実現する。
 */

/**
 * デフォルトの最大タイトル長
 */
export const DEFAULT_MAX_TITLE_LENGTH = 100;

/**
 * HTMLエンティティをデコード
 *
 * @param text - デコード対象のテキスト（例: "&lt;title&gt;" → "<title>"）
 * @returns デコードされたテキスト
 *
 * @example
 * decodeHTMLEntities("&lt;Hello&gt;") // "<Hello>"
 * decodeHTMLEntities("A &amp; B") // "A & B"
 */
export function decodeHTMLEntities(text: string): string {
  if (!text) return text;

  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * HTMLタグを除去
 *
 * @param text - HTMLタグを含む可能性のあるテキスト
 * @returns HTMLタグを除去したプレーンテキスト
 *
 * @example
 * stripHTMLTags("<b>Hello</b>") // "Hello"
 * stripHTMLTags("<div>World<br /></div>") // "World"
 */
export function stripHTMLTags(text: string): string {
  if (!text) return text;

  return text.replace(/<[^>]*>/g, '');
}

/**
 * フィードタイトルのサニタイゼーション
 *
 * HTMLタグの除去、エンティティのデコード、空白の正規化を行う。
 *
 * @param title - サニタイズ対象のタイトル
 * @returns サニタイズされたタイトル
 *
 * @example
 * sanitizeFeedTitle("<b>Tech &amp; News</b>  ") // "Tech & News"
 */
export function sanitizeFeedTitle(title: string): string {
  if (!title) return title;

  // パイプライン: HTMLタグ除去 → エンティティデコード → 空白正規化
  return decodeHTMLEntities(stripHTMLTags(title)).trim();
}

/**
 * 長いタイトルを切り詰め
 *
 * @param title - 切り詰め対象のタイトル
 * @param maxLength - 最大文字数（デフォルト: 100）
 * @returns 切り詰められたタイトル（必要に応じて"..."を付加）
 *
 * @example
 * truncateTitle("Short", 100) // "Short"
 * truncateTitle("Very long title...", 10) // "Very long ..."
 */
export function truncateTitle(title: string, maxLength: number = DEFAULT_MAX_TITLE_LENGTH): string {
  if (!title || title.length <= maxLength) {
    return title;
  }
  return title.slice(0, maxLength) + '...';
}