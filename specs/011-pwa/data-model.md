# Data Model: PWA化（Progressive Web App対応）

**Feature**: 011-pwa
**Date**: 2025-10-29
**Status**: Complete

## 概要

PWA化に必要なデータ構造を定義します。Web App Manifest、Cache Storage、Service Worker状態の3つの主要なデータモデルを含みます。

---

## 1. Web App Manifest

### 構造

Web App Manifestは、アプリのメタデータを定義するJSONファイルです。

```json
{
  "name": "RSS Feed Reader",
  "short_name": "RSS Reader",
  "description": "並列処理可能なRSSフィードリーダー",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "any",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    }
  ],
  "categories": ["news", "productivity"],
  "screenshots": []
}
```

### フィールド説明

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `name` | string | ✅ | アプリの正式名称（インストール時に表示） |
| `short_name` | string | ✅ | 短縮名（ホーム画面アイコン下に表示） |
| `description` | string | ⚪ | アプリの説明文 |
| `start_url` | string | ✅ | アプリ起動時のURL（通常は`/`） |
| `display` | string | ✅ | 表示モード（`standalone`, `fullscreen`, `minimal-ui`, `browser`） |
| `background_color` | string | ⚪ | スプラッシュ画面の背景色 |
| `theme_color` | string | ⚪ | ブラウザUIのテーマカラー |
| `orientation` | string | ⚪ | 画面の向き（`any`, `portrait`, `landscape`） |
| `icons` | array | ✅ | アプリアイコンの配列 |
| `categories` | array | ⚪ | アプリのカテゴリ（アプリストア用） |
| `screenshots` | array | ⚪ | スクリーンショット（インストールプロンプト用） |

### アイコン仕様

| サイズ | ファイル名 | 用途 | 必須 |
|-------|-----------|------|------|
| 192x192 | `icon-192x192.png` | Android ホーム画面、Chrome インストールプロンプト | ✅ |
| 512x512 | `icon-512x512.png` | Android スプラッシュ画面 | ✅ |
| 180x180 | `apple-touch-icon.png` | iOS ホーム画面 | ⚪ |

**purpose**:
- `any`: 通常のアイコン
- `maskable`: Android Adaptive Iconに対応（背景が透明でも安全）

---

## 2. Cache Storage

### 構造

Cache Storageは、Service Workerが管理する2種類のキャッシュを含みます。

#### 2.1 Precache（アプリシェル）

Service Workerのインストール時に事前キャッシュされる静的アセット。

**キャッシュ名**: `workbox-precache-v2-{origin}`

```typescript
interface PrecacheEntry {
  url: string       // アセットのURL（例: '/assets/index-abc123.js'）
  revision: string  // ファイルのハッシュ値（Viteが自動生成）
}
```

**エントリ例**:
```json
[
  { "url": "/", "revision": "1234567890abcdef" },
  { "url": "/assets/index-abc123.js", "revision": "abc123" },
  { "url": "/assets/index-def456.css", "revision": "def456" },
  { "url": "/icons/icon-192x192.png", "revision": "icon192" },
  { "url": "/icons/icon-512x512.png", "revision": "icon512" }
]
```

**特徴**:
- Service Workerのバージョン管理に連動
- ファイル変更時は自動的に再キャッシュ
- 古いキャッシュは自動削除

#### 2.2 Runtime Cache（APIレスポンス）

実行時に動的にキャッシュされるAPIレスポンス。

**キャッシュ名**: `api-cache`

```typescript
interface CacheEntry {
  request: Request   // HTTPリクエスト
  response: Response // HTTPレスポンス
  timestamp: number  // キャッシュ時刻（ミリ秒）
}
```

**エントリ例**:
```
キー: Request("https://example.com/api/parse", { method: "POST", body: ... })
値: Response({
  status: 200,
  body: { items: [...] },
  headers: { "content-type": "application/json" }
})
```

**制約**:
- 最大エントリ数: 50件
- 有効期限: 7日間（604,800秒）
- 削除方式: LRU（Least Recently Used）

#### 2.3 キャッシュキー設計

| キャッシュ名 | 内容 | 更新タイミング | 削除タイミング |
|------------|------|--------------|--------------|
| `workbox-precache-v2-{origin}` | アプリシェル | Service Worker更新時 | 新バージョン activate時 |
| `api-cache` | APIレスポンス | リクエスト成功時 | 7日後 or 50件超過時 |

---

## 3. Service Worker状態

### 状態遷移図

```
[Unregistered]
    |
    | install イベント
    ↓
[Installing] ← precache実行
    |
    | install成功
    ↓
[Installed/Waiting] ← 既存SWがある場合
    |
    | skipWaiting() or 全タブ閉じる
    ↓
[Activating] ← 古いキャッシュ削除
    |
    | activate成功
    ↓
[Activated] ← fetch イベントを処理
    |
    | 新しいSWが利用可能
    ↓
[Redundant] ← 古いSWは廃棄
```

### 状態一覧

| 状態 | 説明 | ユーザーへの影響 |
|------|------|----------------|
| `installing` | Service Workerをインストール中（precache実行中） | なし |
| `installed` | インストール完了、待機中 | なし（既存SWが動作中） |
| `waiting` | 新しいSWが待機中 | 更新通知を表示 |
| `activating` | アクティベート中（古いキャッシュ削除中） | なし |
| `activated` | アクティブ、fetch イベントを処理 | Service Workerが動作中 |
| `redundant` | 廃棄済み | なし |

### Service Worker Registration

```typescript
interface ServiceWorkerRegistration {
  scope: string                    // SWのスコープ（通常は'/'）
  active: ServiceWorker | null     // アクティブなSW
  installing: ServiceWorker | null // インストール中のSW
  waiting: ServiceWorker | null    // 待機中のSW
  updatefound: () => void          // 更新検出イベント
  onupdatefound: () => void        // 更新検出ハンドラ
}
```

---

## 4. オンライン/オフライン状態

### 状態管理

```typescript
interface NetworkStatus {
  isOnline: boolean      // オンライン/オフライン状態
  lastChecked: number    // 最後にチェックした時刻（ミリ秒）
  connectionType: string // 接続タイプ（'4g', 'wifi', 'ethernet', etc.）
}
```

### 検出方法

1. **Primary**: `navigator.onLine`
   - `window.addEventListener('online', ...)`
   - `window.addEventListener('offline', ...)`

2. **Secondary**: fetch失敗の監視
   - Service Workerの`fetch`イベントでネットワークエラーをキャッチ
   - `TypeError: Failed to fetch` → オフラインと判定

### 通知UI状態

```typescript
interface ToastNotification {
  id: string           // 通知ID
  type: 'warning' | 'success' // 通知タイプ
  message: string      // 表示メッセージ
  autoClose: boolean   // 自動で閉じるか
  duration?: number    // 自動で閉じる時間（ミリ秒）
}
```

---

## 5. データフロー

### インストールフロー

```
ユーザーがアプリを開く
    ↓
[registerSW.ts] Service Workerを登録
    ↓
[sw.ts] install イベント
    ↓
Precache: アプリシェルをキャッシュ
    ↓
installed 状態に遷移
    ↓
activate イベント
    ↓
古いキャッシュを削除
    ↓
activated 状態に遷移
    ↓
fetch イベントを処理開始
```

### キャッシュ読み込みフロー（アプリシェル）

```
ユーザーがページをリクエスト
    ↓
Service Worker が fetch イベントを受信
    ↓
Precache をチェック
    ↓
キャッシュにある？
  YES → キャッシュから返す（Cache First）
  NO  → ネットワークから取得してキャッシュ
```

### キャッシュ読み込みフロー（API）

```
ユーザーがフィードを取得
    ↓
Service Worker が fetch イベントを受信
    ↓
ネットワークリクエストを試行（Network First）
    ↓
成功？
  YES → レスポンスをキャッシュして返す
  NO  → キャッシュから返す（フォールバック）
```

### 更新フロー

```
新しいバージョンをデプロイ
    ↓
ユーザーがアプリを開く（or 24時間経過）
    ↓
ブラウザが新しい Service Worker を検出
    ↓
[sw.ts] install イベント（新しいSW）
    ↓
新しいアセットを Precache
    ↓
waiting 状態に遷移
    ↓
[registerSW.ts] updatefound イベント
    ↓
ユーザーに更新通知を表示
    ↓
ユーザーが「更新」をクリック
    ↓
skipWaiting() を呼び出し
    ↓
activate イベント（新しいSW）
    ↓
古いキャッシュを削除
    ↓
ページをリロード
    ↓
新しいバージョンが適用される
```

---

## 6. 型定義（TypeScript）

### Web App Manifest

```typescript
// frontend/src/types/manifest.ts
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
```

### Service Worker

```typescript
// frontend/src/types/service-worker.ts
export interface ServiceWorkerConfig {
  scope: string
  updateViaCache: 'none' | 'imports' | 'all'
}

export interface UpdateAvailableEvent {
  type: 'update-available'
  registration: ServiceWorkerRegistration
}

export interface OfflineReadyEvent {
  type: 'offline-ready'
}
```

### Network Status

```typescript
// frontend/src/types/network.ts
export interface NetworkStatus {
  isOnline: boolean
  lastChecked: number
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g'
}
```

---

## まとめ

### 主要なデータモデル

1. **Web App Manifest**: アプリのメタデータ（名前、アイコン、表示モード）
2. **Cache Storage**: 2種類のキャッシュ（Precache、Runtime Cache）
3. **Service Worker状態**: 6つの状態遷移
4. **Network Status**: オンライン/オフライン状態

### 次のステップ

- **contracts/**: Web App ManifestのJSONスキーマを定義
- **quickstart.md**: 開発環境でのテスト手順を記述
