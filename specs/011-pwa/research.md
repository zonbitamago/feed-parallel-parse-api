# Research: PWA化（Progressive Web App対応）

**Feature**: 011-pwa
**Date**: 2025-10-29
**Status**: Complete

## 概要

RSSリーダーをPWA化するための技術調査結果。Vite環境でのPWA実装、Service Workerのキャッシュ戦略、オフライン検出方法について調査しました。

---

## 0.1 PWA実装アプローチの調査

### 調査テーマ

Vite環境でのPWA実装ベストプラクティスと、Service Workerのキャッシュ戦略を調査。

### 決定事項

**PWAプラグイン**: `vite-plugin-pwa` を使用

#### 根拠

1. **Vite公式推奨**: Vite環境でのPWA実装のデファクトスタンダード
2. **Workbox統合**: Google公式のWorkboxライブラリを内蔵
3. **開発体験**: 開発サーバーでのPWA機能テスト、自動manifest生成
4. **TypeScript対応**: 型定義が完備
5. **活発なメンテナンス**: 週次更新、Vite最新版対応

#### 検討した代替案

| 代替案 | 評価 | 不採用理由 |
|--------|------|-----------|
| 手動でService Worker作成 | ⚠️ | 複雑な設定、キャッシュ戦略の実装コストが高い |
| next-pwa（Next.js用） | ❌ | Vite環境では使用不可 |
| workbox-cli | △ | vite-plugin-pwaより設定が複雑、Viteビルドとの統合が手動 |

### 実装方針

```typescript
// vite.config.ts に追加
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // キャッシュ戦略を定義
      },
      manifest: {
        // Web App Manifestを定義
      }
    })
  ]
})
```

---

## 0.2 Service Workerのキャッシュ戦略

### 調査テーマ

アプリシェル（HTML、CSS、JS）とAPIレスポンス（フィードデータ）に最適なキャッシュ戦略を調査。

### 決定事項

**アプリシェル**: Cache First（CacheFirst） + Precache
**APIレスポンス**: Network First（NetworkFirst） with fallback

#### アプリシェル（HTML、CSS、JS）

**戦略**: Cache First + Precache

- **理由**:
  - アプリシェルは頻繁に変更されない
  - オフライン時の即座の起動が必要
  - Service Worker インストール時に事前キャッシュ（Precache）
- **動作**:
  1. Service Worker インストール時に全アセットをキャッシュ
  2. リクエスト時、まずキャッシュを確認
  3. キャッシュにあればキャッシュから返す
  4. なければネットワークから取得してキャッシュ
- **更新**:
  - Service Workerの更新時に新しいアセットを再キャッシュ
  - ユーザーに更新通知を表示

#### APIレスポンス（フィードデータ）

**戦略**: Network First with fallback

- **理由**:
  - フィードデータは新鮮さが重要
  - オフライン時のみキャッシュを使用
  - ネットワーク失敗時のUX向上
- **動作**:
  1. まずネットワークリクエストを試行
  2. 成功したらレスポンスをキャッシュして返す
  3. 失敗（オフライン）したらキャッシュから返す
  4. キャッシュもなければエラー
- **キャッシュ有効期限**: 7日間
  - 古いキャッシュは自動削除（maxEntries: 50）

#### 検討した代替案

| 戦略 | アプリシェル | APIレスポンス | 評価 |
|------|------------|--------------|------|
| Network First | ❌ | ✅ | アプリシェルで使うと初回起動が遅い |
| Cache First | ✅ | ❌ | APIで使うと古いデータを表示 |
| Stale While Revalidate | △ | △ | キャッシュと最新データの両方を返すが、RSSには不要な複雑さ |
| Network Only | ❌ | ❌ | オフライン対応できない |

### 実装方針

```typescript
// vite-plugin-pwa の設定
workbox: {
  // アプリシェル: 自動的にPrecache
  globPatterns: ['**/*.{js,css,html,ico,png,svg}'],

  // APIレスポンス: Network First
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7日間
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
}
```

---

## 0.3 オフライン検出とユーザー通知

### 調査テーマ

`navigator.onLine` APIの信頼性と、オフライン状態の検出方法、ユーザーへの通知UI設計を調査。

### 決定事項

**検出方法**: `navigator.onLine` + APIレスポンス監視のハイブリッド
**通知UI**: トースト通知（自動非表示）

#### オフライン検出

**主要手段**: `navigator.onLine` API

- **信頼性**: 80%程度（ブラウザ・OS依存）
- **制約**:
  - インターネット接続を保証しない（LANには接続しているがインターネットには未接続など）
  - 一部のブラウザで不正確
- **利点**:
  - リアルタイムで状態変化を検出
  - イベントリスナーで簡単に監視

**補助手段**: APIレスポンス監視

- **タイミング**: fetch失敗時
- **方法**: Service Workerの`fetch`イベントでネットワークエラーをキャッチ
- **利点**: 実際のネットワーク到達性を確認

#### ユーザー通知UI

**形式**: トースト通知

- **表示タイミング**:
  - オンライン→オフライン: 即座に表示
  - オフライン→オンライン: 即座に表示
- **自動非表示**:
  - オフライン通知: 手動で閉じるまで表示（重要）
  - オンライン通知: 3秒後に自動非表示
- **位置**: 画面上部中央
- **スタイル**:
  - オフライン: 黄色背景、警告アイコン
  - オンライン: 緑色背景、チェックアイコン

#### 検討した代替案

| 代替案 | 評価 | 不採用理由 |
|--------|------|-----------|
| `navigator.onLine`のみ | ⚠️ | 不正確な場合がある |
| APIポーリング | ❌ | バッテリー消費、不要なネットワークトラフィック |
| モーダルダイアログ | ❌ | ユーザー体験を阻害 |
| ステータスバー | △ | 常時表示は煩雑 |

### 実装方針

```typescript
// useNetworkStatus.ts
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

```typescript
// App.tsx でトースト通知
const isOnline = useNetworkStatus()

useEffect(() => {
  if (!isOnline) {
    showToast('オフラインです。一部の機能が制限されます。', 'warning', { autoClose: false })
  } else {
    showToast('オンラインに復帰しました', 'success', { autoClose: 3000 })
  }
}, [isOnline])
```

---

## キャッシュ容量管理

### 調査結果

**ブラウザのキャッシュ容量**:
- Chrome/Edge: ディスク空き容量の約6%（最大制限なし）
- Firefox: ディスク空き容量の約10%（最大10GB）
- Safari: 約1GB

**この機能での推定使用量**:
- アプリシェル: 約1〜2MB（JS、CSS、HTML、アイコン）
- APIキャッシュ: 約10〜20MB（50件のフィード記事、画像含まず）
- 合計: 約15〜25MB

**結論**: 通常のユーザーにとって容量不足の問題はほぼ発生しない

**対策**:
- `maxEntries: 50`でキャッシュエントリ数を制限
- `maxAgeSeconds: 7日間`で古いキャッシュを自動削除
- LRU（Least Recently Used）方式で古いエントリから削除

---

## Service Worker更新戦略

### 調査結果

**Service Workerの更新タイミング**:
1. ユーザーがアプリを起動（ページリロード）
2. ブラウザが24時間ごとに自動チェック
3. 手動で`registration.update()`を呼び出し

**更新フロー**:
1. 新しいService Workerをダウンロード
2. バックグラウンドでインストール（`waiting`状態）
3. 既存のService Workerが制御しているタブがすべて閉じられる
4. 新しいService Workerが`activate`されて制御を開始

**問題点**: ユーザーがタブを開きっぱなしだと更新が適用されない

### 決定事項

**更新通知 + 手動適用**

1. 新しいService Workerが`waiting`状態になったら通知
2. ユーザーに「更新」ボタンを表示
3. クリックすると`skipWaiting()`を呼び出し、即座に適用
4. ページをリロード

#### 実装方針

```typescript
// registerSW.ts
if (registration.waiting) {
  // 更新通知を表示
  showUpdateNotification(() => {
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
    window.location.reload()
  })
}
```

```typescript
// sw.ts
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
```

---

## HTTPS開発環境

### 調査結果

PWAの要件としてHTTPSが必須（localhost除く）。開発環境でもHTTPSが必要な理由:
- Service Worker APIはHTTPSでのみ動作（localhostは例外）
- 本番環境に近い環境でテスト
- クロスオリジンリソースの扱いをテスト

### 決定事項

**vite-plugin-pwaのdev server機能を使用**

vite-plugin-pwaは開発サーバーでのService Worker動作をサポート:
- 自己署名証明書を自動生成（オプション）
- localhostでの開発時はHTTPでもService Worker動作
- 実機テスト時のみHTTPS必要

#### 実装方針

開発時:
```bash
# localhostでテスト（HTTPでもOK）
npm run dev
```

実機テスト時（オプション）:
```bash
# HTTPSで起動（ngrokなどを使用）
npm run dev -- --host
# 別ターミナルで
ngrok http 5173
```

---

## まとめ

### 採用技術スタック

| 技術 | バージョン | 用途 |
|------|-----------|------|
| vite-plugin-pwa | 最新 | PWAビルドプラグイン |
| workbox-window | 最新 | Service Workerライフサイクル管理 |
| navigator.onLine API | ブラウザ標準 | オフライン検出 |

### キャッシュ戦略まとめ

| 対象 | 戦略 | 有効期限 |
|------|------|---------|
| アプリシェル（HTML、CSS、JS） | Cache First + Precache | Service Worker更新まで |
| APIレスポンス（フィードデータ） | Network First | 7日間、最大50件 |

### 次のステップ

Phase 1で以下を作成:
1. **data-model.md**: Web App Manifestスキーマ、Cache Storageデータ構造
2. **contracts/**: manifest-schema.json、Service Worker API仕様
3. **quickstart.md**: 開発環境セットアップ、テスト手順
