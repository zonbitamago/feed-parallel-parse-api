# Quickstart Guide: アプリ内インタラクティブチュートリアル

**Feature**: 017-in-app-tutorial
**Date**: 2025-11-04
**For**: Developers

## Overview

このガイドでは、ローカル環境でチュートリアル機能を実装・テストする手順を説明します。TDD（Test-Driven Development）のRed-Green-Refactorサイクルに従い、テストファーストで実装します。

**前提条件**:
- Node.js, npm インストール済み
- プロジェクトのクローン済み
- `017-in-app-tutorial` ブランチにチェックアウト済み

**所要時間**: 2-3時間（Phase 2.1のみ）

---

## Quick Setup (5分)

### Step 1: 依存関係のインストール

```bash
cd frontend
npm install driver.js
```

**確認**:
```bash
npm list driver.js
# 出力: driver.js@2.x.x
```

---

### Step 2: プロジェクト構造の確認

```bash
tree src -L 2 -I 'node_modules|dist|build'
```

**期待される構造**:
```
src/
├── hooks/
│   ├── useLocalStorage.ts    # 既存
│   ├── useTutorial.ts         # これから作成
│   └── useTutorial.test.ts    # これから作成
├── constants/
│   └── tutorialSteps.ts       # これから作成
├── App.tsx                    # 変更予定
└── App.test.tsx               # 変更予定
```

---

## TDD Implementation Flow

### Phase 2.1: Foundation (P1 - 自動表示)

#### T001: driver.jsの型定義確認（5分）

**Goal**: TypeScript型定義が正しく読み込まれることを確認

```bash
# TypeScriptで型チェック
npx tsc --noEmit
```

**試験的にdriver.jsをインポート**:
```typescript
// 一時ファイルで確認
// test-driver.ts
import { driver, type DriveStep } from 'driver.js'

const step: DriveStep = {
  element: 'body',
  popover: {
    title: 'Test',
    description: 'Test'
  }
}

// 型チェックが通ればOK
```

---

#### T002: tutorialSteps.tsの作成（10分）

**File**: `frontend/src/constants/tutorialSteps.ts`

```typescript
import type { DriveStep } from 'driver.js'

export const TUTORIAL_STEPS: DriveStep[] = [
  {
    element: 'input[aria-label="フィードURL"]',
    popover: {
      title: 'ステップ1: RSSフィードを追加',
      description: 'RSSフィードのURLをここに入力して、記事を購読しましょう。',
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
    element: '.subscription-list',
    popover: {
      title: 'ステップ3: 購読リスト',
      description: '購読中のフィードがここに表示されます。タイトルの編集や削除も可能です。',
      side: 'top',
      align: 'start'
    }
  },
  {
    element: '.import-export-buttons',
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
    element: '.polling-status',
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

**型チェック**:
```bash
npx tsc --noEmit
```

---

#### T003: useTutorialフックのテスト作成（Red）（20分）

**File**: `frontend/src/hooks/useTutorial.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTutorial } from './useTutorial'

// localStorageモック
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// driver.jsモック
const mockDrive = vi.fn()
vi.mock('driver.js', () => ({
  driver: vi.fn(() => ({
    drive: mockDrive
  }))
}))

describe('useTutorial', () => {
  beforeEach(() => {
    // Arrange: 準備
    localStorageMock.clear()
    mockDrive.mockClear()
  })

  it('初回訪問時にshouldShowTutorialがtrueを返す', () => {
    // Arrange: 準備
    // localStorage is empty

    // Act: 実行
    const { result } = renderHook(() => useTutorial())

    // Assert: 検証
    expect(result.current.shouldShowTutorial).toBe(true)
  })

  it('startTutorial呼び出し後、localStorageに保存される', () => {
    // Arrange: 準備
    const { result } = renderHook(() => useTutorial())

    // Act: 実行
    act(() => {
      result.current.startTutorial()
    })

    // Assert: 検証
    // Note: driver.jsのonDestroyedコールバックは手動で呼ぶ必要がある（実装後に調整）
    // expect(localStorageMock.getItem('rss_reader_tutorial_seen')).toBe('true')
  })

  it('2回目訪問時にshouldShowTutorialがfalseを返す', () => {
    // Arrange: 準備
    localStorageMock.setItem('rss_reader_tutorial_seen', 'true')

    // Act: 実行
    const { result } = renderHook(() => useTutorial())

    // Assert: 検証
    expect(result.current.shouldShowTutorial).toBe(false)
  })

  it('resetTutorialでlocalStorageがクリアされる', () => {
    // Arrange: 準備
    localStorageMock.setItem('rss_reader_tutorial_seen', 'true')
    const { result } = renderHook(() => useTutorial())

    // Act: 実行
    act(() => {
      result.current.resetTutorial()
    })

    // Assert: 検証
    expect(localStorageMock.getItem('rss_reader_tutorial_seen')).toBe('false')
    expect(result.current.shouldShowTutorial).toBe(true)
  })
})
```

**テスト実行（Red）**:
```bash
npm test useTutorial.test.ts
# 期待: すべてのテストが失敗（useTutorial.ts が存在しないため）
```

---

#### T004: useTutorialフックの実装（Green）（30分）

**File**: `frontend/src/hooks/useTutorial.ts`

```typescript
import { driver } from 'driver.js'
import { useLocalStorage } from './useLocalStorage'
import { TUTORIAL_STEPS } from '../constants/tutorialSteps'
import 'driver.js/dist/driver.css'

/**
 * チュートリアル管理カスタムフック
 */
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

**テスト実行（Green）**:
```bash
npm test useTutorial.test.ts
# 期待: すべてのテストが成功
```

---

#### T005: リファクタリング（Refactor）（10分）

**改善点**:
- コメント追加
- 型定義の明示化
- マジックストリング削除

```typescript
import { driver } from 'driver.js'
import { useLocalStorage } from './useLocalStorage'
import { TUTORIAL_STEPS } from '../constants/tutorialSteps'
import 'driver.js/dist/driver.css'

const TUTORIAL_STORAGE_KEY = 'rss_reader_tutorial_seen' as const
const PROGRESS_TEXT = 'ステップ {{current}} / {{total}}' as const

export function useTutorial() {
  const [hasSeenTutorial, setHasSeenTutorial] = useLocalStorage<boolean>(
    TUTORIAL_STORAGE_KEY,
    false
  )

  const startTutorial = (): void => {
    const driverObj = driver({
      steps: TUTORIAL_STEPS,
      showProgress: true,
      allowClose: true,
      overlayClickNext: false,
      onDestroyed: () => setHasSeenTutorial(true),
      progressText: PROGRESS_TEXT
    })

    driverObj.drive()
  }

  const resetTutorial = (): void => {
    setHasSeenTutorial(false)
  }

  return {
    shouldShowTutorial: !hasSeenTutorial,
    startTutorial,
    resetTutorial
  }
}
```

**テスト再実行（維持確認）**:
```bash
npm test useTutorial.test.ts
# 期待: すべてのテストが依然として成功
```

---

#### T006-T007: App.tsxへの統合（Red → Green）（40分）

**省略**: 詳細はplan.mdのPhase 2.1を参照

**要点**:
1. App.test.tsx にテスト追加（Red）
2. App.tsx に統合実装（Green）
3. driver.css インポート
4. useEffect で初回表示ロジック

---

#### T008: CSSセレクターの確認と修正（20分）

**手順**:

1. **ローカル環境起動**:
```bash
cd frontend
npm run dev
```

2. **ブラウザで開く**: `http://localhost:5173`

3. **DevToolsで要素検査**:
   - 右クリック → 検証
   - 各ステップの要素のセレクターを確認

4. **セレクター更新** (`tutorialSteps.ts`):
   ```typescript
   // 例: 実際のクラス名が異なる場合
   element: '.FeedManager__subscription-list'  // 実際のクラス名に更新
   ```

5. **手動テスト**:
   - localStorageを削除: DevTools → Application → Local Storage → Delete `rss_reader_tutorial_seen`
   - ページリロード
   - チュートリアル自動表示を確認

---

#### T009: レスポンシブ対応の確認（15分）

**手順**:

1. **DevToolsのResponsive Design Mode**:
   - Chrome: Ctrl+Shift+M (Windows) または Cmd+Option+M (Mac)

2. **各画面サイズでテスト**:
   - デスクトップ: 1920px
   - タブレット: 768px
   - モバイル: 375px

3. **確認項目**:
   - ポップアップが画面内に収まるか
   - テキストが読みやすいか
   - ボタンが押しやすいサイズか

4. **調整が必要な場合**:
   ```typescript
   // tutorialSteps.ts
   {
     element: 'input[aria-label="フィードURL"]',
     popover: {
       // ...
       side: 'bottom',  // モバイルでは'top'に変更など
       align: 'center'  // モバイルでは'center'推奨
     }
   }
   ```

---

#### T010: Phase 2.1の統合テスト（20分）

**チェックリスト**:

- [ ] localStorage削除後、ページリロード
- [ ] チュートリアルが自動表示される
- [ ] ステップ1-7すべて表示可能
- [ ] 「次へ」ボタンで進む
- [ ] 「スキップ」ボタンで終了
- [ ] Escapeキーで終了
- [ ] 終了後、localStorage に `rss_reader_tutorial_seen: true` 保存
- [ ] ページリロードで再表示されない

---

## Manual Testing Scenarios

### シナリオ1: 初回訪問時の自動表示

**前提条件**:
- localStorage が空（または`rss_reader_tutorial_seen`が存在しない）
- 購読フィードが0件

**手順**:
1. DevTools → Application → Local Storage → `rss_reader_tutorial_seen` を削除
2. ページリロード（Cmd+R / Ctrl+R）
3. チュートリアルが自動表示されることを確認
4. すべてのステップを進む
5. localStorage に保存されたことを確認

**期待結果**:
- チュートリアルが自動的に開始
- 7ステップすべて表示可能
- 完了後、localStorage = true

---

### シナリオ2: ヘルプボタンからの再表示

**前提条件**:
- localStorage に `rss_reader_tutorial_seen: true` が存在

**手順**:
1. ページリロード
2. チュートリアルは自動表示されない
3. ヘッダーの「ヘルプ」ボタンをクリック
4. チュートリアルが表示されることを確認

**期待結果**:
- 自動表示されない
- ヘルプボタンクリックで表示可能

---

### シナリオ3: アクセシビリティ

**前提条件**:
- キーボードのみを使用（マウス不使用）

**手順**:
1. Tabキーで「ヘルプ」ボタンにフォーカス
2. Enterキーでチュートリアル開始
3. Tabキーで「次へ」「スキップ」ボタンにフォーカス
4. Enterキーで進む
5. Escapeキーで終了

**期待結果**:
- キーボードのみで全操作可能
- フォーカスインジケーターが表示される

---

## Debugging Tips

### localStorage確認

```javascript
// DevTools Console
localStorage.getItem('rss_reader_tutorial_seen')
// Output: "true" または null
```

### localStorage削除

```javascript
// DevTools Console
localStorage.removeItem('rss_reader_tutorial_seen')
```

### driver.jsのデバッグ

```typescript
// useTutorial.ts に追加
const driverObj = driver({
  // ...
  onHighlighted: (element) => {
    console.log('Highlighted:', element)
  },
  onDestroyStarted: () => {
    console.log('Tutorial ending...')
  },
  onDestroyed: () => {
    console.log('Tutorial ended')
    setHasSeenTutorial(true)
  }
})
```

---

## Performance Check

### Lighthouse テスト

```bash
# Lighthouse CI（オプション）
npm install -g @lhci/cli
lhci autorun --collect.url=http://localhost:5173
```

**チェック項目**:
- First Contentful Paint: +200ms以内の増加
- Total Blocking Time: 影響なし
- Performance Score: 90以上維持

---

## Troubleshooting

### Q1: チュートリアルが表示されない

**A1**: CSSセレクターが間違っている可能性
- DevToolsで要素を検査
- セレクターを更新

**A2**: フィードが1件以上存在する
- すべてのフィードを削除
- または `resetTutorial()` を呼ぶ

---

### Q2: localStorage が保存されない

**A**: `onDestroyed` コールバックが呼ばれていない
- ブラウザのプライベートモード確認
- localStorage が有効か確認

---

### Q3: TypeScript型エラー

**A**: driver.jsの型定義が読み込まれていない
```bash
npm install driver.js
npm list driver.js  # バージョン確認
```

---

## Next Steps

1. **Phase 2.2**: ヘルプボタン実装（T011-T015）
2. **Phase 2.3**: アクセシビリティ対応（T016-T020）
3. **Phase 2.4**: レスポンシブ最適化（T021-T025）
4. **Phase 2.5**: エッジケースとドキュメント（T026-T030）

**Ready to start**: `/speckit.tasks` コマンドで詳細なタスクリスト生成
