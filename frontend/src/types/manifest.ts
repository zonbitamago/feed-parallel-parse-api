/**
 * Web App Manifest 型定義
 * @see https://www.w3.org/TR/appmanifest/
 */

export interface WebAppManifest {
  name: string
  short_name: string
  description?: string
  start_url: string
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser'
  background_color?: string
  theme_color?: string
  orientation?: 'any' | 'portrait' | 'landscape'
  icons: IconDefinition[]
  categories?: string[]
  screenshots?: Screenshot[]
}

export interface IconDefinition {
  src: string
  sizes: string
  type: string
  purpose?: 'any' | 'maskable' | 'any maskable'
}

export interface Screenshot {
  src: string
  sizes: string
  type: string
  label?: string
}
