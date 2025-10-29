# Research: 購読フィード識別表示の改善

**Feature**: 008-feed-url-display
**Date**: 2025-10-29
**Status**: Completed

## Research Summary

この機能の実装に必要な技術調査を実施しました。既存のコードベースを分析し、実装方針を決定しました。

## Research Task 1: 既存のフィード取得処理の調査

### 調査結果

**現在のフィードタイトル取得フロー**:

1. **API応答** (`types/api.ts`):
   ```typescript
   interface RSSFeed {
     title: string;  // ← フィードタイトルはAPIから取得される
     link: string;
     articles: APIArticle[];
   }
   ```

2. **データ変換** (`hooks/useFeedAPI.ts:43`):
   ```typescript
   feedTitle: feed.title  // APIから取得したタイトルを記事に付与
   ```

3. **現在の問題点**:
   - **フィードタイトルはAPIから取得されているが、Subscriptionモデルに保存されていない**
   - Subscription型には`title: string | null`フィールドがあるが、常に`null`のまま
   - FeedContainerの`handleAddFeed`で`title: null`として初期化される（73行目）
   - **結果**: FeedManagerは`subscription.title || subscription.url`を表示するが、titleが常にnullなのでURLのみが表示される

### 決定事項

**アプローチ**: フィード取得時にAPIから取得したタイトルをSubscriptionモデルに保存する

**実装方針**:
1. `useFeedAPI.ts`でフィード取得時に、各SubscriptionのtitleをAPIレスポンスから更新
2. `FeedContainer.tsx`でSubscriptionの更新をContextとlocalStorageに反映
3. `customTitle`フィールドを新規追加し、ユーザー編集を別管理

**代替案として検討したが却下**:
- 記事から逆引きでタイトルを取得: 記事がない場合に対応できない
- API呼び出しごとに再取得: 不要なAPI負荷

## Research Task 2: localStorage容量管理のベストプラクティス

### 調査結果

**現在のストレージ使用状況**:
- 1つのSubscription: 約150-200バイト（JSON文字列）
  ```json
  {
    "id": "uuid-36文字",
    "url": "https://example.com/feed (~50文字)",
    "title": null,
    "subscribedAt": "ISO日付",
    "lastFetchedAt": "ISO日付",
    "status": "active"
  }
  ```

**容量見積もり**:
- 現在の実装: 100件 × 200バイト = 20KB
- customTitle追加後: 100件 × (200 + 100)バイト = 30KB
- フィードタイトル平均: 50-100文字（日本語で150-300バイト）
- 最大想定: 100件 × 500バイト = 50KB

**localStorage制限**:
- ほとんどのブラウザ: 5-10MB
- 使用予定: 最大50KB（制限の0.5-1%）

### 決定事項

**結論**: localStorage容量は問題なし

**理由**:
- 最大100件の制限が既に存在（`FeedManager.tsx:15`）
- 予想される最大使用量は50KB未満で、localStorage制限の1%未満
- エラーハンドリングは既存のstorage.tsに実装済み

**モニタリング**（オプション）:
```typescript
// 将来的な拡張として
function getStorageSize(): number {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? new Blob([data]).size : 0;
}
```

## Research Task 3: React編集可能コンポーネントのパターン

### 調査結果

**検討した実装パターン**:

1. **インライン編集パターン（選択）**:
   - 通常時: テキスト表示 + 編集ボタン
   - 編集時: inputフィールド + 保存/キャンセルボタン
   - 状態管理: ローカルstate（useState）

2. **モーダル編集パターン（却下）**:
   - 理由: 100件の購読がある場合、各フィードごとのインライン編集の方が効率的

3. **contentEditable パターン（却下）**:
   - 理由: アクセシビリティとバリデーションが複雑

### 決定事項

**選択したパターン**: Controlled Component + 編集モード切り替え

**実装詳細**:
```typescript
function FeedEditableTitle({ subscription, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const displayTitle = subscription.customTitle || subscription.title || subscription.url;

  const handleEdit = () => {
    setEditValue(displayTitle);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editValue.trim()) {
      onSave(subscription.id, editValue.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // 実装...
}
```

**キーボード操作**:
- Enter: 保存
- Escape: キャンセル
- Tab: フォーカス移動

**アクセシビリティ**:
- `aria-label` で編集ボタンの目的を明示
- `role="textbox"` で編集可能領域を示す

## Research Task 4: HTMLエスケープとサニタイゼーション

### 調査結果

**RSSフィードタイトルに含まれる可能性のあるHTML**:
- HTMLタグ: `<b>`, `<i>`, `<span>`等
- HTMLエンティティ: `&amp;`, `&lt;`, `&quot;`等
- CDATA: `<![CDATA[...]]>`

**既存の処理**:
- Reactは自動的にHTMLエスケープを行う（XSS対策）
- APIから取得した文字列をそのまま表示しても安全
- ただし、HTMLエンティティはデコードが必要

### 決定事項

**アプローチ**: ブラウザ標準APIを使用したHTMLデコード

**実装**:
```typescript
// titleUtils.ts
export function decodeHTMLEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export function stripHTMLTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

export function sanitizeFeedTitle(title: string): string {
  // 1. HTMLタグを除去
  let cleaned = stripHTMLTags(title);
  // 2. HTMLエンティティをデコード
  cleaned = decodeHTMLEntities(cleaned);
  // 3. 前後の空白を削除
  return cleaned.trim();
}
```

**代替案として検討したが却下**:
- DOMParser API: textareaの方がシンプル
- 外部ライブラリ（he, entities等）: 依存関係を増やしたくない
- 正規表現のみ: エンティティの完全な処理が困難

**テストケース**:
```typescript
// titleUtils.test.ts
test('HTMLエンティティをデコード', () => {
  expect(decodeHTMLEntities('Tech &amp; Design')).toBe('Tech & Design');
  expect(decodeHTMLEntities('&lt;React&gt;')).toBe('<React>');
});

test('HTMLタグを除去', () => {
  expect(stripHTMLTags('<b>Bold</b> Text')).toBe('Bold Text');
});

test('複合的なサニタイゼーション', () => {
  const input = '<span>News &amp; Updates</span>';
  expect(sanitizeFeedTitle(input)).toBe('News & Updates');
});
```

## Additional Research: タイトル表示の優先順位

### 決定事項

**表示ロジック**（優先順位順）:
1. `customTitle` - ユーザーが設定したカスタム名
2. `title` - APIから自動取得したフィードタイトル
3. `url` - フォールバック

**ヘルパー関数**:
```typescript
// types/models.ts
export function getDisplayTitle(subscription: Subscription): string {
  if (subscription.customTitle) {
    return subscription.customTitle;
  }
  if (subscription.title) {
    return subscription.title;
  }
  return subscription.url;
}
```

**長いタイトルの切り詰め**:
```typescript
// titleUtils.ts
export function truncateTitle(title: string, maxLength: number = 100): string {
  if (title.length <= maxLength) {
    return title;
  }
  return title.slice(0, maxLength) + '...';
}
```

## Implementation Dependencies

### 必要な依存関係

既存の依存関係のみで実装可能:
- React 19.1.1 (useState, useCallback)
- TypeScript 5.9.3 (型定義)
- Vitest 4.0.3 (テスト)
- @testing-library/react 16.3.0 (コンポーネントテスト)

### 新規依存関係

**不要** - すべて既存のライブラリで実装可能

## Risks and Mitigations

### 識別されたリスク

1. **既存データとの互換性**
   - リスク: 既存のlocalStorageデータに`customTitle`フィールドがない
   - 対策: オプショナルフィールドとして定義、undefinedとnullを同等に扱う

2. **API変更のタイミング**
   - リスク: フィード取得時のタイトル更新がレンダリングを引き起こす
   - 対策: useEffectで適切に依存関係を管理、不要な再レンダリングを防ぐ

3. **長いタイトルのUI崩れ**
   - リスク: 100文字を超えるタイトルでレイアウトが崩れる
   - 対策: CSS `text-overflow: ellipsis` と `truncate()`関数の併用

## Next Steps

1. ✅ Phase 0 完了: 技術調査完了
2. 次: Phase 1 - data-model.mdとcontractsの作成
3. 次: `/speckit.tasks` - 実装タスクリストの生成

## Conclusion

すべての技術調査が完了し、実装に必要な情報が揃いました。既存のアーキテクチャを活用し、最小限の変更で機能を実装できることが確認されました。新規依存関係は不要で、後方互換性も保たれます。