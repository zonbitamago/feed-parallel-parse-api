# Service Worker API仕様

**Feature**: 011-pwa
**Date**: 2025-10-29
**Status**: Complete

## 概要

Service Workerのライフサイクル、イベント、メッセージングAPIの仕様を定義します。

---

## 1. Service Worker ライフサイクルAPI

### 1.1 登録（Registration）

#### `navigator.serviceWorker.register()`

**説明**: Service Workerを登録します。

**シグネチャ**:
```typescript
navigator.serviceWorker.register(
  scriptURL: string | URL,
  options?: RegistrationOptions
): Promise<ServiceWorkerRegistration>
```

**パラメータ**:
- `scriptURL`: Service Workerスクリプトのパス（例: `'/sw.js'`）
- `options.scope`: Service Workerのスコープ（デフォルト: scriptURLのディレクトリ）

**戻り値**: `ServiceWorkerRegistration` オブジェクト

**使用例**:
```typescript
const registration = await navigator.serviceWorker.register('/sw.js', {
  scope: '/'
})
```

---

### 1.2 更新検出（Update Detection）

#### `updatefound` イベント

**説明**: 新しいService Workerが検出されたときに発火します。

**イベントリスナー**:
```typescript
registration.addEventListener('updatefound', () => {
  const newWorker = registration.installing
  // 新しいService Workerの状態を監視
})
```

#### `statechange` イベント

**説明**: Service Workerの状態が変化したときに発火します。

**状態一覧**:
- `installing`: インストール中
- `installed`: インストール完了
- `activating`: アクティベート中
- `activated`: アクティベート完了
- `redundant`: 廃棄済み

**イベントリスナー**:
```typescript
newWorker.addEventListener('statechange', () => {
  if (newWorker.state === 'installed') {
    // 新しいバージョンが利用可能
  }
})
```

---

### 1.3 即座の更新適用

#### `skipWaiting()`

**説明**: 待機中のService Workerを即座にアクティベートします。

**呼び出し元**: Service Worker内部

**シグネチャ**:
```typescript
self.skipWaiting(): Promise<void>
```

**使用例**:
```typescript
// Service Worker内部（sw.ts）
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
```

#### `claim()`

**説明**: すべてのクライアント（ページ）を新しいService Workerの制御下に置きます。

**呼び出し元**: Service Worker内部（activateイベント内）

**シグネチャ**:
```typescript
self.clients.claim(): Promise<void>
```

**使用例**:
```typescript
// Service Worker内部（sw.ts）
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
```

---

## 2. キャッシュAPI

### 2.1 キャッシュの追加

#### `cache.put()`

**説明**: リクエスト-レスポンスのペアをキャッシュに追加します。

**シグネチャ**:
```typescript
cache.put(
  request: Request | string,
  response: Response
): Promise<void>
```

**使用例**:
```typescript
const cache = await caches.open('api-cache')
await cache.put(request, response.clone())
```

---

### 2.2 キャッシュの取得

#### `cache.match()`

**説明**: リクエストに一致するレスポンスをキャッシュから取得します。

**シグネチャ**:
```typescript
cache.match(
  request: Request | string,
  options?: CacheQueryOptions
): Promise<Response | undefined>
```

**使用例**:
```typescript
const cache = await caches.open('api-cache')
const cachedResponse = await cache.match(request)
if (cachedResponse) {
  return cachedResponse
}
```

---

### 2.3 キャッシュの削除

#### `caches.delete()`

**説明**: 指定した名前のキャッシュを削除します。

**シグネチャ**:
```typescript
caches.delete(cacheName: string): Promise<boolean>
```

**使用例**:
```typescript
// 古いキャッシュを削除
const cacheNames = await caches.keys()
await Promise.all(
  cacheNames
    .filter(name => name.startsWith('old-cache'))
    .map(name => caches.delete(name))
)
```

---

## 3. fetchイベント

### 3.1 ネットワークリクエストのインターセプト

**説明**: すべてのネットワークリクエストをインターセプトし、カスタムレスポンスを返すことができます。

**イベントリスナー**:
```typescript
self.addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(
    // カスタムレスポンスを返す
  )
})
```

**FetchEvent プロパティ**:
- `request`: インターセプトされたリクエスト
- `respondWith()`: カスタムレスポンスを返す
- `waitUntil()`: 非同期処理の完了を待つ

---

### 3.2 Cache First戦略

**説明**: キャッシュを優先し、なければネットワークから取得します。

**実装例**:
```typescript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse // キャッシュから返す
      }
      return fetch(event.request) // ネットワークから取得
    })
  )
})
```

---

### 3.3 Network First戦略

**説明**: ネットワークを優先し、失敗したらキャッシュから取得します。

**実装例**:
```typescript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 成功したらキャッシュに保存
        const cache = await caches.open('api-cache')
        cache.put(event.request, response.clone())
        return response
      })
      .catch(async () => {
        // 失敗したらキャッシュから返す
        const cachedResponse = await caches.match(event.request)
        if (cachedResponse) {
          return cachedResponse
        }
        throw new Error('オフラインです')
      })
  )
})
```

---

## 4. メッセージングAPI

### 4.1 クライアント → Service Worker

**説明**: クライアント（ページ）からService Workerにメッセージを送信します。

**送信側（クライアント）**:
```typescript
if (navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({
    type: 'SKIP_WAITING'
  })
}
```

**受信側（Service Worker）**:
```typescript
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
```

---

### 4.2 Service Worker → クライアント

**説明**: Service Workerからすべてのクライアントにメッセージをブロードキャストします。

**送信側（Service Worker）**:
```typescript
self.clients.matchAll().then((clients) => {
  clients.forEach((client) => {
    client.postMessage({
      type: 'CACHE_UPDATED',
      data: { ... }
    })
  })
})
```

**受信側（クライアント）**:
```typescript
navigator.serviceWorker.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_UPDATED') {
    console.log('キャッシュが更新されました', event.data)
  }
})
```

---

## 5. カスタムイベント（このプロジェクト固有）

### 5.1 `SKIP_WAITING` メッセージ

**方向**: クライアント → Service Worker

**説明**: 待機中のService Workerを即座にアクティベートします。

**メッセージ形式**:
```typescript
interface SkipWaitingMessage {
  type: 'SKIP_WAITING'
}
```

**使用例**:
```typescript
// クライアント側
navigator.serviceWorker.controller?.postMessage({
  type: 'SKIP_WAITING'
})

// Service Worker側
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
```

---

### 5.2 `UPDATE_AVAILABLE` イベント

**方向**: Service Worker → クライアント（vite-plugin-pwaが自動生成）

**説明**: 新しいバージョンが利用可能になったときに通知します。

**イベント形式**:
```typescript
interface UpdateAvailableEvent {
  type: 'update-available'
  registration: ServiceWorkerRegistration
}
```

**使用例**:
```typescript
// クライアント側（vite-plugin-pwaが提供）
import { useRegisterSW } from 'virtual:pwa-register/react'

const {
  needRefresh,
  updateServiceWorker
} = useRegisterSW({
  onNeedRefresh() {
    // 更新通知を表示
    showUpdateNotification()
  }
})
```

---

### 5.3 `OFFLINE_READY` イベント

**方向**: Service Worker → クライアント（vite-plugin-pwaが自動生成）

**説明**: オフライン対応の準備が完了したときに通知します。

**イベント形式**:
```typescript
interface OfflineReadyEvent {
  type: 'offline-ready'
}
```

**使用例**:
```typescript
// クライアント側（vite-plugin-pwaが提供）
import { useRegisterSW } from 'virtual:pwa-register/react'

const {
  offlineReady
} = useRegisterSW({
  onOfflineReady() {
    console.log('オフライン対応が完了しました')
  }
})
```

---

## 6. エラーハンドリング

### 6.1 Service Worker登録エラー

**エラーケース**:
- Service Workerスクリプトが見つからない（404）
- HTTPSでない（localhostを除く）
- スクリプトにシンタックスエラーがある

**ハンドリング例**:
```typescript
try {
  const registration = await navigator.serviceWorker.register('/sw.js')
  console.log('Service Worker登録成功', registration)
} catch (error) {
  console.error('Service Worker登録失敗', error)
  // ユーザーに通知（オプション）
}
```

---

### 6.2 fetch失敗エラー

**エラーケース**:
- ネットワーク接続がない
- APIサーバーがダウンしている
- タイムアウト

**ハンドリング例**:
```typescript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch((error) => {
        console.error('fetch失敗', error)
        // キャッシュから返す
        return caches.match(event.request)
      })
  )
})
```

---

## 7. TypeScript型定義

### Service Worker グローバルスコープ

```typescript
/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope

interface ServiceWorkerGlobalScope extends WorkerGlobalScope {
  registration: ServiceWorkerRegistration
  clients: Clients
  skipWaiting(): Promise<void>
  addEventListener(type: 'install', listener: (event: ExtendableEvent) => void): void
  addEventListener(type: 'activate', listener: (event: ExtendableEvent) => void): void
  addEventListener(type: 'fetch', listener: (event: FetchEvent) => void): void
  addEventListener(type: 'message', listener: (event: ExtendableMessageEvent) => void): void
}
```

### カスタムメッセージ型

```typescript
// frontend/src/types/service-worker-messages.ts

export type ServiceWorkerMessage =
  | SkipWaitingMessage
  | UpdateAvailableMessage
  | OfflineReadyMessage

export interface SkipWaitingMessage {
  type: 'SKIP_WAITING'
}

export interface UpdateAvailableMessage {
  type: 'UPDATE_AVAILABLE'
  registration: ServiceWorkerRegistration
}

export interface OfflineReadyMessage {
  type: 'OFFLINE_READY'
}
```

---

## まとめ

### 主要API

| API | 用途 | 呼び出し元 |
|-----|------|-----------|
| `register()` | Service Worker登録 | クライアント |
| `skipWaiting()` | 即座の更新適用 | Service Worker |
| `claim()` | クライアントの制御 | Service Worker |
| `cache.put()` | キャッシュ追加 | Service Worker |
| `cache.match()` | キャッシュ取得 | Service Worker |
| `postMessage()` | メッセージ送信 | 両方 |

### キャッシュ戦略

| 戦略 | 用途 | 実装場所 |
|------|------|---------|
| Cache First | アプリシェル | Precache（vite-plugin-pwa） |
| Network First | APIレスポンス | Runtime Caching |

### 次のステップ

- **quickstart.md**: 開発環境でのService Workerテスト手順
