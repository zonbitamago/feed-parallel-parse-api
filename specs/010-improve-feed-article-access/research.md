# Research: 購読フィード一覧の折りたたみ機能

**Created**: 2025-10-30
**Feature**: 010-improve-feed-article-access

## Phase 0: 技術調査と設計判断

このドキュメントは、実装前の技術調査結果と設計判断をまとめたものです。

---

## 1. localStorage統合パターン

### 調査結果

既存コードベースでは、localStorageの使用パターンが確立されています：

**既存のキー名パターン**:
- `rss_reader_subscriptions` - 購読情報
- プレフィックス: `rss_reader_`
- 機能別の単一キー構造

**既存の実装**:
- `/frontend/src/services/storage.ts` - 専用のヘルパー関数（`loadSubscriptions`, `saveSubscriptions`）
- `/frontend/src/hooks/useLocalStorage.ts` - 汎用カスタムフック

### Decision: 折りたたみ状態のlocalStorage統合

**選択**: 汎用フック `useLocalStorage<boolean>` を使用

**キー名**: `rss_reader_subscriptions_collapsed`

**Rationale**:
- 既存の命名規則に従う（`rss_reader_` プレフィックス）
- `useLocalStorage`は型安全で、状態管理とlocalStorageの同期を自動化
- 単純なboolean値なので、専用ヘルパー関数は不要
- テストカバレッジが既に100%

**Alternatives considered**:
1. **専用ヘルパー関数を作成** - 却下理由: boolean値1つのために冗長
2. **UIContextに統合してContextで永続化** - 却下理由: UIContextはUI状態のみで、永続化は別レイヤー
3. **既存のstorageDataに統合** - 却下理由: 購読データと表示設定は責務が異なる

---

## 2. 状態管理アーキテクチャ

### 調査結果

**既存のUIContext構造**:
```typescript
interface UIState {
  isRefreshing: boolean;
  showWelcomeScreen: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
}
```

- useReducerで管理
- 4つのアクションタイプ（SET_REFRESHING, SET_WELCOME_SCREEN, SHOW_TOAST, HIDE_TOAST）

### Decision: カスタムフックで独立管理

**選択**: 新規カスタムフック `useSubscriptionListCollapse` を作成

**実装方針**:
```typescript
export function useSubscriptionListCollapse() {
  const [isCollapsed, setIsCollapsed] = useLocalStorage('rss_reader_subscriptions_collapsed', true);

  const toggle = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, [setIsCollapsed]);

  const expand = useCallback(() => {
    setIsCollapsed(false);
  }, [setIsCollapsed]);

  const collapse = useCallback(() => {
    setIsCollapsed(true);
  }, [setIsCollapsed]);

  return {
    isCollapsed,
    toggle,
    expand,
    collapse,
  };
}
```

**Rationale**:
- UIContextは既にローディング・ウェルカム・トーストの3つの責務を持っており、折りたたみ状態を追加すると肥大化
- 折りたたみ状態は購読管理UIに特化した状態であり、グローバルなUI状態ではない
- カスタムフックで独立させることで、テスタビリティが向上
- 既存パターン（`useFeedTitleEdit`, `useFeedPreview`）との一貫性

**Alternatives considered**:
1. **UIContextに統合** - 却下理由: Contextの肥大化、単一責任原則違反
2. **FeedManager内部でuseStateのみ** - 却下理由: localStorageとの同期が手動になり、テストが複雑化
3. **useReducerで独立管理** - 却下理由: boolean1つの状態にReducerは過剰設計

---

## 3. コンポーネント設計

### 調査結果

**既存のFeedManager構造**:
- `/frontend/src/components/FeedManager/FeedManager.tsx` - メインコンポーネント
- Propsで外部依存を注入（`onAddFeed`, `onRemoveFeed`, `onUpdateCustomTitle`）
- 既存のカスタムフック使用（`useFeedTitleEdit`, `useFeedPreview`）

### Decision: FeedManagerを直接改修

**改修方針**:
1. **折りたたみトグルボタンの追加**:
   - 購読件数表示の横に配置
   - アイコン: ChevronUp/ChevronDown（TailwindCSSのSVG）
   - aria-expanded属性でアクセシビリティ対応

2. **条件付きレンダリング**:
   ```jsx
   {!isCollapsed && subscriptions.length > 0 && (
     <div className="space-y-2">
       {subscriptions.map(...)}
     </div>
   )}
   ```

3. **アニメーション**:
   - TailwindCSSの`transition-all duration-300`クラス
   - `max-height`の変化でスムーズな展開/折りたたみ
   - 新規依存なし（既存のTailwindCSS 4.xで実現）

**Rationale**:
- 新規コンポーネント作成は過剰設計（YAGNI原則）
- 既存のFeedManagerコンポーネント内で完結
- TailwindCSSの標準機能で十分なアニメーション品質

**Alternatives considered**:
1. **新規コンポーネント CollapsibleSection** - 却下理由: 1箇所でしか使わない抽象化は不要
2. **Framer Motionなどのアニメーションライブラリ** - 却下理由: 新規依存追加は憲法違反、TailwindCSSで十分
3. **CSS Modules** - 却下理由: プロジェクトはTailwindCSSを採用済み

---

## 4. アクセシビリティ対応

### Decision: WAI-ARIA準拠

**実装要件**:
1. **aria-expanded**: 折りたたみ状態を示す
   ```jsx
   <button aria-expanded={!isCollapsed}>
   ```

2. **aria-controls**: 制御対象の要素IDを指定
   ```jsx
   <button aria-controls="subscription-list">
   <div id="subscription-list">
   ```

3. **aria-label**: ボタンの目的を明示
   ```jsx
   <button aria-label={isCollapsed ? "購読フィードを表示" : "購読フィードを隠す"}>
   ```

4. **キーボード操作**:
   - Enterキー: 展開/折りたたみ
   - Spaceキー: 展開/折りたたみ
   - Tab: フォーカス移動

**Rationale**:
- スクリーンリーダー対応
- キーボードナビゲーション対応
- 既存コードベースのアクセシビリティパターンに準拠

---

## 5. テスト戦略

### Decision: TDDアプローチ + 3層テスト

#### Layer 1: Unit Tests（70%）

**テスト対象**: `useSubscriptionListCollapse.test.ts`
```typescript
describe('useSubscriptionListCollapse', () => {
  it('デフォルトで折りたたまれている', () => {
    const { result } = renderHook(() => useSubscriptionListCollapse());
    expect(result.current.isCollapsed).toBe(true);
  });

  it('toggle()で状態が切り替わる', () => {
    const { result } = renderHook(() => useSubscriptionListCollapse());
    act(() => result.current.toggle());
    expect(result.current.isCollapsed).toBe(false);
  });

  it('localStorageに状態を永続化する', () => {
    const { result } = renderHook(() => useSubscriptionListCollapse());
    act(() => result.current.toggle());
    const stored = localStorage.getItem('rss_reader_subscriptions_collapsed');
    expect(stored).toBe('false');
  });

  it('ページリロード後も状態を復元する', () => {
    localStorage.setItem('rss_reader_subscriptions_collapsed', 'false');
    const { result } = renderHook(() => useSubscriptionListCollapse());
    expect(result.current.isCollapsed).toBe(false);
  });
});
```

**テスト対象**: `FeedManager.test.tsx`（既存テストに追加）
```typescript
describe('FeedManager - 折りたたみ機能', () => {
  it('折りたたみボタンが表示される', () => {
    render(<FeedManager subscriptions={[mockSubscription]} />);
    expect(screen.getByRole('button', { name: /購読フィードを/ })).toBeInTheDocument();
  });

  it('折りたたまれた状態では購読一覧が非表示', () => {
    // localStorageをモック（折りたたみ状態）
    localStorage.setItem('rss_reader_subscriptions_collapsed', 'true');
    render(<FeedManager subscriptions={[mockSubscription]} />);
    expect(screen.queryByText(mockSubscription.title)).not.toBeInTheDocument();
  });

  it('展開ボタンをクリックすると購読一覧が表示される', async () => {
    render(<FeedManager subscriptions={[mockSubscription]} />);
    const button = screen.getByRole('button', { name: /購読フィードを表示/ });
    await userEvent.click(button);
    expect(screen.getByText(mockSubscription.title)).toBeInTheDocument();
  });

  it('aria-expanded属性が正しく設定される', () => {
    render(<FeedManager subscriptions={[mockSubscription]} />);
    const button = screen.getByRole('button', { name: /購読フィードを/ });
    expect(button).toHaveAttribute('aria-expanded', 'false'); // 折りたたみ時
  });
});
```

#### Layer 2: Integration Tests（20%）

**テスト対象**: `subscriptionCollapseFlow.test.tsx`（新規）
```typescript
describe('購読一覧の折りたたみフロー', () => {
  it('折りたたみ状態でもフィード追加が可能', async () => {
    // 折りたたまれた状態でフィードを追加
    // フィード追加後も折りたたみ状態が維持されることを確認
  });

  it('展開状態でフィードを削除しても状態が維持される', async () => {
    // 展開状態でフィードを削除
    // 削除後も展開状態が維持されることを確認
  });

  it('購読数が0件の場合も折りたたみボタンが表示される', () => {
    // 購読0件でも折りたたみ機能が動作することを確認
  });
});
```

#### Layer 3: E2E Tests（10%）

**テスト対象**: 既存のE2Eテストに追加（オプション）
- ページリロード後の状態復元
- 複数セッション間での状態の独立性

**Rationale**:
- TDD憲法に準拠（テストファースト、Red-Green-Refactor）
- 既存のテストパターンに従う（Vitest + @testing-library/react）
- カバレッジ100%を目指す

---

## 6. パフォーマンス最適化

### Decision: React.memoとuseCallbackの活用

**実装方針**:
1. **useCallback**でイベントハンドラーをメモ化
   ```typescript
   const handleToggle = useCallback(() => {
     toggle();
   }, [toggle]);
   ```

2. **アニメーション**: CSS transitionのみ（JS不要）
   ```css
   .subscription-list {
     transition: max-height 0.3s ease-in-out;
     overflow: hidden;
   }
   ```

3. **条件付きレンダリング**: 折りたたみ時はDOMから削除（react-windowとの整合性）

**Rationale**:
- 不要な再レンダリングを防止
- 60fpsのスムーズなアニメーション（ブラウザのGPUアクセラレーション活用）
- メモリ効率（折りたたみ時にDOM要素を削除）

**Performance Goals**:
- 折りたたみ/展開: 300ms以内
- 購読数100件でも遅延なし

---

## 7. エッジケース対応

### 特定されたエッジケース

1. **購読数0件**:
   - Decision: 折りたたみボタンを表示（デフォルト状態を維持）
   - Rationale: 将来のフィード追加に備え、UXの一貫性を保つ

2. **折りたたみ中のフィード追加**:
   - Decision: 折りたたみ状態を維持
   - Rationale: ユーザーの意図を尊重

3. **展開中のフィード削除（全削除）**:
   - Decision: 展開状態を維持
   - Rationale: 状態変更はユーザーの明示的な操作のみ

4. **localStorage無効環境**:
   - Decision: useLocalStorageがエラーハンドリング済み（デフォルト値にフォールバック）
   - Rationale: 既存の実装パターンを活用

---

## 8. 実装順序（TDDサイクル）

### Phase 1: カスタムフック実装

1. **Red**: `useSubscriptionListCollapse.test.ts` を作成（失敗するテスト）
2. **Green**: `useSubscriptionListCollapse.ts` を実装（テストを通す）
3. **Refactor**: コードの品質向上

### Phase 2: FeedManager改修

1. **Red**: `FeedManager.test.tsx` に折りたたみテストを追加
2. **Green**: FeedManagerに折りたたみUIを実装
3. **Refactor**: コンポーネントの最適化

### Phase 3: 統合テスト

1. **Red**: `subscriptionCollapseFlow.test.tsx` を作成
2. **Green**: エッジケースの修正
3. **Refactor**: 全体の最適化

---

## 9. 設計トレードオフ

| 選択肢 | メリット | デメリット | 選択 |
|--------|---------|-----------|------|
| UIContextに統合 | グローバルアクセス | Context肥大化、再レンダリング増加 | ❌ |
| カスタムフック独立 | テスタビリティ高、疎結合 | フック数増加 | ✅ |
| 新規コンポーネント | 再利用性 | 過剰設計（1箇所でのみ使用） | ❌ |
| FeedManager改修 | シンプル、既存パターン踏襲 | コンポーネントサイズ増加 | ✅ |
| Framer Motion | 高品質アニメーション | 新規依存、バンドルサイズ増 | ❌ |
| TailwindCSS | 既存ツール、軽量 | アニメーション制約あり | ✅ |

---

## 10. リスク評価

| リスク | 影響度 | 対策 |
|-------|-------|------|
| localStorage容量超過 | 低 | boolean1つは数バイト、問題なし |
| アニメーション性能 | 低 | CSS transitionのみ、GPU活用 |
| アクセシビリティ不足 | 中 | WAI-ARIA準拠、テストで検証 |
| テストカバレッジ不足 | 高 | TDD厳守、100%カバレッジ目標 |
| 既存機能への影響 | 低 | 条件付きレンダリングで分離 |

---

## 11. 成功基準の技術的解釈

仕様書の成功基準を技術的に実装するための指標：

| 成功基準 | 技術的実装 | 測定方法 |
|---------|-----------|---------|
| SC-001: 記事がファーストビューに表示 | デフォルト折りたたみ（isCollapsed=true） | 目視確認 + Cypressスクリーンショット |
| SC-002: 切り替えが1秒以内 | transition: 300ms | Performance API計測 |
| SC-003: 60%アクセス時間短縮 | スクロール削減 | ユーザーテスト（定性的） |
| SC-004: 90%直感的理解 | アイコン + aria-label | ユーザビリティテスト |
| SC-005: クリック数2回以下 | 記事 = 1クリック、折りたたみ = 0-1クリック | フロー計測 |

---

## まとめ

すべての技術的不確定要素が解決され、実装準備が整いました。

**主要な設計判断**:
1. `useLocalStorage` + カスタムフック `useSubscriptionListCollapse`
2. FeedManagerを直接改修（新規コンポーネント不要）
3. TailwindCSSのみでアニメーション実装
4. WAI-ARIA完全準拠
5. TDD厳守（Red-Green-Refactor）

**次のステップ**: Phase 1（data-model.md, quickstart.md作成）
