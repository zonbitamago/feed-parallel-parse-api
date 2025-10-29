# Quickstart Guide: PWA開発環境セットアップ

**Feature**: 011-pwa
**Date**: 2025-10-29
**Status**: Complete

## 概要

PWA機能の開発、テスト、デバッグ手順を説明します。開発環境でのService Worker動作確認からインストールテストまでをカバーします。

---

## 前提条件

- Node.js 18+ がインストールされていること
- npm または yarn がインストールされていること
- モダンブラウザ（Chrome 90+, Edge 90+, Firefox 90+）がインストールされていること

---

## 1. 開発環境のセットアップ

### 1.1 依存関係のインストール

```bash
cd frontend
npm install
```

**追加される依存関係**:
- `vite-plugin-pwa`: PWAビルドプラグイン
- `workbox-window`: Service Workerライフサイクル管理

### 1.2 開発サーバーの起動

```bash
npm run dev
```

**起動確認**:
```
  VITE v7.1.7  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

ブラウザで http://localhost:5173/ を開きます。

---

## 2. PWA機能の動作確認

### 2.1 Service Worker の登録確認

#### Chrome DevTools で確認

1. **DevTools を開く**: `F12` または `Cmd+Option+I` (Mac)
2. **Application タブ** を選択
3. **Service Workers** セクションを確認

**期待される表示**:
```
Service Workers
  Status: activated and is running
  Source: /sw.js
  Scope: /
```

#### コンソールで確認

ブラウザのコンソールで以下を実行:
```javascript
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Service Worker:', reg.active?.state)
})
// 期待される出力: Service Worker: activated
```

---

### 2.2 Web App Manifest の確認

#### Chrome DevTools で確認

1. **Application タブ** → **Manifest** セクション
2. 以下の情報が表示されることを確認:
   - **Name**: RSS Feed Reader
   - **Short Name**: RSS Reader
   - **Start URL**: /
   - **Display**: standalone
   - **Icons**: 192x192, 512x512

#### マニフェストエラーの確認

**Console タブ** でマニフェスト関連のエラーがないことを確認:
```
✅ No manifest errors
```

エラーがある場合:
```
❌ Manifest: property 'name' missing
```

---

### 2.3 キャッシュの確認

#### Precache（アプリシェル）

1. **Application タブ** → **Cache Storage** セクション
2. `workbox-precache-v2-http://localhost:5173/` を展開
3. 以下のファイルがキャッシュされていることを確認:
   - `/` (index.html)
   - `/assets/index-[hash].js`
   - `/assets/index-[hash].css`
   - `/icons/icon-192x192.png`
   - `/icons/icon-512x512.png`

#### Runtime Cache（APIレスポンス）

1. フィードを取得（アプリでフィード追加）
2. **Cache Storage** で `api-cache` を確認
3. APIレスポンスがキャッシュされていることを確認

---

## 3. オフライン動作のテスト

### 3.1 ネットワークのオフライン化

#### Chrome DevTools で設定

1. **Network タブ** を開く
2. **Throttling** ドロップダウンから **Offline** を選択

または

1. **Application タブ** → **Service Workers** セクション
2. **Offline** チェックボックスをON

### 3.2 オフライン動作の確認

1. ページをリロード（`Cmd+R` / `Ctrl+R`）
2. アプリが正常に表示されることを確認
3. 既に取得したフィードと記事が表示されることを確認
4. オフライン通知が表示されることを確認

**期待される動作**:
- ✅ アプリシェル（UI）が即座に表示される
- ✅ キャッシュされたフィードと記事が表示される
- ✅ 「オフラインです」というトースト通知が表示される
- ❌ 新しいフィードの取得は失敗する

---

## 4. インストールテスト

### 4.1 インストールプロンプトの表示

#### Chrome（デスクトップ）

**自動表示の条件**:
- Web App Manifestが正しく設定されている
- Service Workerが登録されている
- HTTPSで配信されている（localhostは例外）
- ユーザーがサイトに十分な「エンゲージメント」を示した

**手動でインストール**:
1. アドレスバーの右端にある **インストールアイコン** (⊕) をクリック
2. **インストール** ボタンをクリック

または

1. **メニュー** (⋮) → **その他のツール** → **ショートカットを作成**
2. **ウィンドウとして開く** をチェック

#### Edge（デスクトップ）

同様に、アドレスバーの **アプリのインストール** アイコンをクリック。

---

### 4.2 インストール後の確認

#### デスクトップショートカット

- **Windows**: スタートメニューに "RSS Reader" が追加される
- **macOS**: アプリケーションフォルダに "RSS Reader" が追加される
- **Linux**: アプリケーションメニューに追加される

#### アプリとして起動

1. デスクトップショートカットから起動
2. ブラウザのUIなしで独立したウィンドウで開くことを確認
3. タスクバー/Dockで専用アイコンが表示されることを確認

---

## 5. Service Workerのデバッグ

### 5.1 Service Workerのログ確認

#### Service Workerコンテキストのコンソール

1. **Application タブ** → **Service Workers** セクション
2. 登録されたService Workerの下にある **Source** リンクをクリック
3. **Console** タブでService Worker内部のログを確認

**例**:
```javascript
// sw.ts に追加
console.log('[Service Worker] Install event')
console.log('[Service Worker] Fetch:', event.request.url)
```

---

### 5.2 Service Workerの再起動

#### 手動で再起動

1. **Application タブ** → **Service Workers** セクション
2. **Unregister** ボタンをクリック
3. ページをリロード
4. Service Workerが再登録される

#### skipWaiting のテスト

1. コードを変更してビルド（`npm run build`）
2. ページをリロード
3. **waiting** 状態のService Workerが表示される
4. **skipWaiting** ボタンをクリック
5. Service Workerがアクティベートされる

---

### 5.3 キャッシュのクリア

#### すべてのキャッシュを削除

1. **Application タブ** → **Cache Storage** セクション
2. 各キャッシュを右クリック → **Delete**

または

```javascript
// コンソールで実行
caches.keys().then(names => {
  names.forEach(name => caches.delete(name))
})
```

#### Service Workerとキャッシュを一括削除

1. **Application タブ** → **Clear storage** セクション
2. **Clear site data** ボタンをクリック

---

## 6. 更新フローのテスト

### 6.1 コードの変更

```bash
# コードを変更（例: App.tsxのテキスト変更）
echo "console.log('Updated')" >> frontend/src/App.tsx

# ビルド（本番環境想定）
npm run build
```

### 6.2 更新の検出

1. ブラウザでアプリを開く（既にインストール済み）
2. ページをリロード
3. **更新通知** が表示されることを確認

**期待される通知**:
```
新しいバージョンが利用可能です
[更新] ボタン
```

### 6.3 更新の適用

1. **更新** ボタンをクリック
2. ページが自動的にリロードされる
3. 新しいバージョンが適用される

**確認方法**:
```javascript
// コンソールで実行
console.log('Updated') // 追加したログが表示される
```

---

## 7. 本番環境でのテスト

### 7.1 本番ビルド

```bash
npm run build
```

**出力確認**:
```
dist/
├── index.html
├── manifest.json
├── sw.js
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── icons/
    ├── icon-192x192.png
    └── icon-512x512.png
```

### 7.2 ローカルで本番ビルドをプレビュー

```bash
npm run preview
```

**起動確認**:
```
  ➜  Local:   http://localhost:4173/
  ➜  Network: use --host to expose
```

ブラウザで http://localhost:4173/ を開き、PWA機能を確認。

---

### 7.3 Vercel/Netlify へのデプロイ

#### Vercel

```bash
npm install -g vercel
vercel --prod
```

#### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=frontend/dist
```

**HTTPS確認**:
- デプロイされたURLはHTTPS（PWAの要件）
- Service Workerが正常に動作することを確認

---

## 8. トラブルシューティング

### 8.1 Service Workerが登録されない

**症状**: `navigator.serviceWorker.register()` が失敗する

**原因と対処**:

| 原因 | 対処 |
|------|------|
| HTTPSでない | localhostまたはHTTPS環境で実行 |
| スクリプトが404 | `vite.config.ts`でPWA設定を確認 |
| シンタックスエラー | `sw.ts`のコードを確認 |
| ブラウザ非対応 | Chrome 90+, Edge 90+, Firefox 90+ を使用 |

---

### 8.2 キャッシュが更新されない

**症状**: コードを変更してもキャッシュが古いまま

**原因と対処**:

| 原因 | 対処 |
|------|------|
| Service Workerがwaiting状態 | skipWaiting()を呼び出す |
| ブラウザキャッシュ | Hard Reload（Cmd+Shift+R / Ctrl+Shift+R） |
| Precache設定ミス | `vite.config.ts`のglobPatternsを確認 |

---

### 8.3 オフライン時にエラーが表示される

**症状**: オフライン時に「Failed to fetch」エラー

**原因と対処**:

| 原因 | 対処 |
|------|------|
| APIがキャッシュされていない | Network Firstの設定を確認 |
| キャッシュが期限切れ | maxAgeSecondsを延長 |
| オフライン検出が機能していない | navigator.onLineの値を確認 |

---

## 9. チェックリスト

### 開発環境セットアップ

- [ ] 依存関係をインストールした（`npm install`）
- [ ] 開発サーバーが起動した（`npm run dev`）
- [ ] ブラウザでアプリが表示された

### PWA機能確認

- [ ] Service Workerが登録されている（DevTools確認）
- [ ] Web App Manifestが正しく読み込まれている
- [ ] アプリシェルがPrecacheされている
- [ ] APIレスポンスがRuntime Cacheされている

### オフライン動作

- [ ] オフライン状態でアプリが起動する
- [ ] キャッシュされたデータが表示される
- [ ] オフライン通知が表示される

### インストール

- [ ] インストールプロンプトが表示される
- [ ] デスクトップショートカットが作成される
- [ ] 独立したウィンドウで起動する
- [ ] 専用アイコンが表示される

### 更新フロー

- [ ] コード変更後、更新通知が表示される
- [ ] 更新ボタンで新しいバージョンが適用される

### 本番環境

- [ ] 本番ビルドが成功する（`npm run build`）
- [ ] プレビューで動作確認できる（`npm run preview`）
- [ ] デプロイ先でHTTPSで動作する

---

## 10. 参考リソース

### ドキュメント

- [vite-plugin-pwa 公式ドキュメント](https://vite-pwa-org.netlify.app/)
- [Workbox 公式ドキュメント](https://developers.google.com/web/tools/workbox)
- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest 仕様](https://www.w3.org/TR/appmanifest/)

### DevTools

- [Chrome DevTools: Service Workers](https://developer.chrome.com/docs/devtools/progressive-web-apps/)
- [Chrome DevTools: Application タブ](https://developer.chrome.com/docs/devtools/application/)

### テストツール

- [Lighthouse](https://developers.google.com/web/tools/lighthouse): PWA監査ツール
- [PWA Builder](https://www.pwabuilder.com/): PWA品質チェック

---

## まとめ

このガイドに従って、PWA機能の開発環境をセットアップし、動作確認を行ってください。次のステップは `/speckit.tasks` コマンドでタスクを生成し、実装を開始することです。
