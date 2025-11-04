# Data Model: アプリ内インタラクティブチュートリアル

**Feature**: 017-in-app-tutorial
**Date**: 2025-11-04
**Status**: Design Complete

## Overview

このドキュメントでは、チュートリアル機能のデータモデルを定義します。driver.jsのステップ定義、localStorage状態管理、TypeScript型定義を含みます。

## Entity Definitions

### 1. TutorialState（チュートリアル状態）

**Purpose**: チュートリアルの完了状態を管理

**Storage**: localStorage
- Key: `'rss_reader_tutorial_seen'`
- Type: `boolean`
- Initial Value: `false`

**TypeScript Interface**:
```typescript
interface TutorialState {
  hasSeenTutorial: boolean  // チュートリアル完了フラグ
}
```

**State Transitions**:
```
[初回訪問]
  hasSeenTutorial: false
    ↓
[チュートリアル開始]
  (状態変更なし)
    ↓
[チュートリアル完了 or スキップ]
  hasSeenTutorial: true
    ↓
[ヘルプボタンクリック]
  hasSeenTutorial: true (変更なし、再表示のみ)
    ↓
[リセット（デバッグ用）]
  hasSeenTutorial: false
```

---

### 2. TutorialStep（チュートリアルステップ定義）

**Purpose**: 各ステップの表示内容とターゲット要素を定義

**TypeScript Interface** (driver.js DriveStep型):
```typescript
import type { DriveStep } from 'driver.js'

// driver.jsの型を再エクスポート
export type TutorialStep = DriveStep

// または明示的定義
export interface TutorialStep {
  element: string  // CSSセレクター
  popover: {
    title: string           // ステップタイトル
    description: string     // 説明文
    side?: 'top' | 'bottom' | 'left' | 'right'  // ポップアップ位置
    align?: 'start' | 'center' | 'end'          // 位置揃え
  }
}
```

**Properties**:

| Property | Type | Required | Description | Example |
|----------|------|----------|-------------|---------|
| element | string | Yes | DOM要素のCSSセレクター | `'input[aria-label="フィードURL"]'` |
| popover.title | string | Yes | ステップのタイトル | `'ステップ1: RSSフィードを追加'` |
| popover.description | string | Yes | ステップの説明文 | `'RSSフィードのURLをここに入力...'` |
| popover.side | string | No | ポップアップの表示位置 | `'bottom'` |
| popover.align | string | No | ポップアップの揃え位置 | `'start'` |

---

### 3. TUTORIAL_STEPS（定数）

**Purpose**: 7ステップの具体的な定義

**File**: `frontend/src/constants/tutorialSteps.ts`

**TypeScript Definition**:
```typescript
import type { DriveStep } from 'driver.js'

export const TUTORIAL_STEPS: DriveStep[] = [
  {
    element: 'input[aria-label="フィードURL"]',
    popover: {
      title: 'ステップ1: RSSフィードを追加',
      description: 'RSSフィードのURLをここに入力して、記事を購読しましょう。例: https://example.com/feed.xml',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: 'button[aria-label="フィードを追加"]',
    popover: {
      title: 'ステップ2: フィードを購読',
      description: 'URLを入力したら、このボタンをクリックして購読リストに追加します。',
      side: 'left',
      align: 'start'
    }
  },
  {
    element: '.subscription-list',  // 実装時に確認
    popover: {
      title: 'ステップ3: 購読リスト',
      description: '購読中のフィードがここに表示されます。タイトルの編集や削除も可能です。',
      side: 'top',
      align: 'start'
    }
  },
  {
    element: '.import-export-buttons',  // 実装時に確認
    popover: {
      title: 'ステップ4: インポート/エクスポート',
      description: 'フィードリストをJSONファイルでバックアップしたり、他のデバイスに移行できます。',
      side: 'bottom',
      align: 'center'
    }
  },
  {
    element: 'input[role="searchbox"]',
    popover: {
      title: 'ステップ5: 記事を検索',
      description: 'キーワードを入力して、記事のタイトルや要約を絞り込んで検索できます。',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '.polling-status',  // 実装時に確認
    popover: {
      title: 'ステップ6: 自動更新',
      description: '10分ごとに自動でフィードを取得します。最終取得時刻と次回取得までの時間がここに表示されます。',
      side: 'left',
      align: 'center'
    }
  },
  {
    element: 'article:first-child',
    popover: {
      title: 'ステップ7: 記事を読む',
      description: '記事タイトルをクリックすると、元のサイトで記事全文を読むことができます。お疲れ様でした！',
      side: 'top',
      align: 'start'
    }
  }
]
```

**Note**: CSSセレクターは実装Phase 2.1のT008で実際のDOMを確認し、必要に応じて更新

---

## Hook Interface

### useTutorial Hook

**File**: `frontend/src/hooks/useTutorial.ts`

**TypeScript Definition**:
```typescript
/**
 * チュートリアル管理カスタムフック
 *
 * @returns チュートリアル制御オブジェクト
 *
 * @example
 * ```tsx
 * function App() {
 *   const { shouldShowTutorial, startTutorial } = useTutorial()
 *
 *   useEffect(() => {
 *     if (subscriptions.length === 0 && shouldShowTutorial) {
 *       startTutorial()
 *     }
 *   }, [subscriptions, shouldShowTutorial, startTutorial])
 *
 *   return (
 *     <button onClick={startTutorial}>ヘルプ</button>
 *   )
 * }
 * ```
 */
export function useTutorial(): {
  /**
   * チュートリアルを初回表示すべきか
   * localStorage の `hasSeenTutorial` がfalseの場合にtrue
   */
  shouldShowTutorial: boolean

  /**
   * チュートリアルを開始する関数
   * driver.jsを初期化し、TUTORIAL_STEPSを表示
   * 完了時にlocalStorageを更新
   */
  startTutorial: () => void

  /**
   * チュートリアル状態をリセットする関数（デバッグ用）
   * localStorageの `hasSeenTutorial` をfalseに戻す
   */
  resetTutorial: () => void
}
```

**Internal Implementation**:
```typescript
import { driver, type DriveStep } from 'driver.js'
import { useLocalStorage } from './useLocalStorage'
import { TUTORIAL_STEPS } from '../constants/tutorialSteps'

export function useTutorial() {
  const [hasSeenTutorial, setHasSeenTutorial] = useLocalStorage(
    'rss_reader_tutorial_seen',
    false
  )

  const startTutorial = () => {
    const driverObj = driver({
      steps: TUTORIAL_STEPS,
      showProgress: true,
      allowClose: true,
      overlayClickNext: false,
      onDestroyed: () => setHasSeenTutorial(true),
      progressText: 'ステップ {{current}} / {{total}}'
    })

    driverObj.drive()
  }

  return {
    shouldShowTutorial: !hasSeenTutorial,
    startTutorial,
    resetTutorial: () => setHasSeenTutorial(false)
  }
}
```

---

## Data Flow

### 初回訪問時の自動表示

```
[App.tsx レンダリング]
    ↓
[useTutorial() 呼び出し]
    ↓
[localStorage読み取り]
  rss_reader_tutorial_seen = undefined または false
    ↓
[shouldShowTutorial = true]
    ↓
[useEffect で subscriptions.length === 0 確認]
    ↓
[startTutorial() 呼び出し]
    ↓
[driver.js初期化]
    ↓
[TUTORIAL_STEPS表示]
    ↓
[ユーザーが完了/スキップ]
    ↓
[onDestroyed コールバック]
    ↓
[setHasSeenTutorial(true)]
    ↓
[localStorage更新]
  rss_reader_tutorial_seen = true
    ↓
[次回訪問時は自動表示されない]
```

### ヘルプボタンからの再表示

```
[ヘルプボタンクリック]
    ↓
[onClick={startTutorial}]
    ↓
[driver.js初期化]
    ↓
[TUTORIAL_STEPS表示]
    ↓
[localStorage変更なし]
  （既にtrueなので、再表示可能）
```

---

## Validation Rules

### CSSセレクター検証

**Rule**: すべてのセレクターは実装時に実際のDOMで検証すること

**Validation Checklist**:
- [ ] Step 1: `input[aria-label="フィードURL"]` が存在
- [ ] Step 2: `button[aria-label="フィードを追加"]` が存在
- [ ] Step 3: `.subscription-list` が存在
- [ ] Step 4: `.import-export-buttons` が存在
- [ ] Step 5: `input[role="searchbox"]` が存在
- [ ] Step 6: `.polling-status` が存在
- [ ] Step 7: `article:first-child` が存在

**Fallback**:
セレクターが見つからない場合、driver.jsは自動的にそのステップをスキップ

---

## localStorage Schema

### Key-Value Structure

```typescript
{
  // 既存のキー
  "subscriptions": [...]  // 購読リスト
  "pollingInterval": 600000  // ポーリング間隔
  "lastPollingTime": "2025-11-04T10:00:00.000Z"  // 最終ポーリング時刻

  // 新規追加
  "rss_reader_tutorial_seen": true  // チュートリアル完了フラグ
}
```

### localStorage無効時の動作

**Scenario**: ブラウザでlocalStorageが無効化されている

**Behavior**:
- `useLocalStorage` フックがエラーをキャッチ
- デフォルト値（`false`）を返す
- チュートリアルが毎回表示される（フォールバック）
- エラーはユーザーに表示せず、console.errorでログ出力のみ

---

## Type Safety

### TypeScript Strict Mode

**tsconfig.json** (既存):
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Enforcement**:
- すべての変数、関数、Propsに明示的な型定義
- `any`型の使用禁止
- driver.jsの型定義（`DriveStep`）を活用

---

## Testing Considerations

### Unit Test Mock Data

```typescript
// useTutorial.test.ts
import { renderHook, act } from '@testing-library/react'
import { useTutorial } from './useTutorial'

// localStorageモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock as any

// driver.jsモック
vi.mock('driver.js', () => ({
  driver: vi.fn(() => ({
    drive: vi.fn()
  }))
}))
```

---

## Summary

- **TutorialState**: localStorage管理（boolean 1件）
- **TutorialStep**: driver.jsの`DriveStep`型を使用（7ステップ定義）
- **useTutorial Hook**: ロジックをカプセル化、テスト可能
- **Type Safety**: TypeScript strict mode、any禁止
- **Fallback**: localStorage無効時も動作（毎回表示）

**Next**: quickstart.md作成 → 実装開始
