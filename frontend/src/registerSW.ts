/**
 * Service Worker登録ロジック
 * vite-plugin-pwaが生成するService Workerを登録する
 */

/**
 * Service Worker更新コールバックの型
 */
export type UpdateCallback = () => void

/**
 * Service Workerを登録する
 * @param onUpdate - 更新が検出されたときのコールバック
 * @returns Service Worker登録オブジェクト
 * @throws Service Worker登録に失敗した場合
 */
export async function registerSW(onUpdate?: UpdateCallback): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker is not supported in this browser')
  }

  try {
    // vite-plugin-pwaが自動生成するService Workerを登録
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })

    console.log('Service Worker registered successfully', registration)

    // Service Worker更新の検出
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // 新しいService Workerがインストール済みで、古いService Workerが制御中
          // つまり、更新が利用可能
          console.log('New Service Worker available')
          if (onUpdate) {
            onUpdate()
          }
        }
      })
    })

    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    throw error
  }
}

/**
 * 待機中のService Workerをアクティブにしてページをリロードする
 */
export function activateUpdate(): void {
  if (!navigator.serviceWorker.controller) {
    console.warn('No active Service Worker found')
    return
  }

  // 待機中のService WorkerにskipWaitingメッセージを送信
  navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })

  // Service Workerの制御が変更されたらページをリロード
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}
