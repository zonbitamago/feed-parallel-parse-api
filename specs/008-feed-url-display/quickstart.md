# Quickstart Guide: 購読フィード識別表示の改善

**Feature**: 008-feed-url-display
**Date**: 2025-10-29
**For**: Developers implementing this feature

## Overview

この機能では、RSSフィード購読リストにフィードタイトルを表示し、ユーザーがカスタム名を設定できるようにします。既存のコードベースを最小限の変更で拡張し、フロントエンドのみで完結します。

## Prerequisites

開始する前に、以下を確認してください：

- [ ] Node.js 18以上がインストールされている
- [ ] フロントエンドの依存関係がインストールされている（`npm install`）
- [ ] 開発サーバーが起動できる（`npm run dev`）
- [ ] テストが実行できる（`npm test`）
- [ ] 以下のドキュメントを読んだ：
  - [research.md](./research.md) - 技術調査結果
  - [data-model.md](./data-model.md) - データモデル設計
  - [contracts/README.md](./contracts/README.md) - API契約

## Quick Start（5分で理解）

### 1. 主な変更箇所

この機能で変更・追加するファイル：

```text
frontend/src/
├── types/
│   └── models.ts                 # Subscription型を拡張（customTitle追加）
├── utils/
│   ├── titleUtils.ts            # 🆕 タイトル処理ユーティリティ
│   └── titleUtils.test.ts       # 🆕 ユニットテスト
├── services/
│   └── storage.ts               # マイグレーション処理追加
├── hooks/
│   └── useFeedAPI.ts            # title更新ロジック追加
├── containers/
│   └── FeedContainer.tsx        # カスタムタイトル更新ハンドラー追加
└── components/
    └── FeedManager/
        ├── FeedManager.tsx       # 編集UI追加
        └── FeedManager.test.tsx  # テスト拡張

tests/integration/
└── feedTitleFlow.test.tsx       # 🆕 統合テスト
```

### 2. データモデルの変更

```typescript
// Before
interface Subscription {
  id: string;
  url: string;
  title: string | null;  // 常にnull
  // ...
}

// After
interface Subscription {
  id: string;
  url: string;
  title: string | null;          // APIから自動取得
  customTitle: string | null;    // 🆕 ユーザー設定
  // ...
}
```

### 3. 表示ロジック

```typescript
function getDisplayTitle(subscription: Subscription): string {
  return subscription.customTitle     // 1. ユーザー設定
      || subscription.title           // 2. 自動取得
      || subscription.url;            // 3. フォールバック
}
```

## Development Workflow

### Step 1: 環境セットアップ（5分）

```bash
# リポジトリのルートディレクトリで実行
cd frontend

# 依存関係の確認
npm install

# 開発サーバー起動
npm run dev

# 別のターミナルでテストを watch モードで起動
npm run test:watch
```

ブラウザで http://localhost:5173 を開き、アプリケーションが起動することを確認。

### Step 2: 型定義の拡張（10分）

**ファイル**: `frontend/src/types/models.ts`

1. Subscription型に`customTitle`フィールドを追加：

```typescript
export interface Subscription {
  id: string;
  url: string;
  title: string | null;
  customTitle: string | null;     // 🆕 この行を追加
  subscribedAt: string;
  lastFetchedAt: string | null;
  status: 'active' | 'error';
}
```

2. ヘルパー関数を追加（ファイル末尾）：

```typescript
export function getDisplayTitle(subscription: Subscription): string {
  if (subscription.customTitle) {
    return subscription.customTitle;
  }
  if (subscription.title) {
    return subscription.title;
  }
  return subscription.url;
}

export function hasCustomTitle(subscription: Subscription): boolean {
  return subscription.customTitle !== null && subscription.customTitle.trim().length > 0;
}

export function validateCustomTitle(title: string): { valid: boolean; error?: string } {
  const trimmed = title.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'フィード名を入力してください' };
  }

  if (trimmed.length > 200) {
    return { valid: false, error: 'フィード名は200文字以内にしてください' };
  }

  return { valid: true };
}
```

### Step 3: ユーティリティの実装（15分）

**新規ファイル**: `frontend/src/utils/titleUtils.ts`

```typescript
/**
 * タイトル処理ユーティリティ
 */

export function decodeHTMLEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export function stripHTMLTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

export function sanitizeFeedTitle(title: string): string {
  let cleaned = stripHTMLTags(title);
  cleaned = decodeHTMLEntities(cleaned);
  return cleaned.trim();
}

export function truncateTitle(title: string, maxLength: number = 100): string {
  if (title.length <= maxLength) {
    return title;
  }
  return title.slice(0, maxLength) + '...';
}
```

**テストファイル**: `frontend/src/utils/titleUtils.test.ts`

```typescript
import { describe, test, expect } from 'vitest';
import { decodeHTMLEntities, stripHTMLTags, sanitizeFeedTitle, truncateTitle } from './titleUtils';

describe('titleUtils', () => {
  describe('decodeHTMLEntities', () => {
    test('HTMLエンティティをデコード', () => {
      expect(decodeHTMLEntities('Tech &amp; Design')).toBe('Tech & Design');
      expect(decodeHTMLEntities('&lt;React&gt;')).toBe('<React>');
    });
  });

  describe('stripHTMLTags', () => {
    test('HTMLタグを除去', () => {
      expect(stripHTMLTags('<b>Bold</b> Text')).toBe('Bold Text');
      expect(stripHTMLTags('<span class="test">Content</span>')).toBe('Content');
    });
  });

  describe('sanitizeFeedTitle', () => {
    test('複合的なサニタイゼーション', () => {
      const input = '<span>News &amp; Updates</span>';
      expect(sanitizeFeedTitle(input)).toBe('News & Updates');
    });
  });

  describe('truncateTitle', () => {
    test('長いタイトルを切り詰め', () => {
      const longTitle = 'A'.repeat(150);
      expect(truncateTitle(longTitle, 100)).toBe('A'.repeat(100) + '...');
    });

    test('短いタイトルはそのまま', () => {
      expect(truncateTitle('Short Title', 100)).toBe('Short Title');
    });
  });
});
```

テストを実行して全てパスすることを確認：

```bash
npm test -- titleUtils.test.ts
```

### Step 4: Storage のマイグレーション（10分）

**ファイル**: `frontend/src/services/storage.ts`

`loadSubscriptions`関数を更新：

```typescript
export function loadSubscriptions(): Subscription[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const parsed: StorageData = JSON.parse(data);

    // 🆕 既存データのマイグレーション
    return (parsed.subscriptions || []).map(sub => ({
      ...sub,
      customTitle: sub.customTitle ?? null  // undefinedをnullに正規化
    }));
  } catch (error) {
    console.error('Failed to load subscriptions from localStorage:', error);
    return [];
  }
}
```

### Step 5: API レスポンスからタイトルを取得（15分）

**ファイル**: `frontend/src/hooks/useFeedAPI.ts`

`fetchFeeds`関数内で、Subscriptionのtitleを更新する処理を追加：

```typescript
// 30行目付近の subscriptions.forEach の中
subscriptions.forEach((subscription, subIndex) => {
  const feed = response.feeds.find(f => f.link === subscription.url) || response.feeds[subIndex]

  if (feed) {
    // 🆕 titleを更新（この後、FeedContainerで保存される）
    subscription.title = feed.title;

    feed.articles.forEach((apiArticle, articleIndex) => {
      // 既存のコード...
    })
  }
})
```

**注意**: この変更だけでは永続化されません。次のステップでFeedContainerを更新します。

### Step 6: FeedContainer の更新（20分）

**ファイル**: `frontend/src/containers/FeedContainer.tsx`

1. フィード取得後にSubscriptionを更新する処理を追加：

```typescript
// 🆕 フィード取得後にtitleを更新
useEffect(() => {
  if (articles.length > 0) {
    // titleが更新されたSubscriptionをContextとlocalStorageに反映
    const updatedSubs = subState.subscriptions.map(sub => {
      const matchingArticle = articles.find(a => a.feedId === sub.id);
      if (matchingArticle && matchingArticle.feedTitle && !sub.title) {
        return { ...sub, title: matchingArticle.feedTitle };
      }
      return sub;
    });

    // 更新があれば保存
    if (JSON.stringify(updatedSubs) !== JSON.stringify(subState.subscriptions)) {
      updatedSubs.forEach(sub => {
        subDispatch({ type: 'UPDATE_SUBSCRIPTION', payload: sub });
      });
      saveSubscriptions(updatedSubs);
    }

    articleDispatch({ type: 'SET_ARTICLES', payload: articles });
  }
}, [articles, articleDispatch, subState.subscriptions, subDispatch]);
```

2. カスタムタイトル更新ハンドラーを追加：

```typescript
// handleRemoveFeedの後に追加
const handleUpdateCustomTitle = (id: string, customTitle: string) => {
  const subscription = subState.subscriptions.find(sub => sub.id === id);
  if (!subscription) return;

  const updated = { ...subscription, customTitle };
  subDispatch({ type: 'UPDATE_SUBSCRIPTION', payload: updated });

  const allUpdated = subState.subscriptions.map(sub =>
    sub.id === id ? updated : sub
  );
  saveSubscriptions(allUpdated);
}
```

3. FeedManagerに新しいpropsを追加：

```typescript
return (
  <FeedManager
    onAddFeed={handleAddFeed}
    onRemoveFeed={handleRemoveFeed}
    onUpdateCustomTitle={handleUpdateCustomTitle}  // 🆕
    subscriptions={subState.subscriptions}
  />
)
```

### Step 7: FeedManager の編集UI追加（30分）

**ファイル**: `frontend/src/components/FeedManager/FeedManager.tsx`

1. Propsに`onUpdateCustomTitle`を追加：

```typescript
interface FeedManagerProps {
  onAddFeed: (url: string) => void
  onRemoveFeed?: (id: string) => void
  onUpdateCustomTitle?: (id: string, customTitle: string) => void  // 🆕
  subscriptions: Subscription[]
}
```

2. 編集状態の管理用stateを追加：

```typescript
import { useState, useEffect } from 'react'
import { getDisplayTitle, validateCustomTitle } from '../../types/models'  // 🆕

export function FeedManager({ onAddFeed, onRemoveFeed, onUpdateCustomTitle, subscriptions }: FeedManagerProps) {
  // 既存のstate...
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  // 🆕 編集状態の管理
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  // ... 既存のコード
```

3. 編集ハンドラーを追加：

```typescript
  const handleStartEdit = (subscription: Subscription) => {
    setEditingId(subscription.id)
    setEditValue(getDisplayTitle(subscription))
    setEditError(null)
  }

  const handleSaveEdit = (id: string) => {
    const validation = validateCustomTitle(editValue)
    if (!validation.valid) {
      setEditError(validation.error || null)
      return
    }

    if (onUpdateCustomTitle) {
      onUpdateCustomTitle(id, editValue.trim())
    }

    setEditingId(null)
    setEditValue('')
    setEditError(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditValue('')
    setEditError(null)
  }
```

4. 購読リストの表示部分を更新（100行目付近）：

```typescript
{subscriptions.map((subscription) => (
  <div
    key={subscription.id}
    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
  >
    <div className="flex-1 min-w-0">
      {editingId === subscription.id ? (
        // 🆕 編集モード
        <div>
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveEdit(subscription.id)
              } else if (e.key === 'Escape') {
                handleCancelEdit()
              }
            }}
            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="フィード名を編集"
            autoFocus
          />
          {editError && (
            <p className="text-xs text-red-600 mt-1">{editError}</p>
          )}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handleSaveEdit(subscription.id)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              保存
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        // 🆕 表示モード
        <>
          <p className="font-medium text-gray-900 truncate">
            {getDisplayTitle(subscription)}
          </p>
          <p className="text-sm text-gray-500 truncate">
            {subscription.url}
          </p>
          {subscription.status === 'error' && (
            <p className="text-xs text-red-600 mt-1">
              エラー: 取得に失敗しました
            </p>
          )}
          {subscription.status === 'active' && subscription.lastFetchedAt && (
            <p className="text-xs text-green-600 mt-1">
              最終取得: {new Date(subscription.lastFetchedAt).toLocaleString('ja-JP')}
            </p>
          )}
        </>
      )}
    </div>

    <div className="ml-3 flex gap-2">
      {editingId !== subscription.id && onUpdateCustomTitle && (
        <button
          onClick={() => handleStartEdit(subscription)}
          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
          aria-label="フィード名を編集"
        >
          編集
        </button>
      )}

      {onRemoveFeed && editingId !== subscription.id && (
        <button
          onClick={() => onRemoveFeed(subscription.id)}
          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
          aria-label="削除"
        >
          削除
        </button>
      )}
    </div>
  </div>
))}
```

### Step 8: 動作確認（10分）

1. 開発サーバーを起動：
```bash
npm run dev
```

2. ブラウザで動作確認：
   - [ ] 新しいフィードを追加すると、タイトルが表示される（URLではない）
   - [ ] 「編集」ボタンをクリックすると、編集モードになる
   - [ ] タイトルを変更して「保存」すると、変更が反映される
   - [ ] ページをリロードしても、カスタム名が保持される
   - [ ] 「キャンセル」すると、元のタイトルに戻る
   - [ ] 空文字で保存しようとすると、エラーが表示される

3. DevToolsでlocalStorageを確認：
```javascript
// Console で実行
JSON.parse(localStorage.getItem('rss_reader_subscriptions'))
```

`customTitle`フィールドが保存されていることを確認。

### Step 9: テストの追加（30分）

**ファイル**: `frontend/tests/integration/feedTitleFlow.test.tsx`

```typescript
import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';

describe('Feed Title Flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('フィード追加時にタイトルが表示される', async () => {
    render(<App />);

    const input = screen.getByPlaceholderText('RSSフィードのURLを入力...');
    const addButton = screen.getByRole('button', { name: '追加' });

    await userEvent.type(input, 'https://example.com/feed');
    await userEvent.click(addButton);

    // APIレスポンス待機
    await waitFor(() => {
      expect(screen.queryByText('https://example.com/feed')).not.toBeInTheDocument();
      // タイトルが表示されることを期待（URLではない）
    });
  });

  test('カスタムタイトルの編集', async () => {
    // フィードを追加
    // ...

    // 編集ボタンをクリック
    const editButton = screen.getByRole('button', { name: /編集/ });
    await userEvent.click(editButton);

    // input が表示される
    const editInput = screen.getByRole('textbox', { name: /フィード名を編集/ });
    expect(editInput).toBeInTheDocument();

    // 新しい名前を入力
    await userEvent.clear(editInput);
    await userEvent.type(editInput, '私のブログ');

    // 保存ボタンをクリック
    const saveButton = screen.getByRole('button', { name: '保存' });
    await userEvent.click(saveButton);

    // 新しい名前が表示される
    expect(screen.getByText('私のブログ')).toBeInTheDocument();

    // localStorageに保存されている
    const stored = JSON.parse(localStorage.getItem('rss_reader_subscriptions') || '{}');
    expect(stored.subscriptions[0].customTitle).toBe('私のブログ');
  });

  test('空文字で保存するとエラーが表示される', async () => {
    // ... 編集モードに入る

    // 空文字を入力
    const editInput = screen.getByRole('textbox', { name: /フィード名を編集/ });
    await userEvent.clear(editInput);

    // 保存ボタンをクリック
    const saveButton = screen.getByRole('button', { name: '保存' });
    await userEvent.click(saveButton);

    // エラーメッセージが表示される
    expect(screen.getByText('フィード名を入力してください')).toBeInTheDocument();
  });
});
```

テストを実行：

```bash
npm test -- feedTitleFlow.test.tsx
```

## Troubleshooting

### 問題: タイトルが表示されない（URLのまま）

**原因**: APIレスポンスからtitleが取得できていない

**解決策**:
1. ブラウザの開発者ツールのNetworkタブでAPI応答を確認
2. `useFeedAPI.ts`で`console.log(response.feeds)`を追加
3. `feed.title`が存在することを確認

### 問題: カスタムタイトルが保存されない

**原因**: localStorageへの保存が失敗している

**解決策**:
1. ブラウザのlocalStorage容量を確認
2. `storage.ts`の`saveSubscriptions`にtry-catchを追加
3. DevToolsのConsoleでエラーを確認

### 問題: リロード後にカスタムタイトルが消える

**原因**: マイグレーション処理が正しく動作していない

**解決策**:
1. `storage.ts`の`loadSubscriptions`を確認
2. `customTitle ?? null`の処理が含まれているか確認
3. DevToolsでlocalStorageの実際のデータを確認

## Next Steps

この実装が完了したら：

1. [ ] すべてのテストがパスすることを確認
2. [ ] コードレビューを依頼
3. [ ] ドキュメントを更新
4. [ ] PRを作成

## Resources

- [research.md](./research.md) - 技術調査の詳細
- [data-model.md](./data-model.md) - データモデルの詳細設計
- [contracts/README.md](./contracts/README.md) - API契約
- [React Testing Library](https://testing-library.com/react) - テストのベストプラクティス
- [Vitest](https://vitest.dev/) - テストフレームワーク

## Summary

このクイックスタートガイドに従えば、約2-3時間で機能を実装できます。各ステップを順番に進め、テストを書きながら開発することで、品質の高い実装が実現できます。

質問や問題がある場合は、[data-model.md](./data-model.md)や[research.md](./research.md)を参照してください。