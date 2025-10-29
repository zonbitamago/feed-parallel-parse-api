import { useState, useEffect } from 'react'
import type { NetworkStatus } from '../types/network'

/**
 * ネットワーク接続状態を監視するカスタムフック
 *
 * navigator.onLineを使用してオンライン/オフライン状態を検出し、
 * 状態変化時にリアルタイムで更新します。
 *
 * @returns {NetworkStatus} 現在のネットワーク接続状態
 *
 * @example
 * const { isOnline } = useNetworkStatus()
 * if (!isOnline) {
 *   console.log('オフラインです')
 * }
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [lastChecked, setLastChecked] = useState<number>(Date.now())

  useEffect(() => {
    // オンライン状態になったときのハンドラー
    const handleOnline = () => {
      setIsOnline(true)
      setLastChecked(Date.now())
    }

    // オフライン状態になったときのハンドラー
    const handleOffline = () => {
      setIsOnline(false)
      setLastChecked(Date.now())
    }

    // イベントリスナーを登録
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // クリーンアップ関数
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, lastChecked }
}
