# 技術調査: RSSリーダーアプリケーション

**ブランチ**: `001-rss-reader` | **作成日**: 2025-10-27

## 概要

このドキュメントは、RSSリーダーアプリケーション機能の技術的な意思決定を記録します。既存のfeed-parallel-parse-api（Go + Vercel）を利用し、フロントエンドのみの新規開発を行います。

## 技術選択

### フロントエンド

**言語/フレームワーク**: React 18 + TypeScript 5.x

**理由**:
- 既存のfeed-parallel-parse-apiプロジェクトにはフロントエンドがないため、新規に実装が必要
- Reactのコンポーネントベースのアーキテクチャは、フィード管理、記事リスト、検索などの独立した機能に適している
- TypeScriptにより、API契約（ParseRequest/ParseResponse）の型安全性を確保できる
- React 18の並行レンダリング機能により、大量の記事表示時のパフォーマンスが向上する
- 仮想スクロール実装のための成熟したライブラリエコシステム（react-window, react-virtualized）が存在する

**主要な依存関係**:
- `react@^18.0.0` - UIライブラリ
- `react-dom@^18.0.0` - DOM レンダリング
- `typescript@^5.0.0` - 型安全性
- `react-window@^1.8.10` - 仮想スクロール実装（FR-017: 50件初期表示 + 追加読み込み）
- `date-fns@^3.0.0` - 日付フォーマットと並べ替え（FR-005: 公開日順）

### ビルドツール

**選択**: Vite 5.x

**理由**:
- 高速な開発サーバーとHMR（Hot Module Replacement）
- TypeScriptとReactのネイティブサポート
- 本番ビルドの最適化（コード分割、ツリーシェイキング）
- Vercel Static Deployment との統合が容易

### スタイリング

**選択**: CSS Modules + TailwindCSS 3.x

**理由**:
- CSS Modulesによるコンポーネントレベルのスタイル封じ込め
- TailwindCSSによる高速なプロトタイピングとレスポンシブデザイン
- ユーティリティファーストのアプローチにより、カスタムCSSの記述量を削減
- 設定ファイル（tailwind.config.js）でデザインシステムの一元管理が可能

### 状態管理

**選択**: React Context API + useReducer

**理由**:
- 小〜中規模のアプリケーションには十分（購読管理、記事リスト、検索状態）
- Redux/Zustandなどの外部ライブラリが不要で、学習コストが低い
- FR-007（localStorage永続化）との統合が容易
- フィード購読、記事データ、UIステータスの3つの主要なコンテキストで管理可能

### ストレージ

**選択**: ブラウザのlocalStorage

**理由**:
- FR-007の要件: フィード購読の永続化
- MVPではユーザー認証が不要（仕様の前提条件による）
- 同期的なAPIで実装がシンプル
- 5-10MBのストレージ制限は、購読URL（最大100件）の保存には十分
- クロスタブ同期が必要な場合は、StorageEventで対応可能

### API通信

**選択**: Fetch API（ネイティブ）

**理由**:
- モダンブラウザで標準サポート（仕様の前提条件: 最新Web標準）
- 外部ライブラリ（axios等）が不要
- Promise/async-awaitとの統合が自然
- APIエンドポイントが1つ（POST /api/parse）のみでシンプル
- エラーハンドリングとタイムアウト処理が明確に実装可能

### テスト戦略

**単体テスト**: Vitest + React Testing Library

**理由**:
- VitestはViteとの統合が深く、設定が最小限
- React Testing Libraryはユーザー視点のテストを促進（受け入れシナリオとの整合性）
- モックAPI（MSW - Mock Service Worker）による統合テストが可能

**E2Eテスト**: Playwright（オプション）

**理由**:
- 主要なユーザージャーニー（P1-P3のストーリー）の自動テスト
- クロスブラウザテスト対応
- localStorage永続化のテストが可能

### デプロイ

**選択**: Vercel Static Site

**理由**:
- 既存のfeed-parallel-parse-apiが既にVercelで稼働
- 同じプロジェクトでバックエンド（API Routes）とフロントエンド（Static）を管理可能
- GitHub連携による自動デプロイ（CI/CD）
- グローバルCDNによる高速配信
- プレビューデプロイメント機能

## アーキテクチャ決定

### コンポーネント構成

**選択**: プレゼンテーション/コンテナパターン

**構造**:
```
frontend/src/
├── components/           # プレゼンテーションコンポーネント
│   ├── ArticleList/
│   ├── FeedManager/
│   ├── SearchBar/
│   ├── ErrorMessage/
│   └── LoadingIndicator/
├── containers/           # コンテナコンポーネント（状態管理）
│   ├── FeedContainer/
│   └── ArticleContainer/
├── contexts/            # Context API
│   ├── SubscriptionContext.tsx
│   ├── ArticleContext.tsx
│   └── UIContext.tsx
├── hooks/               # カスタムフック
│   ├── useLocalStorage.ts
│   ├── useFeedAPI.ts
│   └── useVirtualScroll.ts
├── services/            # API通信
│   ├── feedAPI.ts
│   └── storage.ts
├── types/               # TypeScript型定義
│   ├── api.ts           # API契約（ParseRequest/Response）
│   └── models.ts        # エンティティ型
└── utils/               # ユーティリティ関数
    ├── dateSort.ts
    ├── urlValidation.ts
    └── truncate.ts
```

**理由**:
- プレゼンテーションコンポーネントは再利用可能でテストしやすい
- コンテナコンポーネントが状態管理とビジネスロジックを担当
- カスタムフックにより、ロジックの共有とテストが容易
- ディレクトリ構造が機能要件（FR-001〜FR-017）と対応

### URL検証戦略

**選択**: クライアントサイドのリアルタイム検証

**実装**:
- FR-008: 無効なURL形式の即時エラー表示
- URL正規表現パターンによる基本検証
- `https://` または `http://` プロトコルの必須チェック
- 最大100件の購読制限チェック（FR-009）

**理由**:
- ユーザーエクスペリエンスの向上（即時フィードバック）
- APIリクエスト前の無駄なエラーを削減
- サーバーサイド検証は不要（APIが最終的にエラーを返す）

### エラーハンドリング戦略

**選択**: エラー境界 + トースト通知

**実装**:
- React Error Boundaryでコンポーネントレベルのエラーをキャッチ
- API呼び出しエラーは明示的にtry-catchで処理
- エラーメッセージはトースト通知（react-hot-toast等）で表示
- FR-006: APIエラー（ErrorInfo[]）をユーザーフレンドリーなメッセージに変換

**エラー分類**:
1. **ネットワークエラー**: APIへの接続失敗
2. **タイムアウトエラー**: 10秒以上のリクエスト
3. **解析エラー**: 不正なRSS/Atomフォーマット
4. **検証エラー**: 無効なURL、100件超過

### パフォーマンス最適化

**仮想スクロール（FR-017）**:
- react-windowで実装
- 初期表示: 最新50件
- スクロール時: 20件ずつ追加読み込み
- 計算済みの行の高さ: 固定高さ（120px）で最適化

**メモ化**:
- `React.memo`で不要な再レンダリングを防止
- `useMemo`で記事のソート/フィルタリングをキャッシュ
- `useCallback`でイベントハンドラーを安定化

**遅延読み込み**:
- React.lazyでルートレベルのコード分割
- 画像の遅延読み込み（記事サムネイルがある場合）

## データフロー

### フィード購読フロー

```
ユーザー入力
  → URL検証（リアルタイム）
  → SubscriptionContext.addFeed()
  → localStorage.setItem('subscriptions')
  → API POST /api/parse { urls: [...] }
  → レスポンス処理（feeds + errors）
  → ArticleContext.setArticles()
  → UI更新（記事リスト表示）
```

### 記事更新フロー

```
ユーザー「更新」ボタンクリック
  → UIContext.setLoading(true)
  → localStorage.getItem('subscriptions')
  → API POST /api/parse { urls: [...] }
  → レスポンス処理
  → 日付ソート（FR-005）
  → ArticleContext.setArticles()
  → UIContext.setLoading(false)
  → UI更新
```

### 検索フロー（FR-015）

```
ユーザー検索入力（リアルタイム）
  → ArticleContext.setSearchQuery(query)
  → useMemo: articles.filter(記事タイトル/要約にqueryが含まれる)
  → 仮想スクロールの表示範囲を再計算
  → UI更新（フィルタリングされた記事リスト）
```

## セキュリティとプライバシー

### XSS対策

- Reactのデフォルトエスケープ機能を活用
- 記事の要約をHTMLとして挿入しない（dangerouslySetInnerHTMLを使用しない）
- URLバリデーションでJavaScriptプロトコル（javascript:）を拒否

### CORS対応

- バックエンドAPIは既にCORS設定済みと想定
- フロントエンドは同じVercelプロジェクトでデプロイされるため、同一オリジン

### データプライバシー

- localStorageに保存されるのはRSSフィードURLのみ（個人情報なし）
- MVPではユーザー認証がないため、サーバーサイドのデータ保存なし

## パフォーマンス要件の実現

### SC-003: 10秒以内のフィード表示

- APIの10秒タイムアウト保証を活用
- クライアント側でも10秒タイムアウトを設定
- ローディングインジケーターで進捗を表示（FR-012）

### SC-005: 5秒以内の記事検索

- クライアントサイドのリアルタイム検索（APIリクエスト不要）
- useMemoでフィルタリング結果をキャッシュ
- デバウンス処理（300ms）でキーストローク毎の再計算を削減

### SC-008: 30秒以内の「フィード追加→記事表示→クリック」ワークフロー

- URL検証の即時フィードバック（2秒以内）
- API呼び出しとレスポンス処理（10秒以内）
- UI更新とレンダリング（1秒以内）
- 合計: 13秒 < 30秒（十分に達成可能）

## 未解決の技術的決定

### モバイルレスポンシブデザイン

**現在の方針**: 望ましいが必須ではない（仕様の前提条件による）

**決定の延期理由**: MVPの実装が完了してから、実際の使用パターンを見て判断

### 自動更新機能

**現在の方針**: 手動更新のみ（FR-011）

**将来の検討事項**:
- setIntervalでの定期更新（5分毎など）
- ユーザー設定可能な更新間隔
- バックグラウンドタブでの更新停止

### オフライン機能

**現在の方針**: スコープ外（仕様の前提条件による）

**将来の検討事項**:
- Service Workerによるキャッシュ戦略
- IndexedDBへの記事コンテンツ保存

## まとめ

本調査により、以下の技術スタックで実装することを決定しました:

- **フロントエンド**: React 18 + TypeScript 5.x + Vite
- **状態管理**: Context API + useReducer
- **ストレージ**: localStorage
- **スタイリング**: TailwindCSS + CSS Modules
- **テスト**: Vitest + React Testing Library
- **デプロイ**: Vercel Static Site

この選択により、既存のfeed-parallel-parse-apiと統合し、すべての機能要件（FR-001〜FR-017）と成功基準（SC-001〜SC-008）を達成できます。