# クイックスタート: RSSリーダーアプリケーション

**ブランチ**: `001-rss-reader` | **作成日**: 2025-10-27

## 概要

このドキュメントは、RSSリーダーアプリケーションの開発環境のセットアップから本番デプロイまでの手順を記載します。

---

## 前提条件

以下がインストールされていることを確認してください:

- **Node.js**: v18.0.0以上（推奨: v20.x LTS）
- **npm**: v9.0.0以上（Node.jsに同梱）
- **Git**: バージョン管理用
- **Vercel CLI**（オプション）: ローカルプレビューとデプロイ用

### バージョン確認

```bash
node --version  # v20.x.x
npm --version   # 9.x.x
git --version   # 2.x.x
```

---

## 初期セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/zonbitamago/feed-parallel-parse-api.git
cd feed-parallel-parse-api
git checkout 001-rss-reader
```

### 2. フロントエンドプロジェクトの初期化

```bash
# フロントエンドディレクトリの作成
mkdir -p frontend
cd frontend

# Vite + React + TypeScript プロジェクトの作成
npm create vite@latest . -- --template react-ts

# 依存関係のインストール
npm install

# 追加の依存関係をインストール
npm install react-window date-fns
npm install --save-dev @types/react-window

# TailwindCSSのセットアップ
npm install --save-dev tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. TailwindCSS設定

**`frontend/tailwind.config.js`**を以下で置き換え:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**`frontend/src/index.css`**の先頭に追加:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. プロジェクト構造の作成

```bash
cd frontend/src

# ディレクトリ構造を作成
mkdir -p components/ArticleList
mkdir -p components/FeedManager
mkdir -p components/SearchBar
mkdir -p components/ErrorMessage
mkdir -p components/LoadingIndicator
mkdir -p containers
mkdir -p contexts
mkdir -p hooks
mkdir -p services
mkdir -p types
mkdir -p utils
```

---

## 開発環境

### 開発サーバーの起動

```bash
cd frontend
npm run dev
```

ブラウザで `http://localhost:5173` を開きます。

### ファイル監視

Viteは自動的にファイルの変更を検知し、Hot Module Replacement（HMR）で即座に反映されます。

---

## テスト

### テスト環境のセットアップ

```bash
cd frontend

# Vitestのインストール
npm install --save-dev vitest @vitest/ui

# React Testing Libraryのインストール
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event

# MSW（Mock Service Worker）のインストール
npm install --save-dev msw
```

### Vitest設定

**`frontend/vite.config.ts`**に追加:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

**`frontend/src/test/setup.ts`**を作成:

```typescript
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup()
})
```

### テストの実行

```bash
# 全テストを実行
npm run test

# ウォッチモードでテストを実行
npm run test -- --watch

# カバレッジレポートを生成
npm run test -- --coverage

# UIモードでテストを実行
npm run test -- --ui
```

### package.jsonにスクリプトを追加

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## ビルド

### 本番ビルドの作成

```bash
cd frontend
npm run build
```

ビルド成果物は `frontend/dist/` ディレクトリに生成されます。

### ビルドのプレビュー

```bash
npm run preview
```

ブラウザで `http://localhost:4173` を開いて本番ビルドをプレビューします。

---

## デプロイ

### Vercelへのデプロイ

#### 方法1: Vercel CLIを使用

```bash
# Vercel CLIのインストール（グローバル）
npm install -g vercel

# プロジェクトルートでVercelにログイン
vercel login

# デプロイ（初回）
vercel

# 本番デプロイ
vercel --prod
```

#### 方法2: GitHubとの連携（推奨）

1. GitHubリポジトリにコードをプッシュ
2. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
3. 「Import Project」をクリック
4. GitHubリポジトリを選択
5. フレームワークプリセット: **Vite**
6. ルートディレクトリ: `frontend`
7. 「Deploy」をクリック

**Vercel設定ファイル（プロジェクトルート）**:

`vercel.json`に以下を追加:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/*.go",
      "use": "@vercel/go"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "frontend/dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ]
}
```

### 環境変数の設定

Vercel Dashboardで以下の環境変数を設定:

- `VITE_API_BASE_URL`: `https://feed-parallel-parse-api.vercel.app`（本番API URL）

**ローカル開発用（`.env.local`）**:

```bash
VITE_API_BASE_URL=https://feed-parallel-parse-api.vercel.app
```

**フロントエンドコードで使用**:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://feed-parallel-parse-api.vercel.app';
```

---

## 開発ワークフロー

### 1. 新機能の開発

```bash
# 機能ブランチを作成
git checkout -b feature/my-feature

# コードを編集
# ...

# テストを実行
npm run test

# ビルドを確認
npm run build

# コミット
git add .
git commit -m "feat: add my feature"

# プッシュ
git push origin feature/my-feature
```

### 2. プルリクエストの作成

1. GitHubでプルリクエストを作成
2. Vercelが自動的にプレビューデプロイを作成
3. レビュー後、`001-rss-reader`ブランチにマージ

### 3. 本番デプロイ

`001-rss-reader`ブランチにマージされると、Vercelが自動的に本番環境にデプロイします。

---

## トラブルシューティング

### 問題: `npm install`でエラーが発生

**解決策**: Node.jsとnpmのバージョンを確認し、必要に応じて更新:

```bash
node --version  # v18以上を確認
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 問題: Viteの開発サーバーが起動しない

**解決策**: ポート5173が既に使用されている場合、別のポートを指定:

```bash
npm run dev -- --port 3000
```

### 問題: TailwindCSSのスタイルが適用されない

**解決策**: `tailwind.config.js`の`content`パスを確認し、`src/index.css`に`@tailwind`ディレクティブが含まれていることを確認:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 問題: APIリクエストがCORSエラーで失敗

**解決策**: バックエンドAPI（feed-parallel-parse-api）がCORSヘッダーを返していることを確認:

```bash
curl -I -X OPTIONS https://feed-parallel-parse-api.vercel.app/api/parse
```

`Access-Control-Allow-Origin`ヘッダーが存在することを確認します。

### 問題: VercelデプロイでビルドエラーOUT OF MEMORY

**解決策**: `vercel.json`でNode.jsのメモリを増やす:

```json
{
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "frontend/dist",
        "nodeVersion": "20",
        "maxLambdaSize": "50mb"
      }
    }
  ]
}
```

---

## 便利なコマンド

### コード品質

```bash
# ESLintでコードをチェック
npm run lint

# ESLintで自動修正
npm run lint -- --fix

# TypeScriptの型チェック
npx tsc --noEmit
```

### 依存関係の更新

```bash
# 古い依存関係を確認
npm outdated

# 依存関係を更新
npm update

# 特定のパッケージを更新
npm install react@latest react-dom@latest
```

### ローカルストレージのクリア（デバッグ用）

ブラウザのコンソールで:

```javascript
localStorage.clear();
location.reload();
```

---

## 次のステップ

1. **仕様を確認**: [spec.md](./spec.md)でユーザーストーリーと機能要件を理解
2. **データモデルを理解**: [data-model.md](./data-model.md)でエンティティとAPI契約を確認
3. **API契約を確認**: [contracts/api-contract.md](./contracts/api-contract.md)でバックエンドAPIの使用方法を理解
4. **タスクを確認**: [tasks.md](./tasks.md)で実装タスクの順序と依存関係を確認（`/speckit.tasks`コマンド実行後）

---

## リソース

- **Viteドキュメント**: https://vitejs.dev/
- **Reactドキュメント**: https://react.dev/
- **TailwindCSSドキュメント**: https://tailwindcss.com/docs
- **Vitestドキュメント**: https://vitest.dev/
- **Vercelドキュメント**: https://vercel.com/docs
- **react-windowドキュメント**: https://github.com/bvaughn/react-window

---

## サポート

問題が発生した場合:

1. 本ドキュメントのトラブルシューティングセクションを確認
2. GitHubでIssueを作成
3. プロジェクトの`.specify/`ディレクトリでSpeckitコマンドを確認

---

**開発を楽しんでください！**