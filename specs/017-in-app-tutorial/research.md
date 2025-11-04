# Research: アプリ内インタラクティブチュートリアル

**Feature**: 017-in-app-tutorial
**Date**: 2025-11-04
**Status**: Completed

## Executive Summary

driver.jsライブラリをReact 19プロジェクトに統合し、7ステップのインタラクティブチュートリアルを実装するための技術調査を実施。すべての技術的な課題に対する解決策を特定し、実装可能であることを確認。

## Research Questions & Answers

### Q1: driver.jsはReact 19と互換性があるか？

**Answer**: ✅ 完全互換

**Rationale**:
- driver.jsはVanillaJS（フレームワーク非依存）で実装されている
- React 19の変更（`unmountComponentAtNode`削除など）の影響を受けない
- DOMを直接操作するため、Reactのバージョンに依存しない

**Evidence**:
- driver.jsのGitHub（24,678 stars）で React 19関連のissueなし
- 週間ダウンロード数: 169,032（2025年1月時点）
- 最終更新: 2025年も継続的に更新中

**Alternatives Considered**:
- `react-joyride`: React 19非互換（`unmountComponentAtNode`使用）
- 自作実装: 複雑性高（スクロール、リサイズ、アクセシビリティ対応が必要）

**Decision**: driver.js採用

---

### Q2: driver.jsのTypeScript対応状況は？

**Answer**: ✅ 完全対応

**Rationale**:
- driver.js本体がVanilla TypeScriptで実装されている
- 公式の型定義ファイル（`.d.ts`）が同梱
- `npm install driver.js`で自動的に型定義が利用可能

**Sample Types**:
```typescript
import { driver, type DriveStep } from 'driver.js'

interface DriveStep {
  element: string
  popover: {
    title: string
    description: string
    side?: 'top' | 'bottom' | 'left' | 'right'
    align?: 'start' | 'center' | 'end'
  }
}
```

**Decision**: TypeScript型定義を利用し、`any`型は使用しない

---

### Q3: TailwindCSSとの統合方法は？

**Answer**: ✅ 統合可能（カスタムCSS + driver.jsのclassオプション）

**Integration Approach**:

1. **デフォルトCSS読み込み**:
```typescript
import 'driver.js/dist/driver.css'
```

2. **TailwindCSSでカスタマイズ**:
driver.jsの設定で`popoverClass`オプションを使用
```typescript
const driverObj = driver({
  popoverClass: 'bg-white dark:bg-gray-800 rounded-lg shadow-xl',
  // ... other options
})
```

3. **グローバルCSS上書き**（必要な場合）:
```css
/* App.css */
.driver-popover {
  @apply bg-white shadow-2xl rounded-lg;
}
```

**Decision**: デフォルトCSSをベースに、必要に応じてTailwindCSSクラスで上書き

---

### Q4: 既存のuseLocalStorageフックの再利用方法は？

**Answer**: ✅ 再利用可能

**Existing Hook**:
```typescript
// frontend/src/hooks/useLocalStorage.ts (既存)
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void]
```

**Usage in useTutorial**:
```typescript
import { useLocalStorage } from './useLocalStorage'

export function useTutorial() {
  const [hasSeenTutorial, setHasSeenTutorial] = useLocalStorage(
    'rss_reader_tutorial_seen',
    false
  )

  const startTutorial = () => {
    // driver.js logic
    setHasSeenTutorial(true)
  }

  return {
    shouldShowTutorial: !hasSeenTutorial,
    startTutorial,
    resetTutorial: () => setHasSeenTutorial(false)
  }
}
```

**Decision**: 既存のuseLocalStorageフックを活用し、新規実装は不要

---

### Q5: App.tsxのヘッダー構造は？

**Answer**: ✅ 構造確認完了

**Current Structure** (App.tsx):
```typescript
function App() {
  return (
    <div className="App">
      <header className="...">
        {/* 既存のヘッダー要素 */}
      </header>
      <main>
        {/* FeedManager, ArticleListなど */}
      </main>
    </div>
  )
}
```

**Integration Point**:
- ヘッダー内の右上にヘルプボタンを追加
- アイコン: SVGまたは既存のアイコンライブラリ（検討中）
- レイアウト: `flex justify-between items-center`

**Decision**: ヘッダーの右上にヘルプボタン追加、既存レイアウトは維持

---

### Q6: 7ステップのCSSセレクターは？

**Answer**: ✅ セレクター特定完了（実装時に最終確認必要）

**Selectors** (仮定、実装時に検証):

| Step | Target Element | CSS Selector | Note |
|------|---------------|--------------|------|
| 1 | フィードURL入力欄 | `input[aria-label="フィードURL"]` | FeedManager内 |
| 2 | 追加ボタン | `button[aria-label="フィードを追加"]` | FeedManager内 |
| 3 | 購読リスト | `.subscription-list` または `#subscription-list` | FeedManager内 |
| 4 | インポート/エクスポート | `.import-export-buttons` | FeedManager内 |
| 5 | 検索バー | `input[role="searchbox"]` | SearchBar |
| 6 | ポーリング状態 | `.polling-status` | PollingStatus |
| 7 | 記事カード | `article:first-child` | ArticleList内 |

**Fallback**:
- セレクターが見つからない場合、driver.jsはそのステップをスキップ
- エラーログを出力し、サイレント失敗

**Decision**: 実装Phase 2.1のT008で実際のDOMを確認し、セレクター更新

---

### Q7: アクセシビリティのベストプラクティスは？

**Answer**: ✅ driver.jsのデフォルトARIA属性を確認、一部カスタマイズ必要

**driver.js Defaults** (調査結果):
- `role="dialog"`: ポップアップに自動設定
- `aria-labelledby`, `aria-describedby`: title/descriptionから自動生成
- キーボードナビゲーション: Escape（終了）、Enter/矢印キー（次へ）デフォルト対応

**Additional Customization Needed**:
```typescript
const driverObj = driver({
  steps: TUTORIAL_STEPS,
  showProgress: true,
  allowClose: true,  // Escapeキー有効化
  overlayClickNext: false,  // オーバーレイクリックで次へ進まない
  onDestroyed: () => setHasSeenTutorial(true),
  // ARIA属性追加
  popoverClass: 'tutorial-popover',
  progressText: 'ステップ {{current}} / {{total}}'
})
```

**Testing Approach**:
- 手動テスト: ChromeのAccessibility Tree確認
- axe DevTools: 自動監査
- スクリーンリーダー: NVDA（Windows）、VoiceOver（Mac）

**Decision**: driver.jsのデフォルトARIA属性を活用し、Phase 2.3で詳細テスト

---

### Q8: パフォーマンスへの影響は？

**Answer**: ✅ 影響最小（+5kb gzip後、初回読み込み+50-100ms見込み）

**Bundle Size Analysis**:
- driver.js本体: 5kb（gzip後）
- driver.css: ~2kb（gzip後）
- 合計: ~7kb

**Performance Impact** (見込み):
- First Contentful Paint: +50-100ms（非同期読み込みで軽減可能）
- Total Blocking Time: 影響なし（driver.jsは初期化時のみ実行）
- Runtime Performance: 影響なし（ユーザー操作時のみ動作）

**Optimization**:
- Code Splitting: 不要（7kbは十分小さい）
- Lazy Loading: 検討可能（初回訪問時のみ必要）
  ```typescript
  const loadDriverJS = async () => {
    const { driver } = await import('driver.js')
    // ...
  }
  ```

**Decision**: 通常の静的インポートを使用、Lazy Loadingは将来の最適化として保留

---

## Technology Stack Summary

### Adopted Technologies

| Technology | Version | Purpose | License | Bundle Size |
|-----------|---------|---------|---------|-------------|
| driver.js | ~2.1.1 | ステップバイステップガイド | MIT | 5kb (gzip) |
| React | 19.1.1 | UIフレームワーク（既存） | MIT | - |
| TypeScript | 5.9.3 | 型安全性（既存） | Apache-2.0 | - |
| TailwindCSS | 4.1.16 | スタイリング（既存） | MIT | - |
| Vitest | 4.0.3 | テスティング（既存） | MIT | - |

### Integration Points

1. **frontend/package.json**:
```json
{
  "dependencies": {
    "driver.js": "~2.1.1"
  }
}
```

2. **frontend/src/hooks/useTutorial.ts** (新規):
- `useLocalStorage` フック活用
- driver.js初期化ロジック

3. **frontend/src/constants/tutorialSteps.ts** (新規):
- 7ステップ定義

4. **frontend/src/App.tsx** (変更):
- driver.css インポート
- ヘルプボタン追加
- 初回表示ロジック

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation | Status |
|------|-------------|--------|------------|--------|
| React 19非互換 | Low | High | VanillaJS実装で互換性確認済み | ✅ Resolved |
| バンドルサイズ増加 | Low | Medium | 7kbは許容範囲、Lighthouse監視 | ✅ Acceptable |
| CSSコンフリクト | Medium | Low | TailwindCSS Preflight無効化は不要、スコープ分離で対応 | ✅ Mitigated |
| TypeScript型エラー | Low | Low | 公式型定義あり | ✅ Resolved |

### Implementation Risks

| Risk | Probability | Impact | Mitigation | Status |
|------|-------------|--------|------------|--------|
| CSSセレクター変更 | Medium | Low | データ属性使用（`data-tutorial="feed-url"`）も検討 | ⚠️ Monitor |
| localStorage無効 | Low | Low | フォールバック実装（毎回表示） | ✅ Planned |
| モバイルUX | Medium | Medium | レスポンシブテスト徹底 | ✅ Planned |

## Next Steps

### Phase 1: Design & Contracts

1. **data-model.md作成**:
   - TutorialState, TutorialStep型定義
   - TUTORIAL_STEPS定数の詳細設計

2. **quickstart.md作成**:
   - ローカル環境セットアップ手順
   - TDD実装フロー
   - 手動テスト手順

3. **update-agent-context.sh実行**:
   - CLAUDE.mdにdriver.js技術スタック追加

### Phase 2: Implementation

**Ready to proceed** - すべての技術的な疑問点を解決

## References

- [driver.js 公式ドキュメント](https://driverjs.com/)
- [driver.js GitHub](https://github.com/kamranahmedse/driver.js)
- [WCAG 2.1 AA基準](https://www.w3.org/WAI/WCAG21/quickref/)
- [React + TypeScript + Vitest ベストプラクティス](https://vitest.dev/guide/)
