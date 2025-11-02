# Quick Start: フィード自動ポーリング機能

**Feature**: 016-feed-auto-polling
**Date**: 2025-11-03
**対象**: 開発者

## 概要

このガイドでは、フィード自動ポーリング機能の実装内容、アーキテクチャ、テスト方法、デバッグ方法を説明します。

## 機能概要

10分ごとにバックグラウンドでRSSフィードを自動取得し、新着記事を検出する機能。新着記事があった場合、ユーザーに通知を表示し、ユーザーが「読み込む」ボタンをクリックすることで記事一覧に反映します。

**主要機能**:
- 10分ごとの自動ポーリング（setInterval）
- オフライン/オンライン状態に応じた自動停止/再開
- 新着記事の検出と通知表示
- ユーザーアクションによる新着記事の反映
- localStorage への状態保存
- メモリリーク防止

## アーキテクチャ

### コンポーネント構成

```
App.tsx
 ├─ ArticleProvider (ArticleContext)
 │   └─ FeedContainer
 │       ├─ useFeedPolling ← 新規カスタムフック
 │       │   ├─ useNetworkStatus（既存）
 │       │   └─ useFeedAPI（既存）
 │       └─ ArticleContainer
 │           └─ ArticleList
 └─ NewArticlesNotification ← 新規コンポーネント
```

### データフロー

```
[ポーリング] 10分タイマー
    ↓
useFeedPolling
    ↓
useFeedAPI.fetchFeeds() ← 既存機能を再利用
    ↓
findNewArticles() ← 重複判定
    ↓
ArticleContext.SET_PENDING_ARTICLES
    ↓
NewArticlesNotification表示
    ↓
ユーザーが「読み込む」クリック
    ↓
ArticleContext.APPLY_PENDING_ARTICLES
    ↓
記事一覧に反映
```

## 新規ファイル

### 1. useFeedPolling.ts

**場所**: `frontend/src/hooks/useFeedPolling.ts`

**役割**: ポーリングロジックを管理するカスタムフック

**主要機能**:
- 10分ごとにsetIntervalでポーリング実行
- useNetworkStatusでオフライン時は停止
- useFeedAPIで既存のAPI呼び出し機能を再利用
- 新着記事を検出し、ArticleContextに保存

**使用例**:
```typescript
const { pollingState, applyNewArticles } = useFeedPolling(
  subscriptions,
  articles,
  { interval: 600000, enabled: true }
)
```

**テストファイル**: `useFeedPolling.test.ts`

---

### 2. NewArticlesNotification.tsx

**場所**: `frontend/src/components/NewArticlesNotification.tsx`

**役割**: 新着記事の通知UIを表示

**主要機能**:
- 緑色の通知バー（既存のPWA通知と統一）
- 新着件数の表示
- 「読み込む」ボタン
- アクセシビリティ対応（ARIA属性）
- スライドダウンアニメーション

**Props**:
```typescript
interface Props {
  visible: boolean        // 表示/非表示
  count: number          // 新着記事件数
  onLoad: () => void     // 読み込みボタンのクリックハンドラ
}
```

**テストファイル**: `NewArticlesNotification.test.tsx`

---

### 3. pollingStorage.ts

**場所**: `frontend/src/services/pollingStorage.ts`

**役割**: localStorageへのポーリング設定の保存/読み込み

**主要機能**:
- `loadPollingConfig()`: ページ読み込み時に設定を復元
- `savePollingConfig()`: ポーリング完了時に状態を保存
- エラーハンドリング（localStorageが無効な場合）

**データ構造**:
```typescript
interface PollingStorage {
  lastPolledAt: number | null
  pollingInterval: number
  enabled: boolean
}
```

**テストファイル**: `pollingStorage.test.ts`

---

### 4. articleMerge.ts

**場所**: `frontend/src/utils/articleMerge.ts`

**役割**: 新着記事と既存記事のマージ、重複判定

**主要機能**:
- `findNewArticles()`: 新着記事のみを抽出（Set.has()で高速）
- `mergeArticles()`: 新着と既存をマージし、日付順にソート

**計算量**: O(n + m)（n = 新着記事数、m = 既存記事数）

**テストファイル**: `articleMerge.test.ts`

---

### 5. polling-flow.test.tsx

**場所**: `frontend/tests/integration/polling-flow.test.tsx`

**役割**: ポーリング機能の統合テスト

**テストシナリオ**:
1. 10分経過→新着検出→通知表示
2. 「読み込む」ボタン→記事反映→通知非表示
3. オフライン→ポーリング停止→オンライン→ポーリング再開

---

## 既存ファイルの変更

### 1. ArticleContext.tsx

**変更内容**:
- `ArticleState`に4つのフィールドを追加
  - `pendingArticles: Article[]`
  - `hasNewArticles: boolean`
  - `newArticlesCount: number`
  - `lastPolledAt: number | null`
- `ArticleAction`に3つのアクションを追加
  - `SET_PENDING_ARTICLES`
  - `APPLY_PENDING_ARTICLES`
  - `SET_LAST_POLLED_AT`

**破壊的変更**: なし（既存のアクションはそのまま）

---

### 2. FeedContainer.tsx

**変更内容**:
- `useFeedPolling`フックを呼び出し
- ポーリング結果をArticleContextに反映
- `applyNewArticles`関数をApp.tsxに公開

**コード例**:
```typescript
const { pollingState, applyNewArticles } = useFeedPolling(
  subState.subscriptions,
  articles,
  { interval: 600000, enabled: true }
)

useEffect(() => {
  if (pollingState.hasNewArticles) {
    articleDispatch({
      type: 'SET_PENDING_ARTICLES',
      payload: pollingState.pendingArticles
    })
  }
}, [pollingState.hasNewArticles, pollingState.pendingArticles])
```

---

### 3. App.tsx

**変更内容**:
- `NewArticlesNotification`コンポーネントを追加
- `handleLoadNewArticles`関数を実装（`APPLY_PENDING_ARTICLES`をdispatch）

**コード例**:
```typescript
<NewArticlesNotification
  visible={articleState.hasNewArticles}
  count={articleState.newArticlesCount}
  onLoad={handleLoadNewArticles}
/>
```

---

## セットアップ

### 前提条件

- Node.js 18+
- npm 9+
- 既存のfeed-parallel-parse-apiが動作している

### インストール

```bash
# 依存関係のインストール（新規ライブラリなし）
cd frontend
npm install

# テスト実行（全テストがパスすることを確認）
npm test
```

### ブランチ

```bash
git checkout 016-feed-auto-polling
```

---

## 開発フロー

### 1. TDDサイクル

このプロジェクトはt-wada式TDDを採用しています。実装前に必ずテストを書いてください。

```
Red（失敗するテストを書く）
  ↓
Green（最小限の実装でテストを通す）
  ↓
Refactor（コードの品質を向上）
```

### 2. 実装順序（推奨）

#### Phase 1: ユーティリティ関数

1. **articleMerge.ts**:
   - Red: `articleMerge.test.ts`を書く
   - Green: `findNewArticles`, `mergeArticles`を実装
   - Refactor: 重複排除、型安全性向上

#### Phase 2: localStorage管理

2. **pollingStorage.ts**:
   - Red: `pollingStorage.test.ts`を書く
   - Green: `loadPollingConfig`, `savePollingConfig`を実装
   - Refactor: エラーハンドリング改善

#### Phase 3: ArticleContext拡張

3. **ArticleContext.tsx**:
   - Red: `ArticleContext.test.tsx`に新規アクションのテストを追加
   - Green: Reducerに3つのアクションを実装
   - Refactor: 重複コード排除

#### Phase 4: ポーリングロジック

4. **useFeedPolling.ts**:
   - Red: `useFeedPolling.test.ts`を書く（vi.useFakeTimersを使用）
   - Green: setIntervalでポーリング実装
   - Refactor: メモリリーク防止、エラーハンドリング

#### Phase 5: 通知UI

5. **NewArticlesNotification.tsx**:
   - Red: `NewArticlesNotification.test.tsx`を書く
   - Green: UIコンポーネントを実装
   - Refactor: アクセシビリティ対応、アニメーション追加

#### Phase 6: 統合

6. **FeedContainer.tsx, App.tsx**:
   - Red: `polling-flow.test.tsx`を書く（統合テスト）
   - Green: useFeedPollingとNewArticlesNotificationを統合
   - Refactor: コンポーネント間の結合度を下げる

### 3. テスト実行

```bash
# 全テスト実行
npm test

# 特定のテストファイルのみ実行
npm test useFeedPolling.test.ts

# カバレッジレポート生成
npm test -- --coverage
```

**注意**: watchモードは使用しない（CPU負荷対策）

---

## テスト戦略

### 単体テスト

**vi.useFakeTimers()を使用**:

```typescript
import { vi } from 'vitest'

beforeEach(() => {
  vi.useFakeTimers() // タイマーをモック化
})

afterEach(() => {
  vi.restoreAllMocks()
})

it('10分ごとにポーリングを実行する', async () => {
  // ... レンダリング

  act(() => {
    vi.advanceTimersByTime(600000) // 10分経過をシミュレート
  })

  // ... アサーション
})
```

### 統合テスト

**React Testing Library**:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

it('ポーリング→検出→通知→反映のフローが動作する', async () => {
  render(<App />)

  // 10分経過
  act(() => { vi.advanceTimersByTime(600000) })

  // 通知表示を確認
  await waitFor(() => {
    expect(screen.getByText(/新着記事があります/)).toBeInTheDocument()
  })

  // 読み込みボタンをクリック
  fireEvent.click(screen.getByRole('button', { name: /読み込む/ }))

  // 記事反映を確認
  await waitFor(() => {
    expect(screen.getByText('New Article')).toBeInTheDocument()
  })
})
```

---

## デバッグ

### 1. ポーリングが実行されているか確認

**ブラウザコンソール**:

```javascript
// ArticleContextの状態を確認
window.__ARTICLE_STATE__ // lastPolledAtをチェック
```

**React DevTools**:
- ArticleProviderのStateを確認
- `lastPolledAt`が10分ごとに更新されているか確認

### 2. 新着記事が検出されない

**確認ポイント**:
1. `fetchFeeds`が正しく動作しているか（Network タブ）
2. `findNewArticles`で重複判定が正しく動作しているか
3. 記事IDが正しく生成されているか（`${feedId}-${link}`）

**デバッグコード**:

```typescript
useEffect(() => {
  console.log('Current articles:', currentArticles.map(a => a.id))
  console.log('Latest articles:', latestArticles.map(a => a.id))
  console.log('New articles:', newArticles.map(a => a.id))
}, [currentArticles, latestArticles, newArticles])
```

### 3. メモリリーク確認

**Chrome DevTools**:
1. Performance タブ → Memory をチェック
2. コンポーネントをアンマウント
3. `clearInterval`が正しく呼ばれているか確認

**テストで確認**:

```typescript
it('アンマウント時にタイマーをクリアする', () => {
  const { unmount } = renderHook(() => useFeedPolling(...))

  unmount()

  // タイマーが残っていないことを確認
  expect(vi.getTimerCount()).toBe(0)
})
```

---

## 設定

### ポーリング間隔の変更（開発時のみ）

**useFeedPolling呼び出し時に変更**:

```typescript
const { pollingState } = useFeedPolling(
  subscriptions,
  articles,
  {
    interval: 60000, // 1分（開発時のみ）
    enabled: true,
  }
)
```

**注意**: 本番環境では10分固定

### ポーリングの無効化

```typescript
const { pollingState } = useFeedPolling(
  subscriptions,
  articles,
  {
    interval: 600000,
    enabled: false, // ポーリング無効化
  }
)
```

---

## トラブルシューティング

### Q1: ポーリングが10分ごとに実行されない

**原因**:
- タブが非アクティブ（ブラウザが1分に1回まで制限）
- オフライン状態（useNetworkStatusがオフラインを検出）

**解決策**:
- タブをアクティブにする
- ネットワーク接続を確認

### Q2: 新着通知が表示されない

**原因**:
- `hasNewArticles`がfalse
- `pendingArticles`が空

**解決策**:
- ArticleContextの状態を確認（React DevTools）
- `findNewArticles`のロジックを確認

### Q3: テストがタイムアウトする

**原因**:
- `vi.useFakeTimers()`を呼び忘れ
- `act()`で囲んでいない

**解決策**:
```typescript
beforeEach(() => {
  vi.useFakeTimers()
})

// テスト内
act(() => {
  vi.advanceTimersByTime(600000)
})
```

---

## パフォーマンス最適化

### 1. 重複判定の高速化

```typescript
// Set.has()でO(1)
const currentIds = new Set(currentArticles.map(a => a.id))
return latestArticles.filter(article => !currentIds.has(article.id))
```

### 2. メモリ使用量の削減

- pendingArticlesは最大数千件（約1-2MB）
- 必要ない場合は早めにクリア（`APPLY_PENDING_ARTICLES`）

### 3. ポーリング頻度の最適化

- 10分間隔でバランス良好
- 短すぎるとAPI負荷増、長すぎると鮮度低下

---

## 次のステップ

1. `/speckit.tasks`コマンドでtasks.mdを生成
2. TDDサイクルで実装開始（Red→Green→Refactor）
3. コードレビュー（6つの観点）
4. PR作成
5. マージ

---

## 参考資料

- [spec.md](./spec.md): 機能仕様書
- [plan.md](./plan.md): 実装計画
- [research.md](./research.md): 技術調査結果
- [data-model.md](./data-model.md): データモデル定義
- [constitution.md](../../.specify/memory/constitution.md): 開発原則（TDD、型安全性等）

---

**Happy Coding!** 🚀
