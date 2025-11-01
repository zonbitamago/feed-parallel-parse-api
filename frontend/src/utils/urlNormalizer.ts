/**
 * URL正規化関数
 *
 * プロトコルをhttpsに統一する
 */

export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    // プロトコル正規化: httpをhttpsに変換
    urlObj.protocol = 'https:'
    return urlObj.toString()
  } catch (error) {
    console.warn('URL正規化失敗:', url, error)
    return url
  }
}
