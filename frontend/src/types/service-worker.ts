/**
 * Service Worker 型定義
 */

export interface ServiceWorkerConfig {
  scope: string
  updateViaCache?: 'none' | 'imports' | 'all'
}

export interface UpdateAvailableEvent {
  type: 'update-available'
  registration: ServiceWorkerRegistration
}

export interface OfflineReadyEvent {
  type: 'offline-ready'
}

export type ServiceWorkerMessage =
  | UpdateAvailableEvent
  | OfflineReadyEvent
  | SkipWaitingMessage

export interface SkipWaitingMessage {
  type: 'SKIP_WAITING'
}
