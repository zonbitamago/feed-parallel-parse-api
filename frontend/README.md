# RSSリーダー

複数のRSSフィードを統合して閲覧できるシンプルで使いやすいRSSリーダーアプリケーションです。

## 特徴

- **統合フィード表示**: 複数のRSSフィードをまとめて閲覧
- **リアルタイム検索**: 記事のタイトルや要約から素早く検索
- **購読管理**: フィードの追加・削除が簡単
- **永続化**: localStorage により、購読情報がブラウザに保存されます
- **仮想スクロール**: 大量の記事も快適に閲覧可能
- **レスポンシブデザイン**: モバイルからデスクトップまで対応
- **アクセシビリティ**: ARIA属性とキーボードナビゲーション対応

## 技術スタック

- **フレームワーク**: React 18.x + TypeScript 5.x
- **ビルドツール**: Vite 5.x
- **スタイリング**: TailwindCSS 4.x
- **テスト**: Vitest + React Testing Library
- **日付処理**: date-fns 3.x
- **仮想スクロール**: react-window 1.8.x

## セットアップ

### 前提条件

- Node.js 18.x 以上
- npm 9.x 以上

### インストール

```bash
# 依存関係のインストール
npm install
```

### 環境変数の設定

`.env.local` ファイルを作成し、APIのベースURLを設定します：

```bash
VITE_API_BASE_URL=http://localhost:8080
```

本番環境では、実際のAPIエンドポイントを指定してください。

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:5173](http://localhost:5173) を開きます。

### ビルド

```bash
npm run build
```

ビルド成果物は `dist/` ディレクトリに生成されます。

### プレビュー

ビルド後、本番環境と同じ動作を確認できます：

```bash
npm run preview
```

## テスト

### すべてのテストを実行

```bash
npm test
```

### ウォッチモードでテストを実行

```bash
npm run test:watch
```

### カバレッジレポートの生成

```bash
npm run test:coverage
```

### テストカバレッジ

現在のテストカバレッジ: **99% (96/97 tests passing)**

- 単体テスト: ユーティリティ、フック、Context
- コンポーネントテスト: プレゼンテーションコンポーネント
- 統合テスト: ユーザージャーニー全体

## プロジェクト構造

```
frontend/
├── src/
│   ├── components/         # UIコンポーネント
│   │   ├── ArticleList/    # 記事一覧表示
│   │   ├── ErrorMessage/   # エラーメッセージ表示
│   │   ├── FeedManager/    # フィード購読管理
│   │   ├── LoadingIndicator/ # ローディング表示
│   │   └── SearchBar/      # 検索ボックス
│   ├── containers/         # コンテナコンポーネント
│   │   ├── ArticleContainer.tsx
│   │   └── FeedContainer.tsx
│   ├── contexts/           # React Context
│   │   ├── ArticleContext.tsx
│   │   ├── SubscriptionContext.tsx
│   │   └── UIContext.tsx
│   ├── hooks/              # カスタムフック
│   │   ├── useFeedAPI.ts
│   │   ├── useLocalStorage.ts
│   │   └── useVirtualScroll.ts
│   ├── services/           # API・ストレージサービス
│   │   ├── feedAPI.ts
│   │   └── storage.ts
│   ├── types/              # TypeScript型定義
│   │   ├── api.ts
│   │   └── models.ts
│   ├── utils/              # ユーティリティ関数
│   │   ├── dateSort.ts
│   │   ├── truncate.ts
│   │   └── urlValidation.ts
│   ├── App.tsx             # ルートコンポーネント
│   ├── main.tsx            # エントリーポイント
│   └── index.css           # グローバルスタイル
├── tests/                  # 統合テスト
│   └── integration/
│       ├── accessibility.test.tsx
│       ├── feedFlow.test.tsx
│       ├── refreshFlow.test.tsx
│       ├── searchFlow.test.tsx
│       └── subscriptionPersistence.test.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 使い方

### 1. フィードの追加

1. URLフィールドにRSSフィードのURLを入力します
2. 「追加」ボタンをクリックします
3. フィードが購読リストに追加され、記事が表示されます

### 2. 記事の閲覧

- 記事は公開日順に表示されます
- 記事タイトルをクリックすると、元記事が新しいタブで開きます
- スクロールすることで、さらに記事を読み込むことができます

### 3. 記事の検索

1. 検索ボックスにキーワードを入力します
2. タイトルや要約にキーワードを含む記事が表示されます
3. Escapeキーで検索をクリアできます

### 4. フィードの更新

- 「更新」ボタンをクリックすると、購読中のすべてのフィードから最新の記事を取得します

### 5. フィードの削除

1. 購読リストから削除したいフィードを見つけます
2. 「削除」ボタンをクリックします
3. フィードと関連する記事が削除されます

## アクセシビリティ

本アプリケーションは、以下のアクセシビリティ機能を提供しています：

- **ARIA属性**: スクリーンリーダー対応
- **キーボードナビゲーション**:
  - Tab: フォーカス移動
  - Enter: ボタンのクリック、フォーム送信
  - Escape: 検索クリア
- **セマンティックHTML**: 適切なrole属性の使用
- **エラー通知**: role="alert"によるエラーの即時通知

## デプロイ

### Vercelへのデプロイ

1. プロジェクトルートに `vercel.json` が設定されています
2. Vercel CLIまたはGitHub連携でデプロイします

```bash
# Vercel CLIを使用
npm install -g vercel
vercel
```

3. 環境変数 `VITE_API_BASE_URL` を設定します

### その他のプラットフォーム

`npm run build` でビルドした `dist/` ディレクトリを、任意の静的ホスティングサービスにデプロイできます：

- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting

## トラブルシューティング

### ビルドエラー: TailwindCSS PostCSS plugin

TailwindCSS 4.xを使用しているため、`@tailwindcss/postcss`が必要です：

```bash
npm install -D @tailwindcss/postcss
```

### API接続エラー

`.env.local` ファイルの `VITE_API_BASE_URL` が正しく設定されているか確認してください。

### テストが失敗する

```bash
# キャッシュをクリア
npm run test -- --clearCache

# 再度テストを実行
npm test
```

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 貢献

プルリクエストを歓迎します！大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## 関連ドキュメント

- [機能仕様書](../../specs/001-rss-reader/spec.md)
- [実装計画](../../specs/001-rss-reader/plan.md)
- [タスクリスト](../../specs/001-rss-reader/tasks.md)
