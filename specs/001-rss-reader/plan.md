# 実装計画: RSSリーダーアプリケーション

**ブランチ**: `001-rss-reader` | **作成日**: 2025-10-27 | **仕様**: [spec.md](./spec.md)

## 概要

既存のfeed-parallel-parse-api（Go + Vercel）を活用し、RSSフィードを統合表示するWebベースのリーダーアプリケーションを構築します。フロントエンドはReact 18 + TypeScript + Viteで新規開発し、localStorageでフィード購読を管理します。バックエンドAPIは変更不要です。

**主要な要件**:
- 複数のRSSフィード（最大100件）を並列取得・表示
- フィード購読管理（追加・削除・永続化）
- 記事の検索・フィルタリング
- リアルタイムURL検証とエラーハンドリング

**技術アプローチ**: [research.md](./research.md)で詳細を記載

---

## 技術コンテキスト

**Language/Version**: React 18.x + TypeScript 5.x
**Primary Dependencies**: Vite 5.x（ビルドツール）, react-window 1.8.x（仮想スクロール）, date-fns 3.x（日付処理）, TailwindCSS 3.x（スタイリング）
**Storage**: ブラウザのlocalStorage（フィード購読の永続化）
**Testing**: Vitest + React Testing Library（単体テスト）, MSW（APIモック）, Playwright（E2Eテスト、オプション）
**Target Platform**: モダンWebブラウザ（ES6+, Fetch API, localStorageサポート）
**Project Type**: Web（フロントエンドのみの新規開発、既存のGoバックエンドと統合）
**Performance Goals**:
- 10秒以内のフィード取得・表示（SC-003）
- 5秒以内のキーワード検索（SC-005）
- 50件の記事を仮想スクロールで高速表示（FR-017）

**Constraints**:
- 最大100件のフィード購読（APIの制約）
- 10秒のAPIタイムアウト
- 記事要約は300文字で切り詰め
- ブラウザごとの永続化（サーバーサイドストレージなし）

**Scale/Scope**:
- 小〜中規模のSPA（Single Page Application）
- 最大100フィード × 平均20記事 = 約2000記事の表示
- MVPのスコープ（認証、オフライン機能、記事既読追跡は対象外）

---

## Constitution Check

*注: このプロジェクトにはconstitution.mdファイルが存在しないため、Constitution Checkはスキップされます。*

**ステータス**: N/A（constitution.md未定義）

**今後の検討事項**:
- プロジェクト全体の設計原則を定義する場合は、`/speckit.constitution`コマンドで作成を検討

---

## プロジェクト構造

### ドキュメント（この機能）

```text
specs/001-rss-reader/
├── plan.md                          # この実装計画
├── research.md                      # Phase 0: 技術調査と決定事項
├── data-model.md                    # Phase 1: エンティティとAPI契約
├── quickstart.md                    # Phase 1: セットアップとデプロイ手順
├── contracts/
│   └── api-contract.md              # Phase 1: フロントエンド↔バックエンドAPI仕様
├── checklists/
│   └── requirements.md              # 仕様品質チェックリスト（完了済み）
└── tasks.md                         # Phase 2: 実装タスク（/speckit.tasksで生成予定）
```

---

### ソースコード（リポジトリルート）

**選択された構造**: Web application（フロントエンド新規 + 既存バックエンド）

```text
feed-parallel-parse-api/
├── api/                             # 既存のGoバックエンド（変更なし）
│   └── parse.go                     # POST /api/parse エンドポイント
├── src/
│   └── models/
│       └── rss.go                   # 既存のAPIモデル（変更なし）
├── tests/                           # 既存のGoテスト（変更なし）
│
└── frontend/                        # 新規作成（この機能で実装）
    ├── src/
    │   ├── components/              # プレゼンテーションコンポーネント
    │   │   ├── ArticleList/
    │   │   │   ├── ArticleList.tsx
    │   │   │   ├── ArticleList.test.tsx
    │   │   │   └── ArticleList.module.css
    │   │   ├── FeedManager/
    │   │   │   ├── FeedManager.tsx
    │   │   │   ├── FeedManager.test.tsx
    │   │   │   └── FeedManager.module.css
    │   │   ├── SearchBar/
    │   │   │   ├── SearchBar.tsx
    │   │   │   ├── SearchBar.test.tsx
    │   │   │   └── SearchBar.module.css
    │   │   ├── ErrorMessage/
    │   │   │   ├── ErrorMessage.tsx
    │   │   │   └── ErrorMessage.test.tsx
    │   │   └── LoadingIndicator/
    │   │       ├── LoadingIndicator.tsx
    │   │       └── LoadingIndicator.test.tsx
    │   │
    │   ├── containers/              # コンテナコンポーネント（状態管理）
    │   │   ├── FeedContainer.tsx
    │   │   ├── FeedContainer.test.tsx
    │   │   ├── ArticleContainer.tsx
    │   │   └── ArticleContainer.test.tsx
    │   │
    │   ├── contexts/                # Context API（グローバル状態）
    │   │   ├── SubscriptionContext.tsx
    │   │   ├── SubscriptionContext.test.tsx
    │   │   ├── ArticleContext.tsx
    │   │   ├── ArticleContext.test.tsx
    │   │   ├── UIContext.tsx
    │   │   └── UIContext.test.tsx
    │   │
    │   ├── hooks/                   # カスタムフック
    │   │   ├── useLocalStorage.ts
    │   │   ├── useLocalStorage.test.ts
    │   │   ├── useFeedAPI.ts
    │   │   ├── useFeedAPI.test.ts
    │   │   ├── useVirtualScroll.ts
    │   │   └── useVirtualScroll.test.ts
    │   │
    │   ├── services/                # API通信とストレージ
    │   │   ├── feedAPI.ts
    │   │   ├── feedAPI.test.ts
    │   │   ├── storage.ts
    │   │   └── storage.test.ts
    │   │
    │   ├── types/                   # TypeScript型定義
    │   │   ├── api.ts               # API契約（ParseRequest/Response）
    │   │   └── models.ts            # エンティティ型（Subscription/Article/FeedError）
    │   │
    │   ├── utils/                   # ユーティリティ関数
    │   │   ├── dateSort.ts
    │   │   ├── dateSort.test.ts
    │   │   ├── urlValidation.ts
    │   │   ├── urlValidation.test.ts
    │   │   ├── truncate.ts
    │   │   └── truncate.test.ts
    │   │
    │   ├── App.tsx                  # ルートコンポーネント
    │   ├── App.test.tsx
    │   ├── main.tsx                 # エントリーポイント
    │   ├── index.css                # グローバルスタイル + Tailwind
    │   └── vite-env.d.ts            # Vite型定義
    │
    ├── tests/                       # 統合テストとE2Eテスト
    │   ├── integration/
    │   │   ├── feedFlow.test.tsx    # フィード追加→表示のフロー
    │   │   └── searchFlow.test.tsx  # 検索機能のフロー
    │   └── e2e/                     # Playwright E2Eテスト（オプション）
    │       └── userJourney.spec.ts
    │
    ├── public/                      # 静的ファイル
    │   └── favicon.ico
    │
    ├── index.html                   # HTMLエントリーポイント
    ├── vite.config.ts               # Vite設定
    ├── tailwind.config.js           # TailwindCSS設定
    ├── tsconfig.json                # TypeScript設定
    ├── tsconfig.node.json           # Node環境用TypeScript設定
    ├── package.json                 # npm依存関係
    └── .env.local                   # ローカル環境変数
```

**構造決定の理由**:
- **フロントエンド分離**: 既存のGoバックエンド（`api/`, `src/models/`, `tests/`）は変更せず、新規の`frontend/`ディレクトリでフロントエンドを実装
- **コンポーネントベース**: Reactのプレゼンテーション/コンテナパターンで、UIとビジネスロジックを分離
- **テストの配置**: コンポーネントと同じディレクトリに単体テストを配置（`*.test.tsx`）し、統合テストは`frontend/tests/`に集約
- **Vercelデプロイ**: `vercel.json`でバックエンド（`api/*.go`）とフロントエンド（`frontend/`）を同時にデプロイ

---

## 複雑性追跡

> Constitution Checkがスキップされたため、このセクションは該当なし

---

## 次のフェーズ

### Phase 0: 技術調査（完了）

✅ [research.md](./research.md)を作成しました。以下を決定:
- React 18 + TypeScript + Vite
- Context API + useReducerで状態管理
- localStorageで永続化
- TailwindCSS + CSS Modulesでスタイリング
- Vitest + React Testing Libraryでテスト

### Phase 1: 設計（完了）

✅ [data-model.md](./data-model.md)を作成しました:
- 主要エンティティ: Subscription, Article, FeedError
- 3つのContext: SubscriptionContext, ArticleContext, UIContext

✅ [contracts/api-contract.md](./contracts/api-contract.md)を作成しました:
- バックエンドAPI仕様（POST /api/parse）
- リクエスト/レスポンス型定義とエラーハンドリング

✅ [quickstart.md](./quickstart.md)を作成しました:
- セットアップ手順、テスト実行、Vercelデプロイ方法

### Phase 2: プロジェクト構造の整理（次のステップ）

実装前に、バックエンドのディレクトリ構造を整理します:

**作業内容**:
1. `src/models/rss.go` を `api/models/rss.go` に移動
2. `src/` ディレクトリを削除
3. import文を修正（`github.com/zonbitamago/feed-parallel-parse-api/src/models` → `github.com/zonbitamago/feed-parallel-parse-api/api/models`）
4. テストを実行して動作確認

**目的**:
- バックエンドコードを `api/` ディレクトリに集約
- `src/` という曖昧なディレクトリ名を削除
- フロントエンド（`frontend/`）とバックエンド（`api/`）の役割を明確化

### Phase 3: タスク生成

プロジェクト構造整理後、`/speckit.tasks` コマンドを実行して実装タスクを生成:
- [tasks.md](./tasks.md)に依存関係のある実装タスクを列挙
- 優先度とテスト戦略を含む

### Phase 4: 実装

`/speckit.implement`コマンドで実装を開始します。

---

## 参照ドキュメント

- **仕様書**: [spec.md](./spec.md)
- **技術調査**: [research.md](./research.md)
- **データモデル**: [data-model.md](./data-model.md)
- **API契約**: [contracts/api-contract.md](./contracts/api-contract.md)
- **クイックスタート**: [quickstart.md](./quickstart.md)
- **要件チェックリスト**: [checklists/requirements.md](./checklists/requirements.md)
