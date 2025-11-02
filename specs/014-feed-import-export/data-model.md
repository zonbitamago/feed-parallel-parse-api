# Data Model: 購読フィードのインポート/エクスポート機能

**Feature**: 014-feed-import-export
**Date**: 2025-11-02
**Phase**: 1 (Design & Contracts)

## 概要

このドキュメントでは、購読フィードのインポート/エクスポート機能で使用するデータモデルを定義します。既存のSubscription型を拡張し、ファイルエクスポート、インポート、バリデーションに必要な型を追加します。

---

## Core Entities

### Subscription（既存）

**ファイル**: `/frontend/src/types/models.ts`

購読フィードの基本エンティティ（既存の型定義を使用）。

```typescript
export interface Subscription {
  id: string;                    // UUID（crypto.randomUUID()で生成）
  url: string;                   // フィードURL（重複チェックのキー）
  title: string | null;          // 自動取得されたフィードタイトル
  customTitle: string | null;    // ユーザーが設定したカスタムタイトル
  subscribedAt: string;          // 購読開始日時（ISO 8601形式）
  lastFetchedAt: string | null;  // 最終取得日時（ISO 8601形式、未フェッチの場合null）
  status: 'active' | 'error';    // フィード状態
}
```

**フィールド詳細**:

| フィールド | 型 | 必須 | デフォルト値 | 説明 |
|-----------|----|----|------------|------|
| `id` | string | ✅ | crypto.randomUUID() | 一意識別子（UUID v4形式） |
| `url` | string | ✅ | - | フィードURL（https://またはhttp://で始まる） |
| `title` | string \| null | ✅ | null | フィードタイトル（自動取得失敗時null） |
| `customTitle` | string \| null | ✅ | null | ユーザーが設定したカスタムタイトル |
| `subscribedAt` | string | ✅ | new Date().toISOString() | 購読開始日時（ISO 8601形式） |
| `lastFetchedAt` | string \| null | ✅ | null | 最終フェッチ日時（未フェッチ時null） |
| `status` | 'active' \| 'error' | ✅ | 'active' | フィード状態 |

**バリデーションルール**:
- `id`: UUIDv4形式（xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx）
- `url`: 有効なURL形式、http/https プロトコル
- `subscribedAt`: ISO 8601形式（YYYY-MM-DDTHH:mm:ss.sssZ）
- `lastFetchedAt`: ISO 8601形式またはnull

---

## New Entities

### ExportData

**ファイル**: `/frontend/src/types/models.ts`（新規追加）

エクスポートファイルのルート構造。

```typescript
export interface ExportData {
  version: string;                // エクスポートフォーマットのバージョン
  exportedAt: string;            // エクスポート実行日時（ISO 8601形式）
  subscriptions: Subscription[]; // 購読フィードの配列
}
```

**フィールド詳細**:

| フィールド | 型 | 必須 | 説明 |
|-----------|----|----|------|
| `version` | string | ✅ | エクスポートフォーマットのバージョン（例: "1.0.0"） |
| `exportedAt` | string | ✅ | エクスポート実行日時（ISO 8601形式） |
| `subscriptions` | Subscription[] | ✅ | 購読フィードの配列 |

**バリデーションルール**:
- `version`: セマンティックバージョニング形式（例: "1.0.0"）
- `exportedAt`: ISO 8601形式
- `subscriptions`: 配列（空配列も許可）

**サンプルデータ**:

```json
{
  "version": "1.0.0",
  "exportedAt": "2025-11-02T10:30:00.000Z",
  "subscriptions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "url": "https://example.com/feed.xml",
      "title": "Example Feed",
      "customTitle": null,
      "subscribedAt": "2025-10-01T12:00:00.000Z",
      "lastFetchedAt": "2025-11-02T09:00:00.000Z",
      "status": "active"
    }
  ]
}
```

---

### ImportResult

**ファイル**: `/frontend/src/types/models.ts`（新規追加）

インポート処理の結果を表すエンティティ。

```typescript
export interface ImportResult {
  success: boolean;              // インポート成功フラグ
  addedCount: number;            // 追加されたフィード数
  skippedCount: number;          // スキップされたフィード数（重複）
  message: string;               // ユーザーに表示するメッセージ
  error?: string;                // エラーメッセージ（失敗時のみ）
}
```

**フィールド詳細**:

| フィールド | 型 | 必須 | 説明 |
|-----------|----|----|------|
| `success` | boolean | ✅ | インポート成功フラグ（true: 成功、false: 失敗） |
| `addedCount` | number | ✅ | 追加されたフィード数（0以上） |
| `skippedCount` | number | ✅ | 重複によりスキップされたフィード数（0以上） |
| `message` | string | ✅ | ユーザーに表示する成功メッセージ |
| `error` | string | ❌ | エラーメッセージ（失敗時のみ設定） |

**成功時のサンプル**:

```typescript
{
  success: true,
  addedCount: 3,
  skippedCount: 2,
  message: "3件のフィードを追加しました。2件のフィードは既に購読済みのためスキップしました。",
}
```

**失敗時のサンプル**:

```typescript
{
  success: false,
  addedCount: 0,
  skippedCount: 0,
  message: "",
  error: "ファイル形式が正しくありません。有効なJSONファイルを選択してください。",
}
```

---

### ImportValidationError

**ファイル**: `/frontend/src/types/models.ts`（新規追加）

インポート時のバリデーションエラーを表すエンティティ。

```typescript
export interface ImportValidationError {
  code: ImportErrorCode;         // エラーコード
  message: string;               // エラーメッセージ
  details?: string;              // 詳細情報（任意）
}

export type ImportErrorCode =
  | 'INVALID_JSON'                // 不正なJSON形式
  | 'INVALID_SCHEMA'              // スキーマ不一致
  | 'FILE_TOO_LARGE'              // ファイルサイズ超過
  | 'FILE_READ_ERROR'             // ファイル読み込みエラー
  | 'MISSING_REQUIRED_FIELD'      // 必須フィールド欠落
  | 'INVALID_VERSION';            // 非対応バージョン
```

**フィールド詳細**:

| フィールド | 型 | 必須 | 説明 |
|-----------|----|----|------|
| `code` | ImportErrorCode | ✅ | エラーコード（enum） |
| `message` | string | ✅ | ユーザーに表示するエラーメッセージ |
| `details` | string | ❌ | 開発者向け詳細情報 |

**サンプル**:

```typescript
{
  code: 'INVALID_SCHEMA',
  message: 'データ形式が正しくありません。エクスポートされたフィードファイルを選択してください。',
  details: 'Missing "subscriptions" field in imported data',
}
```

---

## Data Relationships

### Subscription → ExportData

**関係**: 1対多（1つのExportDataは複数のSubscriptionを含む）

```typescript
ExportData = {
  version: string,
  exportedAt: string,
  subscriptions: Subscription[],  // 複数のSubscription
}
```

### ImportResult ⇄ ExportData

**関係**: ExportDataをインポートした結果がImportResult

```typescript
// インポート処理のフロー
ExportData → Validation → Merge → ImportResult
```

---

## State Transitions

### Subscription Status

```text
[新規追加時]
  ↓
'active' ←→ 'error'
  ↓
[削除]
```

**状態遷移ルール**:
- 新規追加: status = 'active'（FR-018）
- フィード取得成功: status = 'active'
- フィード取得失敗: status = 'error'
- インポート時: 常に'active'に設定（FR-018）

### Import Process States

```text
[ファイル選択]
  ↓
[ファイルサイズチェック] ─NG→ [エラー: FILE_TOO_LARGE]
  ↓ OK
[ファイル読み込み] ─NG→ [エラー: FILE_READ_ERROR]
  ↓ OK
[JSONパース] ─NG→ [エラー: INVALID_JSON]
  ↓ OK
[スキーマ検証] ─NG→ [エラー: INVALID_SCHEMA]
  ↓ OK
[バージョンチェック] ─NG→ [エラー: INVALID_VERSION]
  ↓ OK
[重複チェック & マージ]
  ↓
[localStorage保存]
  ↓
[ImportResult返却]
```

---

## Validation Rules

### ExportData Validation

```typescript
function validateExportData(data: unknown): data is ExportData {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;

  // version フィールドのチェック
  if (!('version' in obj) || typeof obj.version !== 'string') return false;

  // exportedAt フィールドのチェック
  if (!('exportedAt' in obj) || typeof obj.exportedAt !== 'string') return false;
  if (!isValidISODate(obj.exportedAt)) return false;

  // subscriptions フィールドのチェック
  if (!('subscriptions' in obj) || !Array.isArray(obj.subscriptions)) return false;

  // 各Subscriptionのバリデーション
  return obj.subscriptions.every(sub => validateSubscription(sub));
}
```

### Subscription Validation（for Import）

```typescript
function validateSubscription(data: unknown): data is Subscription {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;

  // 必須フィールド: url
  if (!('url' in obj) || typeof obj.url !== 'string') return false;
  if (!isValidUrl(obj.url)) return false;

  // 任意フィールド: title, customTitle, status など
  if ('title' in obj && obj.title !== null && typeof obj.title !== 'string') return false;
  if ('customTitle' in obj && obj.customTitle !== null && typeof obj.customTitle !== 'string') return false;

  // status は 'active' | 'error' のみ許可
  if ('status' in obj && obj.status !== 'active' && obj.status !== 'error') return false;

  return true;
}
```

---

## Migration Strategy

### Version 1.0.0 → Future Versions

将来的にエクスポートフォーマットのバージョンが変更された場合、以下のマイグレーション戦略を適用します。

```typescript
function migrateExportData(data: ExportData): ExportData {
  const version = data.version || '1.0.0';

  switch (version) {
    case '1.0.0':
      // バージョン1.0.0の場合はそのまま返す
      return data;

    case '2.0.0':
      // バージョン2.0.0の場合はマイグレーション処理を実行
      return migrateFromV1ToV2(data);

    default:
      throw new Error(`Unsupported version: ${version}`);
  }
}
```

### Import時のフィールドマイグレーション

インポート時に以下のフィールドを新規生成・初期化（FR-015 ~ FR-018）:

```typescript
function normalizeImportedSubscription(imported: Partial<Subscription>): Subscription {
  return {
    id: crypto.randomUUID(),                     // 新規生成（FR-015）
    url: imported.url!,                          // 必須（検証済み）
    title: imported.title ?? null,               // そのまま使用
    customTitle: imported.customTitle ?? null,   // そのまま使用
    subscribedAt: new Date().toISOString(),      // 現在日時（FR-016）
    lastFetchedAt: null,                         // null に設定（FR-017）
    status: 'active',                            // 'active' に設定（FR-018）
  };
}
```

---

## Data Constraints

### localStorage Constraints

| 項目 | 制約 | 対応 |
|------|------|------|
| 最大容量 | 通常5MB（ブラウザ依存） | インポート前に容量チェック |
| キーの命名 | `rss_reader_subscriptions` | 既存の命名規則を踏襲 |
| データ形式 | JSON文字列 | JSON.stringify/parseを使用 |

### File Constraints

| 項目 | 制約 | 理由 |
|------|------|------|
| ファイルサイズ | 最大1MB（FR-007） | localStorageの容量制限を考慮 |
| ファイル形式 | `.json` のみ | JSON形式のみサポート（spec.md） |
| 文字エンコーディング | UTF-8 | ブラウザのFileReader APIはUTF-8を使用 |

### Subscription Constraints

| 項目 | 制約 | 理由 |
|------|------|------|
| URL形式 | http/https プロトコル | 既存のURL検証ロジックを踏襲 |
| 重複チェック | URLベース | 同じURLのフィードは同一とみなす（spec.md） |
| フィード数 | 上限なし（推奨100件以内） | パフォーマンス考慮 |

---

## Index Keys

### Deduplication Index

重複チェックに使用するキー:

```typescript
// URL をキーとしたSet
const existingUrls = new Set<string>(
  existingSubscriptions.map(sub => sub.url)
);

// 重複チェック
const isDuplicate = existingUrls.has(importedSub.url);
```

**理由**: URLは一意性を保証するキーとして使用できる（spec.md Assumptions）

---

## Error Handling

### Import Errors

| エラーコード | 原因 | ユーザーメッセージ | リカバリー方法 |
|------------|------|------------------|--------------|
| `INVALID_JSON` | JSONパース失敗 | ファイル形式が正しくありません | 有効なJSONファイルを選択 |
| `INVALID_SCHEMA` | スキーマ不一致 | データ形式が正しくありません | エクスポートファイルを使用 |
| `FILE_TOO_LARGE` | ファイルサイズ超過 | ファイルサイズが大きすぎます（最大1MB） | ファイルを分割 |
| `FILE_READ_ERROR` | ファイル読み込み失敗 | ファイルの読み込みに失敗しました | 再試行 |
| `MISSING_REQUIRED_FIELD` | 必須フィールド欠落 | データ形式が正しくありません | エクスポートファイルを確認 |
| `INVALID_VERSION` | 非対応バージョン | このバージョンのエクスポートファイルには対応していません | 最新版でエクスポート |

### Export Errors

| エラー | 原因 | ユーザーメッセージ | リカバリー方法 |
|--------|------|------------------|--------------|
| Export failed | ブラウザAPI失敗 | エクスポートに失敗しました | 再試行 |

---

## Data Flow

### Export Flow

```text
[ユーザー: エクスポートボタンクリック]
  ↓
[loadSubscriptions() でlocalStorageから読み込み]
  ↓
[ExportData型でラップ]
  version: "1.0.0"
  exportedAt: 現在日時
  subscriptions: Subscription[]
  ↓
[JSON.stringify(data, null, 2)]
  ↓
[Blob作成: type="application/json"]
  ↓
[URL.createObjectURL(blob)]
  ↓
[ダウンロード: subscriptions_YYYY-MM-DD.json]
  ↓
[URL.revokeObjectURL(url) でメモリ解放]
```

### Import Flow

```text
[ユーザー: ファイル選択]
  ↓
[ファイルサイズチェック (≤ 1MB)]
  ↓ OK
[FileReader.readAsText(file)]
  ↓
[JSON.parse(fileContent)]
  ↓
[validateExportData(data)]
  ↓ OK
[バージョンチェック & マイグレーション]
  ↓
[重複チェック（URLベース）]
  ↓
[normalizeImportedSubscription() で新規Subscription作成]
  id: 新規UUID
  subscribedAt: 現在日時
  lastFetchedAt: null
  status: 'active'
  ↓
[既存データとマージ]
  [...existing, ...added]
  ↓
[saveSubscriptions() でlocalStorageに保存]
  ↓
[ImportResult返却]
  addedCount: X件
  skippedCount: Y件
  message: "..."
```

---

## Summary

このデータモデルにより、以下が実現できます：

1. **型安全性**: TypeScriptの型定義により、コンパイル時にデータの整合性を保証
2. **バージョン管理**: ExportDataにversionフィールドを含めることで、将来的なフォーマット変更に対応
3. **バリデーション**: 各エンティティに明確なバリデーションルールを定義し、不正データを検出
4. **エラーハンドリング**: ImportErrorCode enumにより、エラーの種類を明確に分類
5. **マイグレーション**: 既存データとの互換性を保ちつつ、新しいフィールドに対応

次のPhase（コントラクト定義）では、これらのデータモデルを使用する関数のインターフェースを定義します。
