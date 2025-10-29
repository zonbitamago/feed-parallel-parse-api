/**
 * Network Status 型定義
 */

export interface NetworkStatus {
  isOnline: boolean
  lastChecked: number
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g'
}
