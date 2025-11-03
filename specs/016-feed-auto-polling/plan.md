# Implementation Plan: フィード自動ポーリング機能

**Branch**: `016-feed-auto-polling` | **Date**: 2025-11-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/016-feed-auto-polling/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

10分ごとにバックグラウンドでRSSフィードを自動取得し、新着記事を検出する機能を実装する。新着記事があった場合、ユーザーに通知を表示し、ユーザーが「読み込む」ボタンをクリックすることで記事一覧に反映する。技術的には、Reactのカスタムフック（`useFeedPolling`）とsetIntervalを使用し、既存の手動更新機能（`useFeedAPI`）を最大限再利用する。オフライン/オンライン状態に応じてポーリングを自動停止/再開し、メモリリークを防止する。

## Technical Context

**Language/Version**: TypeScript 5.9.3, React 19.1.1
**Primary Dependencies**: React 19.1.1, date-fns 4.1.0, react-window 2.2.2, TailwindCSS 4.1.16
**Storage**: localStorage（ポーリング設定、最終ポーリング時刻）
**Testing**: Vitest 4.0.3, @testing-library/react 16.3.0, @testing-library/user-event 14.6.1, happy-dom 20.0.8
**Target Platform**: モダンブラウザ（Chrome, Firefox, Safari, Edge）、PWA対応済み（vite-plugin-pwa 1.1.0）
**Project Type**: web（フロントエンドのみ、バックエンドAPIは既存のものを使用）
**Performance Goals**: ポーリング処理が15秒以内に完了、新着通知が3秒以内に表示、読み込みボタンクリック後1秒以内に反映
**Constraints**: ポーリング間隔は10分固定、既存APIを変更しない、既存Contextを破壊的に変更しない、メモリリークゼロ
**Scale/Scope**: 100件の購読フィードでも動作、新着記事数の上限なし（仮想スクロールで対応）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### TDD原則の遵守

- [x] **テストファースト**: ポーリングロジック、通知UI、状態管理のすべてをテストファーストで実装する
- [x] **Red-Green-Refactor**: 各機能実装でサイクルを回す
  - Red: useFeedPolling.test.ts, NewArticlesNotification.test.tsx, ArticleContext.test.tsx
  - Green: 最小限の実装でテストを通す
  - Refactor: 重複排除、意図の明確化
- [x] **カバレッジ100%**: 新規コードはすべてカバー

### 型安全性

- [x] **any禁止**: 型推論不可の場合はunknownを使用
- [x] **strict mode**: tsconfig.jsonで有効化済み
- [x] **Props型定義**: NewArticlesNotificationのPropsを明示的に定義

### テストの種類とバランス

- [x] **単体テスト70%**:
  - useFeedPolling（ポーリングロジック）
  - pollingStorage（localStorage操作）
  - findNewArticles、mergeArticles（ユーティリティ関数）
  - NewArticlesNotification（コンポーネント）
- [x] **統合テスト20%**:
  - FeedContainer + useFeedPolling + ArticleContext
  - ポーリング→検出→通知→反映のフロー
- [x] **E2Eテスト10%**:
  - ユーザーシナリオ全体（10分放置→新着検出→ボタンクリック→反映）

### シンプルさの原則（YAGNI）

- [x] **必要最小限**: ポーリング間隔は10分固定（ユーザー設定は後のフェーズ）
- [x] **過剰設計の禁止**: Service WorkerのPeriodic Background Sync APIは使用しない（複雑で実験的）
- [x] **既存機能の再利用**: useFeedAPI, ArticleContext, useNetworkStatusを最大限活用

### 新規依存関係の追加

- [x] **既存ツールで解決**: 新しいライブラリは追加しない、すべて既存の依存関係で実装可能

### 憲法違反

**該当なし** - すべての原則を遵守

## Project Structure

### Documentation (this feature)

```text
specs/016-feed-auto-polling/
├── spec.md              # 機能仕様書
├── plan.md              # この実装計画書
├── research.md          # Phase 0: 技術調査結果
├── data-model.md        # Phase 1: データモデル定義
├── quickstart.md        # Phase 1: 開発者向けクイックスタート
├── contracts/           # Phase 1: API契約（該当なし、既存API使用）
└── checklists/
    └── requirements.md  # 仕様書品質チェックリスト
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   ├── NewArticlesNotification.tsx       # 新規: 新着通知UI
│   │   └── NewArticlesNotification.test.tsx  # 新規: 通知UIテスト
│   ├── contexts/
│   │   ├── ArticleContext.tsx                # 拡張: pendingArticles, hasNewArticles等
│   │   └── ArticleContext.test.tsx           # 拡張: 新規アクションのテスト
│   ├── hooks/
│   │   ├── useFeedPolling.ts                 # 新規: ポーリングロジック
│   │   └── useFeedPolling.test.ts            # 新規: ポーリングテスト
│   ├── services/
│   │   ├── pollingStorage.ts                 # 新規: localStorage管理
│   │   └── pollingStorage.test.ts            # 新規: ストレージテスト
│   ├── utils/
│   │   ├── articleMerge.ts                   # 新規: 記事マージユーティリティ
│   │   └── articleMerge.test.ts              # 新規: マージロジックテスト
│   ├── containers/
│   │   └── FeedContainer.tsx                 # 拡張: useFeedPolling統合
│   └── App.tsx                                # 拡張: NewArticlesNotification追加
└── tests/
    └── integration/
        └── polling-flow.test.tsx              # 新規: ポーリング統合テスト
```

**Structure Decision**: 既存のWeb application構造を使用。フロントエンドのみの変更で、バックエンドAPIは既存のものを使用する。新規ファイルは6個、既存ファイルの拡張は3個、合計9ファイルの変更。

## Complexity Tracking

**該当なし** - Constitution Check違反なし

## Phase 0: Research & Unknowns

### 調査タスク

1. **ポーリング実装パターンの調査**
   - setInterval vs Web Workers vs Service Worker
   - Reactでのポーリング実装のベストプラクティス
   - メモリリーク防止の手法

2. **既存コードとの統合方法の調査**
   - useFeedAPIの再利用方法
   - ArticleContextの拡張パターン
   - useNetworkStatusの活用方法

3. **新着通知UIの設計調査**
   - 既存PWA通知コンポーネントとの統一
   - アクセシビリティ対応（ARIA属性、キーボード操作）
   - アニメーション実装（TailwindCSSトランジション）

4. **テスト戦略の調査**
   - setIntervalのモック方法（vi.useFakeTimers）
   - ポーリング処理の統合テスト手法
   - 時間経過のシミュレーション方法

**Output**: research.md

## Phase 1: Design & Contracts

### 1. データモデル設計

**Output**: data-model.md

以下のエンティティを定義：

- **PollingState**: ポーリング機能の状態
  - pendingArticles: Article[]
  - lastPolledAt: number | null
  - newArticlesCount: number
  - hasNewArticles: boolean

- **PollingConfig**: ポーリング設定
  - interval: number (デフォルト: 600000)
  - enabled: boolean (デフォルト: true)

- **ArticleState拡張**: 既存ArticleContextに追加
  - pendingArticles: Article[]
  - hasNewArticles: boolean
  - newArticlesCount: number
  - lastPolledAt: number | null

### 2. API契約

**Output**: 該当なし（contracts/ディレクトリは作成しない）

理由: 既存のバックエンドAPI（`POST /api/parse`）をそのまま使用するため、新規API契約は不要。既存のAPIレスポンス形式（ParseResponse）を再利用する。

### 3. クイックスタート

**Output**: quickstart.md

開発者が機能を理解し、拡張するための手順書：
- ポーリング機能の概要
- 新規ファイルの役割
- 既存ファイルの変更箇所
- テストの実行方法
- デバッグ方法（開発者ツールでのポーリング確認）

### 4. Agent Context更新

**実行**: `.specify/scripts/bash/update-agent-context.sh claude`

CLAUDE.mdに以下の技術スタックを追加：
- ポーリング機能（setInterval + React Custom Hook）
- 新着通知UI（TailwindCSS、ARIA対応）
- localStorage（ポーリング設定の永続化）

## Next Steps

1. Phase 0完了後、research.mdを作成
2. Phase 1完了後、data-model.md、quickstart.mdを作成
3. `/speckit.tasks`コマンドでtasks.mdを生成し、実装タスクに分解
4. TDDサイクルで実装開始（Red→Green→Refactor）
