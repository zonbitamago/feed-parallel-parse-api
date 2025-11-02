# Research: 購読フィードのインポート/エクスポート機能

**Feature**: 014-feed-import-export
**Date**: 2025-11-02
**Phase**: 0 (Outline & Research)

## 調査概要

購読フィードのインポート/エクスポート機能を実装するための技術調査を実施しました。既存のコードベースを分析し、実装に必要な技術要素、パターン、制約を特定しました。

---

## 技術スタック

### フロントエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| TypeScript | 5.9.3 | 型安全な開発 |
| React | 19.1.1 | UIフレームワーク |
| Vite | 7.1.7 | ビルドツール |
| TailwindCSS | 4.1.16 | スタイリング |
| date-fns | 4.1.0 | 日付処理 |
| react-window | 2.2.2 | 仮想スクロール |

### テスティング

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Vitest | 4.0.3 | テスト実行エンジン |
| @testing-library/react | 16.3.0 | Reactコンポーネントテスト |
| happy-dom | - | DOM環境シミュレーション |

---

## 既存実装の分析

### localStorageの使用パターン

**ファイル**: `/frontend/src/services/storage.ts`

#### ストレージキー

- **メインキー**: `rss_reader_subscriptions`
  - データ形式: `{ subscriptions: Subscription[] }`
  - JSON.stringifyでシリアライズ
- **折りたたみ状態**: `rss_reader_subscriptions_collapsed`
  - データ形式: `boolean`

#### 既存関数

```typescript
// 読み込み
export function loadSubscriptions(): Subscription[]

// 保存
export function saveSubscriptions(subscriptions: Subscription[]): void
```

**マイグレーション機能**: `customTitle: undefined` → `null` に正規化

---

### Subscription型の定義

**ファイル**: `/frontend/src/types/models.ts`

```typescript
export interface Subscription {
  id: string;                    // UUID（crypto.randomUUID()）
  url: string;                   // フィードURL
  title: string | null;          // 自動取得されたタイトル
  customTitle: string | null;    // ユーザー設定のタイトル
  subscribedAt: string;          // ISO 8601形式
  lastFetchedAt: string | null;  // 最終取得日時
  status: 'active' | 'error';    // フィード状態
}
```

**重複チェックのキー**: `url`フィールド（URLが一致するフィードは同一と判定）

---

### FeedManagerの構成

**ファイル**: `/frontend/src/components/FeedManager/FeedManager.tsx`

#### UI構成

1. **フォーム部分**（行215-223）:
   - URL入力フィールド
   - 「追加」ボタン（`bg-blue-600 hover:bg-blue-700`）

2. **購読リスト部分**（行232-261）:
   - 購読件数表示 + 折りたたみボタン
   - 各フィード行（FeedSubscriptionItem）
     - 表示モード: FeedDisplayRow（編集・削除ボタン）
     - 編集モード: FeedEditRow（保存・キャンセルボタン）

#### ボタンスタイリングパターン

- **プライマリボタン**: `bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded`
- **セカンダリボタン**: `text-sm text-blue-600 hover:text-blue-800 underline`
- **削除ボタン**: `text-red-600 hover:text-red-800`

---

### エラーメッセージ管理

**ファイル**: `/frontend/src/constants/errorMessages.ts`

#### 既存パターン

```typescript
export const FEED_ERROR_MESSAGES = {
  FETCH_FAILED: 'フィードの取得に失敗しました',
  DUPLICATE_FEED: 'このフィードは既に登録されています',
  // ...その他
} as const;
```

#### インポート/エクスポート用エラーメッセージ（新規追加予定）

```typescript
export const IMPORT_EXPORT_ERROR_MESSAGES = {
  IMPORT_INVALID_JSON: 'ファイル形式が正しくありません。有効なJSONファイルを選択してください。',
  IMPORT_INVALID_SCHEMA: 'データ形式が正しくありません。エクスポートされたフィードファイルを選択してください。',
  IMPORT_FILE_TOO_LARGE: 'ファイルサイズが大きすぎます（最大1MB）',
  IMPORT_FILE_READ_ERROR: 'ファイルの読み込みに失敗しました',
  EXPORT_FAILED: 'エクスポートに失敗しました',
} as const;
```

---

## File API の使用方法

### エクスポート実装

```typescript
// 1. JSONデータを生成
const exportData = { subscriptions: loadSubscriptions() };
const jsonString = JSON.stringify(exportData, null, 2);

// 2. Blobオブジェクトを作成
const blob = new Blob([jsonString], { type: 'application/json' });

// 3. ダウンロードURLを生成
const url = URL.createObjectURL(blob);

// 4. <a>タグでダウンロード
const link = document.createElement('a');
link.href = url;
link.download = `subscriptions_${formatDate(new Date(), 'yyyy-MM-dd')}.json`;
link.click();

// 5. メモリ解放
URL.revokeObjectURL(url);
```

### インポート実装

```typescript
// 1. ファイル選択（<input type="file" accept=".json" />）
const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // 2. ファイルサイズチェック（1MB = 1048576 bytes）
  if (file.size > 1048576) {
    setError(IMPORT_EXPORT_ERROR_MESSAGES.IMPORT_FILE_TOO_LARGE);
    return;
  }

  // 3. FileReaderで読み込み
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      // 4. JSONパース
      const data = JSON.parse(e.target?.result as string);

      // 5. スキーマ検証
      if (!validateImportData(data)) {
        setError(IMPORT_EXPORT_ERROR_MESSAGES.IMPORT_INVALID_SCHEMA);
        return;
      }

      // 6. インポート処理
      const result = importSubscriptions(data);
      setSuccess(result.message);
    } catch (error) {
      setError(IMPORT_EXPORT_ERROR_MESSAGES.IMPORT_INVALID_JSON);
    }
  };
  reader.onerror = () => {
    setError(IMPORT_EXPORT_ERROR_MESSAGES.IMPORT_FILE_READ_ERROR);
  };
  reader.readAsText(file);
};
```

---

## テスト戦略

### テストファイルの配置

既存パターンに従い、ソースファイルと同じディレクトリに `.test.ts` / `.test.tsx` を配置：

```
frontend/src/
├── services/
│   ├── importExport.ts          # 新規
│   └── importExport.test.ts     # 新規テスト
├── hooks/
│   ├── useImportExport.ts       # 新規
│   └── useImportExport.test.ts  # 新規テスト
└── components/FeedManager/
    ├── ImportExportButtons.tsx  # 新規
    └── ImportExportButtons.test.tsx  # 新規テスト
```

### テスト実行コマンド

```bash
# 1回限りの実行（推奨、CPU負荷低）
npm test

# watchモード（開発時のみ、CPU負荷高）
npm run test:watch

# カバレッジ測定
npm test -- --coverage
```

**重要**: CLAUDE.mdの指示により、実装時はwatchモードを使用しない。

---

## 実装上の制約と考慮事項

### 1. パフォーマンス制約

- **目標**: 100件のフィードを1秒以内に処理（spec.mdから）
- **localStorageの容量制限**: 通常5MB（ブラウザ依存）
- **ファイルサイズ制限**: 1MB（FR-007）

### 2. ブラウザ互換性

**必須対応ブラウザ**:
- Chrome/Edge: 最新版（File API完全対応）
- Firefox: 最新版
- Safari: 最新版

**必要なブラウザAPI**:
- `File API`: ファイルアップロード
- `FileReader`: ファイル読み込み
- `Blob`: データのバイナリ化
- `URL.createObjectURL()`: ダウンロードURL生成
- `crypto.randomUUID()`: UUID生成（既存コードで使用）

### 3. データ整合性

**スキーマ検証**:
```typescript
interface ImportData {
  subscriptions: Array<{
    url: string;  // 必須
    title?: string | null;
    customTitle?: string | null;
    subscribedAt?: string;
    lastFetchedAt?: string | null;
    status?: 'active' | 'error';
  }>;
}

function validateImportData(data: unknown): data is ImportData {
  if (!data || typeof data !== 'object') return false;
  if (!('subscriptions' in data)) return false;
  if (!Array.isArray(data.subscriptions)) return false;

  return data.subscriptions.every(sub =>
    sub && typeof sub === 'object' && 'url' in sub && typeof sub.url === 'string'
  );
}
```

**マイグレーション方針**:
- インポート時にIDを新規生成（FR-015）
- `subscribedAt`を現在日時に設定（FR-016）
- `lastFetchedAt`をnullに設定（FR-017）
- `status`を'active'に設定（FR-018）
- `customTitle: undefined` → `null` に正規化（既存のマイグレーションパターンを踏襲）

---

## エッジケースの処理方針

### 1. URL重複時の処理

**仕様**: 既存のカスタムタイトルを維持（spec.mdのEdge Cases参照）

```typescript
function mergeSubscriptions(
  existing: Subscription[],
  imported: Subscription[]
): { added: Subscription[], skipped: number } {
  const existingUrls = new Set(existing.map(s => s.url));
  const newSubs: Subscription[] = [];
  let skipped = 0;

  for (const importedSub of imported) {
    if (existingUrls.has(importedSub.url)) {
      skipped++;
      // 既存のカスタムタイトルを維持（上書きしない）
    } else {
      newSubs.push({
        ...importedSub,
        id: crypto.randomUUID(),
        subscribedAt: new Date().toISOString(),
        lastFetchedAt: null,
        status: 'active',
      });
    }
  }

  return { added: newSubs, skipped };
}
```

### 2. エラー時のロールバック

**仕様**: インポート前に検証を完了し、一括で適用（spec.mdのEdge Cases参照）

```typescript
function importSubscriptions(data: ImportData): ImportResult {
  // 1. 検証フェーズ（ロールバック不要）
  if (!validateImportData(data)) {
    throw new Error(IMPORT_EXPORT_ERROR_MESSAGES.IMPORT_INVALID_SCHEMA);
  }

  // 2. マージ処理（メモリ上のみ）
  const existing = loadSubscriptions();
  const { added, skipped } = mergeSubscriptions(existing, data.subscriptions);

  // 3. 一括保存（ここで初めてlocalStorageに書き込み）
  const updated = [...existing, ...added];
  saveSubscriptions(updated);

  // 4. 結果を返す
  return {
    addedCount: added.length,
    skippedCount: skipped,
    message: `${added.length}件のフィードを追加しました。${skipped}件のフィードは既に購読済みのためスキップしました。`,
  };
}
```

### 3. 大量データ対応

**仕様**: 1000件以上の場合はバッチ処理（spec.mdのEdge Cases参照）

現時点ではスコープ外（Out of Scope: spec.md 166行目）。初期実装では100件程度を想定。将来的に必要になった場合は、以下を検討：

- プログレスバーの追加
- Web Workerでのバックグラウンド処理
- バッチサイズの調整（例: 100件ずつ）

---

## 技術決定事項

### 1. ファイル形式

**決定**: JSON形式のみサポート

**理由**:
- 既存のlocalStorageがJSON形式を使用している
- ブラウザ標準のJSON.parse/stringifyが使える
- 人間が読める形式で、デバッグが容易
- 型安全性が保たれる（TypeScriptの型定義と一致）

**代替案**:
- OPML形式: 他のRSSリーダーとの互換性は高いが、実装が複雑になる（Out of Scope）
- CSV形式: カスタムタイトルやステータスなどの複雑なデータに不向き

---

### 2. UI配置

**決定**: FeedManager内にボタンを追加

**配置場所**: 購読リストの上部（フォームの下）

```tsx
<div className="mb-6">
  {/* 既存のフォーム */}
  <form onSubmit={handleSubmit}>...</form>

  {/* 新規追加: エクスポート/インポートボタン */}
  <div className="mt-4 flex gap-4">
    <button onClick={handleExport} className="text-sm text-blue-600 hover:text-blue-800 underline">
      エクスポート
    </button>
    <label className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer">
      インポート
      <input type="file" accept=".json" onChange={handleImport} className="hidden" />
    </label>
  </div>
</div>

{/* 購読リスト */}
<div>...</div>
```

**理由**:
- 既存のUIパターンに沿った配置
- ユーザーがフィード管理操作を一箇所で完結できる
- 別画面への遷移が不要

**代替案**:
- 設定画面: 別画面を作る必要があり、実装コストが高い（Rejected）

---

### 3. エラー表示

**決定**: 既存のErrorMessageコンポーネントを使用

**表示方法**: FeedManagerの上部にエラーメッセージを表示（既存パターンを踏襲）

**理由**:
- 既存の実装パターンと一貫性を保つ
- ユーザーが慣れている表示形式
- 実装コストが低い

---

## Next Steps（Phase 1への移行）

Phase 0のリサーチが完了しました。次のPhase 1では以下を実施します：

1. **データモデルの詳細化**（`data-model.md`）:
   - ExportData型の定義
   - ImportResult型の定義
   - スキーマバリデーションの仕様

2. **API契約の定義**（`contracts/`）:
   - エクスポート関数のインターフェース
   - インポート関数のインターフェース
   - バリデーション関数のインターフェース

3. **クイックスタートガイド**（`quickstart.md`）:
   - 開発環境のセットアップ
   - テストの実行方法
   - デバッグ方法

4. **エージェントコンテキストの更新**:
   - CLAUDE.mdへの技術スタック追加（File API、Blobなど）
