# Research: フィード自動ポーリング機能

**Feature**: 016-feed-auto-polling
**Date**: 2025-11-03
**Researchers**: Claude Code
**Status**: Complete

## 調査の目的

10分ごとのバックグラウンドポーリング機能を実装するための技術選択、既存コードとの統合方法、テスト戦略を調査する。

## Research Task 1: ポーリング実装パターンの調査

### 調査対象

- setInterval
- Web Workers
- Service Worker (Periodic Background Sync API)

### 調査結果

#### 1. setInterval + React Custom Hook

**利点**:
- シンプルで理解しやすい
- Reactのライフサイクルと自然に統合
- useEffectのcleanupで確実にクリーンアップ可能
- 既存のContext、Hooksと統合が容易
- テストが容易（vi.useFakeTimers()でモック可能）

**欠点**:
- タブが非アクティブ時、ブラウザが1分に1回まで制限する
- メインスレッドで実行（ただし、API呼び出しは非同期なので影響軽微）

**適用性**:
- 10分間隔なので、タブ非アクティブ時の1分制限は問題ない
- ユーザーは通常アクティブなタブでRSSリーダーを使用する

#### 2. Web Workers

**利点**:
- バックグラウンドスレッドで実行
- UIスレッドへの影響なし

**欠点**:
- DOM操作不可（Contextに直接アクセスできない）
- postMessage経由の通信が必要（複雑性増）
- 既存のuseFeedAPI、Contextと統合が困難
- テストの複雑性が増す

**適用性**:
- オーバーエンジニアリング
- 10分間隔のポーリングにはsetIntervalで十分

#### 3. Service Worker (Periodic Background Sync API)

**利点**:
- 真のバックグラウンド処理
- タブが閉じていてもポーリング可能

**欠点**:
- **実験的機能**（ChromeとEdgeのみサポート、Firefoxは未対応）
- 複雑な実装（Service WorkerとReactの通信）
- 既存のPWA設定（vite-plugin-pwa）との統合が必要
- ユーザー設定（ポーリング間隔）の反映が困難
- デバッグが困難

**適用性**:
- 機能要件を満たさない（ブラウザ互換性）
- 複雑すぎる（YAGNIに違反）

### 決定

**選択**: setInterval + React Custom Hook (`useFeedPolling`)

**理由**:
1. シンプルかつ確実
2. 既存のuseFeedAPI、ArticleContext、useNetworkStatusと自然に統合
3. テスタビリティが高い
4. ブラウザ互換性が高い
5. 10分間隔なので、タブ非アクティブ時の制限は問題ない

### 実装方針

```typescript
function useFeedPolling(
  subscriptions: Subscription[],
  currentArticles: Article[],
  config: PollingConfig
): PollingState {
  const [pollingState, setPollingState] = useState<PollingState>({
    pendingArticles: [],
    lastPolledAt: null,
    newArticlesCount: 0,
    hasNewArticles: false,
  })

  const { isOnline } = useNetworkStatus()
  const { fetchFeeds } = useFeedAPI()

  useEffect(() => {
    if (!isOnline || !config.enabled) {
      return // オフライン時は停止
    }

    const intervalId = setInterval(async () => {
      const latestArticles = await fetchFeeds(subscriptions)
      const newArticles = findNewArticles(latestArticles, currentArticles)

      if (newArticles.length > 0) {
        setPollingState({
          pendingArticles: newArticles,
          lastPolledAt: Date.now(),
          newArticlesCount: newArticles.length,
          hasNewArticles: true,
        })
      }
    }, config.interval)

    // 必須: クリーンアップでメモリリーク防止
    return () => clearInterval(intervalId)
  }, [isOnline, config.enabled, config.interval, subscriptions])

  return pollingState
}
```

---

## Research Task 2: 既存コードとの統合方法の調査

### 調査対象

- useFeedAPI（既存の手動更新機能）
- ArticleContext（既存の状態管理）
- useNetworkStatus（既存のネットワーク状態監視）

### 調査結果

#### 1. useFeedAPIの再利用

**既存実装**:
- `fetchFeeds(subscriptions: Subscription[]): Promise<Article[]>`
- 並列API呼び出し、エラーハンドリング、記事ソート済み
- タイムアウト10秒、AbortControllerでキャンセル可能

**統合方法**:
- useFeedPollingから`fetchFeeds`を直接呼び出す
- 既存のエラーハンドリングをそのまま活用
- ポーリング失敗時はログのみ（エラー通知は表示しない）

**利点**:
- コードの重複なし
- 既存のAPI呼び出しロジックを100%再利用
- 保守性が高い

#### 2. ArticleContextの拡張

**既存実装**:

```typescript
interface ArticleState {
  articles: Article[]
  displayedArticles: Article[]
  searchQuery: string
  selectedFeedId: string | null
  isLoading: boolean
  errors: FeedError[]
}

type ArticleAction =
  | { type: 'SET_ARTICLES'; payload: Article[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_ERROR'; payload: FeedError }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_FEED'; payload: string | null }
```

**拡張方針**:

```typescript
interface ArticleState {
  // 既存
  articles: Article[]
  displayedArticles: Article[]
  searchQuery: string
  selectedFeedId: string | null
  isLoading: boolean
  errors: FeedError[]

  // 新規追加
  pendingArticles: Article[]      // ポーリングで取得した未反映の記事
  hasNewArticles: boolean         // 新着あり
  newArticlesCount: number        // 新着件数
  lastPolledAt: number | null     // 最終ポーリング時刻
}

type ArticleAction =
  // 既存
  | ...
  // 新規追加
  | { type: 'SET_PENDING_ARTICLES'; payload: Article[] }
  | { type: 'APPLY_PENDING_ARTICLES' }
  | { type: 'SET_LAST_POLLED_AT'; payload: number }
```

**Reducerロジック**:

```typescript
case 'SET_PENDING_ARTICLES':
  return {
    ...state,
    pendingArticles: action.payload,
    hasNewArticles: action.payload.length > 0,
    newArticlesCount: action.payload.length,
  }

case 'APPLY_PENDING_ARTICLES':
  const mergedArticles = mergeArticles(state.articles, state.pendingArticles)
  return {
    ...state,
    articles: mergedArticles,
    displayedArticles: applyFilters(mergedArticles, state.searchQuery, state.selectedFeedId),
    pendingArticles: [],
    hasNewArticles: false,
    newArticlesCount: 0,
  }
```

**利点**:
- 既存の状態管理パターンを踏襲
- 破壊的変更なし（既存のアクションはそのまま）
- テスタビリティが高い

#### 3. useNetworkStatusの活用

**既存実装**:

```typescript
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [lastChecked, setLastChecked] = useState<number>(Date.now())

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setLastChecked(Date.now())
    }

    const handleOffline = () => {
      setIsOnline(false)
      setLastChecked(Date.now())
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, lastChecked }
}
```

**統合方法**:

```typescript
// useFeedPolling内で使用
const { isOnline } = useNetworkStatus()

useEffect(() => {
  if (!isOnline) {
    return // オフライン時はポーリング停止
  }

  // ポーリングロジック
}, [isOnline])
```

**利点**:
- オフライン検出が自動
- ポーリングの自動停止/再開
- バッテリー消費の最適化

### 決定

**既存コードを最大限再利用**:
- useFeedAPI: `fetchFeeds`を直接呼び出し
- ArticleContext: 4つの状態と3つのアクションを追加（破壊的変更なし）
- useNetworkStatus: オフライン検出に使用

---

## Research Task 3: 新着通知UIの設計調査

### 調査対象

- 既存PWA通知コンポーネント（UpdateNotification, OnlineNotification, OfflineNotification）
- アクセシビリティ対応（ARIA属性）
- TailwindCSSアニメーション

### 調査結果

#### 1. 既存PWA通知コンポーネントの分析

**UpdateNotification** (`/frontend/src/components/UpdateNotification.tsx`):

```typescript
interface Props {
  visible: boolean
  onUpdate: () => void
}

<div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
  <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded shadow-lg flex items-center gap-3">
    <svg /> {/* アイコン */}
    <div className="flex-1">
      <h3 className="font-semibold">新しいバージョンが利用可能です</h3>
    </div>
    <button onClick={onUpdate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
      更新
    </button>
  </div>
</div>
```

**統一されたパターン**:
- 位置: `fixed`, `left-1/2`, `transform -translate-x-1/2`（中央配置）
- 色: `bg-{color}-100`, `border-l-4 border-{color}-500`, `text-{color}-700`
- 構造: アイコン + メッセージ + アクションボタン
- z-index: `z-50`

#### 2. 新着通知UIの設計

**NewArticlesNotification**:

```typescript
interface Props {
  visible: boolean
  count: number
  onLoad: () => void
}

<div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40">
  {visible && (
    <div
      className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg flex items-center gap-3 animate-slideDown"
      role="status"
      aria-live="polite"
      aria-label={`新着記事 ${count} 件`}
    >
      <svg className="w-6 h-6" /> {/* ベルアイコン */}
      <div className="flex-1">
        <h3 className="font-semibold">新着記事があります ({count}件)</h3>
      </div>
      <button
        onClick={onLoad}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
        aria-label="新着記事を読み込む"
      >
        読み込む
      </button>
    </div>
  )}
</div>
```

**配置戦略**:
- UpdateNotification: `bottom-4` (画面下部)
- OnlineNotification: `top-4` (画面上部)
- **NewArticlesNotification**: `top-20` (ヘッダー直下、OnlineNotificationより下)

**色選択**:
- 緑系（`green-*`）: ポジティブな情報（新着記事）
- 青系（`blue-*`）: 情報（Service Worker更新）
- 黄系（`yellow-*`）: 警告（オフライン）

#### 3. アクセシビリティ対応

**ARIA属性**:
- `role="status"`: 動的な状態変化を示す
- `aria-live="polite"`: スクリーンリーダーが適切なタイミングで読み上げ
- `aria-label`: 要素の説明

**キーボード操作**:
- Tabキーでボタンにフォーカス
- Enterキーで読み込み実行
- Escキーで通知を閉じる（オプション）

#### 4. アニメーション

**TailwindCSS カスタムアニメーション**:

```css
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideDown {
  animation: slideDown 0.3s ease-out;
}
```

**フェードアウト**:

```tsx
<div className={`transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
```

### 決定

**NewArticlesNotificationを新規作成**:
- 既存のPWA通知パターンを踏襲
- 緑色（ポジティブな情報）
- 画面上部中央（`top-20`、ヘッダー直下）
- ARIA属性完備
- スライドダウン + フェードインアニメーション

---

## Research Task 4: テスト戦略の調査

### 調査対象

- setIntervalのモック方法
- ポーリング処理の統合テスト手法
- 時間経過のシミュレーション方法

### 調査結果

#### 1. setIntervalのモック (Vitest)

**vi.useFakeTimers()**:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFeedPolling } from './useFeedPolling'

describe('useFeedPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers() // タイマーをモック化
  })

  afterEach(() => {
    vi.restoreAllMocks() // モックを復元
  })

  it('10分ごとにポーリングを実行する', async () => {
    const { result } = renderHook(() => useFeedPolling(...))

    // 10分経過をシミュレート
    act(() => {
      vi.advanceTimersByTime(600000) // 10分 = 600000ms
    })

    await waitFor(() => {
      expect(result.current.pollingState.lastPolledAt).not.toBeNull()
    })
  })
})
```

**利点**:
- 実際に10分待つ必要なし
- テスト実行が高速（ミリ秒単位）
- 時間経過を自由に制御

#### 2. useFeedAPIのモック

**vi.mock()**:

```typescript
vi.mock('../hooks/useFeedAPI', () => ({
  useFeedAPI: vi.fn(() => ({
    fetchFeeds: vi.fn(async () => [
      { id: '1-link1', title: 'New Article', ... },
      { id: '1-link2', title: 'Another Article', ... },
    ]),
    articles: [],
    errors: [],
    isLoading: false,
  }))
}))
```

**利点**:
- 実際のAPI呼び出しなし
- テストの独立性が高い
- エラーケースも容易にテスト可能

#### 3. 統合テストの手法

**React Testing Library + Vitest**:

```typescript
describe('ポーリング統合テスト', () => {
  it('ポーリング→検出→通知→反映のフローが動作する', async () => {
    // 1. コンポーネントをレンダリング
    render(<App />)

    // 2. 10分経過をシミュレート
    act(() => {
      vi.advanceTimersByTime(600000)
    })

    // 3. 新着通知が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText(/新着記事があります/)).toBeInTheDocument()
    })

    // 4. 「読み込む」ボタンをクリック
    const loadButton = screen.getByRole('button', { name: /読み込む/ })
    fireEvent.click(loadButton)

    // 5. 記事一覧に新着記事が追加されることを確認
    await waitFor(() => {
      expect(screen.getByText('New Article')).toBeInTheDocument()
    })

    // 6. 通知が消えることを確認
    expect(screen.queryByText(/新着記事があります/)).not.toBeInTheDocument()
  })
})
```

**利点**:
- ユーザーシナリオ全体をテスト
- コンポーネント間の連携を検証
- リグレッション防止

#### 4. オフライン/オンライン状態のテスト

**navigator.onLineのモック**:

```typescript
it('オフライン時はポーリングを停止する', () => {
  // オフライン状態をシミュレート
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: false,
  })

  // offlineイベントを発火
  window.dispatchEvent(new Event('offline'))

  // ポーリングが実行されないことを確認
  act(() => {
    vi.advanceTimersByTime(600000)
  })

  expect(fetchFeedsMock).not.toHaveBeenCalled()
})
```

**利点**:
- ネットワーク状態の変化をテスト可能
- 実際にオフラインにする必要なし

### 決定

**テスト戦略**:
1. **単体テスト**: vi.useFakeTimers()でタイマーをモック、vi.mock()でAPI呼び出しをモック
2. **統合テスト**: React Testing Libraryでコンポーネント間の連携をテスト
3. **E2Eテスト**: Vitestのhappy-domでブラウザ環境をシミュレート

**カバレッジ目標**:
- useFeedPolling: 100%
- NewArticlesNotification: 100%
- ArticleContext（拡張部分）: 100%
- 統合テスト: 主要フローをカバー

---

## 技術スタックの最終決定

### フロントエンド

- **ポーリング実装**: setInterval + React Custom Hook (`useFeedPolling`)
- **状態管理**: ArticleContextの拡張（破壊的変更なし）
- **UI**: TailwindCSS 4.1.16（既存のPWA通知パターンを踏襲）
- **ネットワーク監視**: useNetworkStatus（既存）
- **ストレージ**: localStorage（ポーリング設定、最終ポーリング時刻）

### テスト

- **フレームワーク**: Vitest 4.0.3
- **UI テスト**: @testing-library/react 16.3.0
- **モック**: vi.useFakeTimers(), vi.mock()
- **カバレッジ**: 100%（新規コード）

### 新規依存関係

**なし** - すべて既存の依存関係で実装可能

---

## リスクと対策

### リスク1: タブ非アクティブ時のsetInterval制限

**問題**: ブラウザはバックグラウンドタブで1分に1回までしかsetIntervalを実行しない

**対策**:
- 10分間隔なので、1分制限の影響は軽微
- ユーザーは通常アクティブなタブでRSSリーダーを使用
- document.visibilitychangeイベントで、タブアクティブ時に即座にポーリング実行（オプション）

**優先度**: Low（10分間隔なので問題ない）

### リスク2: メモリリーク

**問題**: setIntervalやAbortControllerが解放されない

**対策**:
- useEffectのクリーンアップで必ず`clearInterval`
- AbortControllerも必ず`abort()`
- テストで検証（unmount後にタイマーが残っていないか確認）

**優先度**: High（TDDで徹底的にテスト）

### リスク3: API呼び出しの失敗頻度増加

**問題**: 10分ごとのポーリングでAPI呼び出しが増加し、エラー率が上がる可能性

**対策**:
- 既存のエラーハンドリングを活用
- ポーリング失敗時はログ出力のみ、エラー通知は表示しない
- ユーザーは手動更新ボタンでいつでもリトライ可能

**優先度**: Medium（既存のエラーハンドリングで対応可能）

---

## パフォーマンス検証

### ポーリング処理の負荷

- **API呼び出し**: 既存の`fetchFeeds`を使用（10秒タイムアウト）
- **記事比較**: O(n)（n = 記事数、通常数百件）
- **UI更新**: React の差分更新により最小限

**結論**: パフォーマンスへの影響は軽微

### メモリ使用量

- **pendingArticles**: 最大数百件（数MB）
- **localStorage**: 数KB（ポーリング設定のみ）

**結論**: メモリ使用量は許容範囲内

---

## 次のステップ

Phase 0（research.md）完了。次のフェーズに進む：

1. **Phase 1**: data-model.md、quickstart.mdを作成
2. **Phase 2**: `/speckit.tasks`でtasks.mdを生成
3. **実装開始**: TDDサイクル（Red→Green→Refactor）
