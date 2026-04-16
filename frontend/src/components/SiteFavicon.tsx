import { useState } from 'react'

interface SiteFaviconProps {
  siteUrl: string
  size?: number
  className?: string
}

/**
 * サイトのfaviconを表示するコンポーネント
 * Google S2 Favicons APIを使用してfaviconを取得する
 * 取得失敗時はデフォルトアイコンにフォールバック
 */
export function SiteFavicon({ siteUrl, size = 16, className = '' }: SiteFaviconProps) {
  const [hasError, setHasError] = useState(false)

  if (!siteUrl || hasError) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded bg-gray-200 text-gray-500 text-xs shrink-0 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        ●
      </span>
    )
  }

  let domain: string
  try {
    domain = new URL(siteUrl).hostname
  } catch {
    return (
      <span
        className={`inline-flex items-center justify-center rounded bg-gray-200 text-gray-500 text-xs shrink-0 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        ●
      </span>
    )
  }

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=${size * 2}`

  return (
    <img
      src={faviconUrl}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded ${className}`}
      loading="lazy"
      onError={() => setHasError(true)}
      aria-hidden="true"
    />
  )
}
