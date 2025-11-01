/**
 * URL正規化関数
 *
 * プロトコルをhttpsに統一、www prefixを除去、末尾スラッシュを除去
 */

export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    // プロトコル正規化: httpをhttpsに変換
    urlObj.protocol = 'https:'
    // www prefix除去: 正規表現で汎用化
    urlObj.hostname = urlObj.hostname.replace(/^www\./, '')
    // 末尾スラッシュ除去: pathnameを使って汎用化
    if (urlObj.pathname.endsWith('/') && urlObj.pathname !== '/') {
      urlObj.pathname = urlObj.pathname.slice(0, -1)
    }
    return urlObj.toString()
  } catch (error) {
    console.warn('URL正規化失敗:', url, error)
    return url
  }
}
