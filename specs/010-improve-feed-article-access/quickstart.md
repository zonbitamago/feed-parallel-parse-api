# Quickstart: 購読フィード一覧の折りたたみ機能

**Created**: 2025-10-30
**Feature**: 010-improve-feed-article-access

## 概要

このガイドは、開発者が折りたたみ機能を理解し、実装・テスト・デバッグするための実践的な手順を提供します。

---

## 前提条件

- Node.js 18+ インストール済み
- プロジェクトのクローン済み
- 依存関係インストール済み（`npm install`）

---

## 1. ローカル開発環境のセットアップ

### 1.1 フロントエンドの起動

```bash
cd frontend
npm run dev
```

**アクセス**: http://localhost:5173

### 1.2 テスト環境の確認

```bash
cd frontend
npm run test
```

**期待される出力**:
```
✓ All tests passing
✓ Coverage: XX%
```

---

## 2. 機能の動作確認

### 2.1 手動テスト手順

#### Step 1: 初期状態の確認

1. ブラウザで http://localhost:5173 を開く
2. RSSフィードを5件程度追加
3. **期待される動作**:
   - 購読一覧がデフォルトで折りたたまれている
   - 購読件数（「購読中: 5件」など）が表示されている
   - 記事一覧がファーストビューに表示されている

#### Step 2: 展開・折りたたみの確認

1. 「▼ 購読フィードを表示」ボタンをクリック
2. **期待される動作**:
   - 購読一覧がスムーズに展開される（300ms以内）
   - ボタンが「▲ 購読フィードを隠す」に変わる
   - 購読フィードのリストが表示される

3. 「▲ 購読フィードを隠す」ボタンをクリック
4. **期待される動作**:
   - 購読一覧がスムーズに折りたたまれる
   - ボタンが「▼ 購読フィードを表示」に戻る

#### Step 3: 永続化の確認

1. 購読一覧を展開した状態でページをリロード（F5）
2. **期待される動作**:
   - 展開状態が維持されている

3. 購読一覧を折りたたんだ状態でページをリロード
4. **期待される動作**:
   - 折りたたみ状態が維持されている

#### Step 4: アクセシビリティの確認

1. キーボードでTabキーを押してトグルボタンにフォーカス
2. Enterキーで展開/折りたたみ
3. **期待される動作**:
   - キーボード操作で正常に動作する
   - aria-expanded属性が正しく切り替わる

### 2.2 localStorageの確認

**開発者ツールで確認**:

1. ブラウザの開発者ツールを開く（F12）
2. `Application` タブ → `Local Storage` → `http://localhost:5173`
3. キー `rss_reader_subscriptions_collapsed` を確認

**期待される値**:
- `"true"` - 折りたたまれている
- `"false"` - 展開されている

**手動編集でテスト**:
```javascript
// コンソールで実行
localStorage.setItem('rss_reader_subscriptions_collapsed', 'false');
location.reload(); // ページをリロード
// → 展開状態になるはず
```

---

## 3. コードの理解

### 3.1 主要ファイル

| ファイルパス | 役割 |
|-------------|------|
| `/frontend/src/hooks/useSubscriptionListCollapse.ts` | 折りたたみロジックのカスタムフック |
| `/frontend/src/components/FeedManager/FeedManager.tsx` | UI実装（トグルボタン、条件付きレンダリング） |
| `/frontend/src/hooks/useLocalStorage.ts` | localStorage連携の汎用フック |

### 3.2 実装の流れ

```
useLocalStorage
    ↓
useSubscriptionListCollapse（カスタムフック）
    ↓
FeedManager（コンポーネント）
    ↓
UI（トグルボタン + 条件付きレンダリング）
```

### 3.3 コードスニペット

#### useSubscriptionListCollapse.ts

```typescript
export function useSubscriptionListCollapse() {
  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    'rss_reader_subscriptions_collapsed',
    true // デフォルトで折りたたみ
  );

  const toggle = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, [setIsCollapsed]);

  const expand = useCallback(() => {
    setIsCollapsed(false);
  }, [setIsCollapsed]);

  const collapse = useCallback(() => {
    setIsCollapsed(true);
  }, [setIsCollapsed]);

  return { isCollapsed, toggle, expand, collapse };
}
```

#### FeedManager.tsx（抜粋）

```tsx
export function FeedManager({ subscriptions, ... }: FeedManagerProps) {
  const { isCollapsed, toggle } = useSubscriptionListCollapse();

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      {/* フィード追加フォーム */}
      <form onSubmit={handleSubmit}>...</form>

      {/* 購読件数 + トグルボタン */}
      {subscriptions.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            購読中: {subscriptions.length}/100件
          </p>
          <button
            onClick={toggle}
            aria-expanded={!isCollapsed}
            aria-controls="subscription-list"
            aria-label={isCollapsed ? "購読フィードを表示" : "購読フィードを隠す"}
          >
            {isCollapsed ? "▼ 購読フィードを表示" : "▲ 購読フィードを隠す"}
          </button>
        </div>
      )}

      {/* 条件付きレンダリング */}
      {!isCollapsed && subscriptions.length > 0 && (
        <div id="subscription-list" className="mt-4 space-y-2">
          {subscriptions.map(subscription => (
            <FeedSubscriptionItem key={subscription.id} {...} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 4. テストの実行

### 4.1 Unit Tests

```bash
# 全テスト実行
npm run test

# 特定のファイルのみ
npm run test useSubscriptionListCollapse.test.ts

# ウォッチモード
npm run test:watch
```

**カバレッジ確認**:
```bash
npm run test -- --coverage
```

**期待される結果**:
```
File                                | % Stmts | % Branch | % Funcs | % Lines
------------------------------------|---------|----------|---------|--------
useSubscriptionListCollapse.ts      | 100     | 100      | 100     | 100
FeedManager.tsx                     | 100     | 100      | 100     | 100
```

### 4.2 Integration Tests

```bash
npm run test subscriptionCollapseFlow.test.tsx
```

### 4.3 手動E2Eテスト

1. 複数のブラウザでテスト（Chrome, Firefox, Safari）
2. モバイルビューポートでテスト（開発者ツール）
3. localStorageを無効化してテスト（プライベートブラウジング）

---

## 5. デバッグガイド

### 5.1 よくある問題

#### 問題1: 状態が保存されない

**症状**: ページリロード後に状態がリセットされる

**原因**:
- localStorage無効（プライベートブラウジング）
- setItem失敗（容量超過）

**確認方法**:
```javascript
// コンソールで確認
console.log(localStorage.getItem('rss_reader_subscriptions_collapsed'));
```

**解決策**:
- 通常のブラウジングモードで確認
- localStorageをクリアして再試行

#### 問題2: アニメーションがカクつく

**症状**: 展開/折りたたみがスムーズでない

**原因**:
- CSS transitionの設定ミス
- 重い再レンダリング

**確認方法**:
```javascript
// パフォーマンス計測
console.time('toggle');
toggle();
console.timeEnd('toggle'); // 300ms以内が目標
```

**解決策**:
- `will-change: max-height` を追加
- React.memoで不要な再レンダリング防止

#### 問題3: aria-expanded属性が更新されない

**症状**: スクリーンリーダーで状態が正しく読み上げられない

**確認方法**:
```javascript
// コンソールで確認
document.querySelector('[aria-expanded]').getAttribute('aria-expanded');
```

**解決策**:
- `aria-expanded={!isCollapsed}` が正しく設定されているか確認
- 条件分岐ロジックをチェック

### 5.2 デバッグツール

#### React Developer Tools

1. インストール: Chrome/Firefox拡張機能
2. `Components` タブで FeedManager を選択
3. Hooks セクションで `isCollapsed` の値を確認

#### localStorage Inspector

```javascript
// すべてのキーを確認
Object.keys(localStorage).forEach(key => {
  console.log(key, localStorage.getItem(key));
});

// 折りたたみ状態のみ確認
console.log('Collapsed:', localStorage.getItem('rss_reader_subscriptions_collapsed'));
```

---

## 6. よくある使用パターン

### 6.1 プログラムで状態を変更

```typescript
// FeedManagerコンポーネント内
const { expand, collapse } = useSubscriptionListCollapse();

// 特定のイベントで展開
useEffect(() => {
  if (subscriptions.length === 1) {
    expand(); // 初めてのフィード追加時は自動展開
  }
}, [subscriptions.length, expand]);
```

### 6.2 複数の折りたたみセクションを管理（将来の拡張）

```typescript
// 現在は1つのセクションのみ
const subscriptionCollapse = useSubscriptionListCollapse();
const filterCollapse = useSubscriptionListCollapse(); // 別のキーを使用

// 将来的にはuseCollapsibleGroupを実装可能
```

---

## 7. パフォーマンスチェック

### 7.1 レンダリングパフォーマンス

```typescript
// React DevTools Profilerで計測
// 期待値: トグル時の再レンダリング < 16ms（60fps維持）
```

### 7.2 アニメーション性能

```css
/* 期待される動作 */
.subscription-list {
  transition: max-height 0.3s ease-in-out;
  /* GPU アクセラレーション有効化 */
  will-change: max-height;
}
```

---

## 8. トラブルシューティングチェックリスト

- [ ] `npm install` は実行済みか？
- [ ] `npm run dev` は正常に起動したか？
- [ ] ブラウザのコンソールにエラーは表示されていないか？
- [ ] localStorageは有効か？（プライベートブラウジングではないか？）
- [ ] キー名は正しいか？（`rss_reader_subscriptions_collapsed`）
- [ ] TypeScriptの型エラーはないか？（`npm run build`）
- [ ] テストは全てパスしているか？（`npm run test`）
- [ ] ESLintの警告はないか？（`npm run lint`）

---

## 9. 次のステップ

### 開発者向け

1. **TDD実践**: テストファーストで実装
2. **コミット戦略**: Red→Green→Refactorの各フェーズでコミット
3. **コードレビュー**: 憲法チェックリストを確認

### テスター向け

1. **手動テスト**: 上記の手動テスト手順を実行
2. **アクセシビリティテスト**: スクリーンリーダー、キーボードナビゲーション
3. **ブラウザ互換性テスト**: Chrome, Firefox, Safari, Edge

### ユーザー向け

1. **フィードバック収集**: 折りたたみ機能の使いやすさ
2. **パフォーマンス体感**: 記事へのアクセス時間の改善
3. **バグレポート**: 予期しない動作の報告

---

## 10. リファレンス

| リンク | 説明 |
|--------|------|
| [spec.md](./spec.md) | 機能仕様書 |
| [plan.md](./plan.md) | 実装計画 |
| [research.md](./research.md) | 技術調査 |
| [data-model.md](./data-model.md) | データモデル |
| [CLAUDE.md](../../CLAUDE.md) | プロジェクトガイドライン |
| [constitution.md](../../.specify/memory/constitution.md) | 開発憲法 |

---

## まとめ

この機能は、既存のパターンに従ったシンプルな実装です：

- **カスタムフック**: `useSubscriptionListCollapse`で状態管理
- **localStorage**: 自動永続化
- **TailwindCSS**: アニメーション
- **WAI-ARIA**: アクセシビリティ
- **TDD**: テストファースト

開発時は憲法を遵守し、テストカバレッジ100%を目指してください。

**質問・問題があれば**: プロジェクトのissueトラッカーに報告してください。
