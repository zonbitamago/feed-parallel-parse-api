# API Contract: Import/Export Functions

**Feature**: 014-feed-import-export
**Date**: 2025-11-02
**Phase**: 1 (Design & Contracts)

## 概要

このドキュメントでは、購読フィードのインポート/エクスポート機能で使用するAPI契約を定義します。各関数のインターフェース、入力パラメータ、戻り値、エラーハンドリングを明確にします。

---

## Export Functions

### exportSubscriptions

購読フィード一覧をJSONファイルとしてエクスポートします。

**シグネチャ**:

```typescript
function exportSubscriptions(): void
```

**パラメータ**: なし

**戻り値**: なし（ファイルダウンロードを実行）

**副作用**:
- ブラウザのダウンロード機能を使用してJSONファイルをダウンロード
- ファイル名: `subscriptions_YYYY-MM-DD.json`（YYYY-MM-DDは実行日）

**エラー処理**:
- localStorageの読み込み失敗: `Error` をthrow
- Blob作成失敗: `Error` をthrow
- ダウンロード失敗: 静かに失敗（ブラウザのダウンロード機能に依存）

**例**:

```typescript
// 使用例
try {
  exportSubscriptions();
  console.log('エクスポート成功');
} catch (error) {
  console.error('エクスポート失敗:', error);
}
```

**実装の詳細**:

```typescript
function exportSubscriptions(): void {
  try {
    // 1. localStorageから購読フィードを読み込む
    const subscriptions = loadSubscriptions();

    // 2. ExportData型でラップ
    const exportData: ExportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      subscriptions,
    };

    // 3. JSON文字列に変換（インデント付き）
    const jsonString = JSON.stringify(exportData, null, 2);

    // 4. Blobオブジェクトを作成
    const blob = new Blob([jsonString], { type: 'application/json' });

    // 5. ダウンロードURLを生成
    const url = URL.createObjectURL(blob);

    // 6. ダウンロードリンクを作成してクリック
    const link = document.createElement('a');
    link.href = url;
    link.download = `subscriptions_${formatDate(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();

    // 7. メモリ解放
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error('エクスポートに失敗しました');
  }
}
```

**テストケース**:

```typescript
describe('exportSubscriptions', () => {
  it('購読フィードが3件ある場合、3件を含むJSONファイルをダウンロードする', () => {
    // Arrange
    const mockSubscriptions = [/* 3件のモックデータ */];
    vi.spyOn(Storage, 'loadSubscriptions').mockReturnValue(mockSubscriptions);
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');
    const linkClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');

    // Act
    exportSubscriptions();

    // Assert
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(linkClickSpy).toHaveBeenCalled();
  });

  it('購読フィードが0件の場合、空の配列を含むJSONファイルをダウンロードする', () => {
    // Arrange
    vi.spyOn(Storage, 'loadSubscriptions').mockReturnValue([]);

    // Act & Assert
    expect(() => exportSubscriptions()).not.toThrow();
  });
});
```

---

## Import Functions

### importSubscriptions

JSONファイルから購読フィードをインポートします。既存のフィードとマージし、重複はスキップします。

**シグネチャ**:

```typescript
function importSubscriptions(file: File): Promise<ImportResult>
```

**パラメータ**:

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| `file` | File | ✅ | インポートするJSONファイル |

**戻り値**: `Promise<ImportResult>`

```typescript
interface ImportResult {
  success: boolean;
  addedCount: number;
  skippedCount: number;
  message: string;
  error?: string;
}
```

**エラー処理**:
- ファイルサイズ超過（>1MB）: `ImportValidationError` をthrow
- JSON パース失敗: `ImportValidationError` をthrow
- スキーマ不一致: `ImportValidationError` をthrow
- ファイル読み込み失敗: `ImportValidationError` をthrow

**例**:

```typescript
// 使用例
const file = event.target.files[0];

try {
  const result = await importSubscriptions(file);
  if (result.success) {
    console.log(result.message); // "3件のフィードを追加しました..."
  } else {
    console.error(result.error);
  }
} catch (error) {
  if (error instanceof ImportValidationError) {
    console.error(`エラー [${error.code}]: ${error.message}`);
  }
}
```

**実装の詳細**:

```typescript
async function importSubscriptions(file: File): Promise<ImportResult> {
  // 1. ファイルサイズチェック（1MB = 1048576 bytes）
  if (file.size > 1048576) {
    throw new ImportValidationError({
      code: 'FILE_TOO_LARGE',
      message: IMPORT_EXPORT_ERROR_MESSAGES.IMPORT_FILE_TOO_LARGE,
    });
  }

  // 2. ファイル読み込み
  const fileContent = await readFileAsText(file);

  // 3. JSONパース
  let parsedData: unknown;
  try {
    parsedData = JSON.parse(fileContent);
  } catch {
    throw new ImportValidationError({
      code: 'INVALID_JSON',
      message: IMPORT_EXPORT_ERROR_MESSAGES.IMPORT_INVALID_JSON,
    });
  }

  // 4. スキーマ検証
  if (!validateExportData(parsedData)) {
    throw new ImportValidationError({
      code: 'INVALID_SCHEMA',
      message: IMPORT_EXPORT_ERROR_MESSAGES.IMPORT_INVALID_SCHEMA,
    });
  }

  // 5. バージョンチェック & マイグレーション
  const migratedData = migrateExportData(parsedData);

  // 6. 既存データの読み込み
  const existingSubscriptions = loadSubscriptions();

  // 7. 重複チェック & マージ
  const { added, skipped } = mergeSubscriptions(
    existingSubscriptions,
    migratedData.subscriptions
  );

  // 8. localStorage に保存
  const updated = [...existingSubscriptions, ...added];
  saveSubscriptions(updated);

  // 9. 結果を返す
  return {
    success: true,
    addedCount: added.length,
    skippedCount: skipped,
    message: `${added.length}件のフィードを追加しました。${skipped}件のフィードは既に購読済みのためスキップしました。`,
  };
}
```

**テストケース**:

```typescript
describe('importSubscriptions', () => {
  it('有効なJSONファイルをインポートし、重複しないフィードを追加する', async () => {
    // Arrange
    const existingSubscriptions = [/* 2件の既存データ */];
    const importedSubscriptions = [/* 5件（うち2件は重複） */];
    vi.spyOn(Storage, 'loadSubscriptions').mockReturnValue(existingSubscriptions);
    const saveSubscriptionsSpy = vi.spyOn(Storage, 'saveSubscriptions');

    const file = createMockFile(importedSubscriptions);

    // Act
    const result = await importSubscriptions(file);

    // Assert
    expect(result.success).toBe(true);
    expect(result.addedCount).toBe(3);
    expect(result.skippedCount).toBe(2);
    expect(saveSubscriptionsSpy).toHaveBeenCalledWith(
      expect.arrayContaining(/* 5件のデータ */)
    );
  });

  it('ファイルサイズが1MBを超える場合、エラーをthrowする', async () => {
    // Arrange
    const largeFile = createMockFile(/* 2MB のデータ */);

    // Act & Assert
    await expect(importSubscriptions(largeFile)).rejects.toThrow(ImportValidationError);
  });

  it('不正なJSON形式の場合、エラーをthrowする', async () => {
    // Arrange
    const invalidFile = createMockFile('{ invalid json }');

    // Act & Assert
    await expect(importSubscriptions(invalidFile)).rejects.toThrow(ImportValidationError);
  });
});
```

---

## Validation Functions

### validateExportData

エクスポートデータのスキーマを検証します。

**シグネチャ**:

```typescript
function validateExportData(data: unknown): data is ExportData
```

**パラメータ**:

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| `data` | unknown | ✅ | 検証対象のデータ |

**戻り値**: `boolean` （型ガード関数）

**検証ルール**:
- `version` フィールドが存在し、string型である
- `exportedAt` フィールドが存在し、有効なISO 8601形式である
- `subscriptions` フィールドが存在し、配列である
- `subscriptions` の各要素が有効なSubscription型である

**例**:

```typescript
const data = JSON.parse(fileContent);

if (validateExportData(data)) {
  // dataはExportData型として扱える
  console.log(data.subscriptions.length);
} else {
  throw new Error('Invalid export data');
}
```

**実装の詳細**:

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

---

### validateSubscription

Subscription型の検証を行います（インポート用）。

**シグネチャ**:

```typescript
function validateSubscription(data: unknown): data is Partial<Subscription>
```

**パラメータ**:

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| `data` | unknown | ✅ | 検証対象のデータ |

**戻り値**: `boolean` （型ガード関数）

**検証ルール**:
- `url` フィールドが存在し、string型で、有効なURL形式である（必須）
- `title` が存在する場合、string | null 型である
- `customTitle` が存在する場合、string | null 型である
- `status` が存在する場合、'active' | 'error' のいずれかである

**例**:

```typescript
const sub = JSON.parse(subscriptionJson);

if (validateSubscription(sub)) {
  // subはPartial<Subscription>型として扱える
  console.log(sub.url);
} else {
  throw new Error('Invalid subscription');
}
```

**実装の詳細**:

```typescript
function validateSubscription(data: unknown): data is Partial<Subscription> {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;

  // 必須フィールド: url
  if (!('url' in obj) || typeof obj.url !== 'string') return false;
  if (!isValidUrl(obj.url)) return false;

  // 任意フィールド: title, customTitle
  if ('title' in obj && obj.title !== null && typeof obj.title !== 'string') return false;
  if ('customTitle' in obj && obj.customTitle !== null && typeof obj.customTitle !== 'string') return false;

  // status は 'active' | 'error' のみ許可
  if ('status' in obj && obj.status !== 'active' && obj.status !== 'error') return false;

  return true;
}
```

---

## Utility Functions

### readFileAsText

ファイルをテキストとして読み込みます。

**シグネチャ**:

```typescript
function readFileAsText(file: File): Promise<string>
```

**パラメータ**:

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| `file` | File | ✅ | 読み込むファイル |

**戻り値**: `Promise<string>` （ファイルの内容）

**エラー処理**:
- ファイル読み込み失敗: `ImportValidationError` をthrow

**例**:

```typescript
try {
  const content = await readFileAsText(file);
  console.log('File content:', content);
} catch (error) {
  console.error('Failed to read file:', error);
}
```

**実装の詳細**:

```typescript
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new ImportValidationError({
          code: 'FILE_READ_ERROR',
          message: IMPORT_EXPORT_ERROR_MESSAGES.IMPORT_FILE_READ_ERROR,
        }));
      }
    };

    reader.onerror = () => {
      reject(new ImportValidationError({
        code: 'FILE_READ_ERROR',
        message: IMPORT_EXPORT_ERROR_MESSAGES.IMPORT_FILE_READ_ERROR,
      }));
    };

    reader.readAsText(file);
  });
}
```

---

### mergeSubscriptions

既存のフィードとインポートしたフィードをマージします。URLが重複するフィードはスキップします。

**シグネチャ**:

```typescript
function mergeSubscriptions(
  existing: Subscription[],
  imported: Partial<Subscription>[]
): { added: Subscription[], skipped: number }
```

**パラメータ**:

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| `existing` | Subscription[] | ✅ | 既存の購読フィード |
| `imported` | Partial<Subscription>[] | ✅ | インポートしたフィード |

**戻り値**: `{ added: Subscription[], skipped: number }`

| フィールド | 型 | 説明 |
|-----------|----|----|
| `added` | Subscription[] | 新規追加されたフィード（正規化済み） |
| `skipped` | number | 重複によりスキップされたフィード数 |

**重複判定**: URLが一致するフィードは重複とみなす

**例**:

```typescript
const existing = loadSubscriptions();
const imported = parsedData.subscriptions;

const { added, skipped } = mergeSubscriptions(existing, imported);

console.log(`Added: ${added.length}, Skipped: ${skipped}`);
```

**実装の詳細**:

```typescript
function mergeSubscriptions(
  existing: Subscription[],
  imported: Partial<Subscription>[]
): { added: Subscription[], skipped: number } {
  // 既存のURLをSetに格納（高速検索）
  const existingUrls = new Set(existing.map(sub => sub.url));

  const added: Subscription[] = [];
  let skipped = 0;

  for (const importedSub of imported) {
    // 重複チェック
    if (existingUrls.has(importedSub.url!)) {
      skipped++;
      continue;
    }

    // 新規フィードの正規化
    const normalized = normalizeImportedSubscription(importedSub);
    added.push(normalized);
  }

  return { added, skipped };
}
```

**テストケース**:

```typescript
describe('mergeSubscriptions', () => {
  it('URLが重複するフィードをスキップし、新規フィードのみを追加する', () => {
    // Arrange
    const existing = [
      { url: 'https://example.com/feed1', /* ... */ },
      { url: 'https://example.com/feed2', /* ... */ },
    ];
    const imported = [
      { url: 'https://example.com/feed1' }, // 重複
      { url: 'https://example.com/feed3' }, // 新規
      { url: 'https://example.com/feed4' }, // 新規
    ];

    // Act
    const { added, skipped } = mergeSubscriptions(existing, imported);

    // Assert
    expect(added.length).toBe(2);
    expect(skipped).toBe(1);
  });
});
```

---

### normalizeImportedSubscription

インポートしたフィードを正規化して、Subscription型に変換します。

**シグネチャ**:

```typescript
function normalizeImportedSubscription(
  imported: Partial<Subscription>
): Subscription
```

**パラメータ**:

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| `imported` | Partial<Subscription> | ✅ | インポートしたフィード（部分的なデータ） |

**戻り値**: `Subscription` （正規化されたフィード）

**正規化ルール** (FR-015 ~ FR-018):
- `id`: 新規生成（`crypto.randomUUID()`）
- `subscribedAt`: 現在日時（`new Date().toISOString()`）
- `lastFetchedAt`: null
- `status`: 'active'
- その他のフィールド: インポートデータから取得（なければnull）

**例**:

```typescript
const imported = {
  url: 'https://example.com/feed',
  title: 'Example Feed',
  customTitle: 'My Feed',
};

const normalized = normalizeImportedSubscription(imported);

console.log(normalized);
// {
//   id: "550e8400-e29b-41d4-a716-446655440000",
//   url: "https://example.com/feed",
//   title: "Example Feed",
//   customTitle: "My Feed",
//   subscribedAt: "2025-11-02T10:30:00.000Z",
//   lastFetchedAt: null,
//   status: "active"
// }
```

**実装の詳細**:

```typescript
function normalizeImportedSubscription(
  imported: Partial<Subscription>
): Subscription {
  return {
    id: crypto.randomUUID(),                     // 新規生成（FR-015）
    url: imported.url!,                          // 必須（検証済み）
    title: imported.title ?? null,               // nullに正規化
    customTitle: imported.customTitle ?? null,   // nullに正規化
    subscribedAt: new Date().toISOString(),      // 現在日時（FR-016）
    lastFetchedAt: null,                         // null に設定（FR-017）
    status: 'active',                            // 'active' に設定（FR-018）
  };
}
```

---

### migrateExportData

エクスポートデータのバージョンをマイグレーションします。

**シグネチャ**:

```typescript
function migrateExportData(data: ExportData): ExportData
```

**パラメータ**:

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| `data` | ExportData | ✅ | マイグレーション対象のデータ |

**戻り値**: `ExportData` （マイグレーション済みデータ）

**サポートするバージョン**:
- `1.0.0`: 現在のバージョン（そのまま返す）
- 将来的に `2.0.0` などを追加可能

**例**:

```typescript
const data = JSON.parse(fileContent);
const migrated = migrateExportData(data);

// バージョンに応じてマイグレーション処理が実行される
console.log(migrated.version);
```

**実装の詳細**:

```typescript
function migrateExportData(data: ExportData): ExportData {
  const version = data.version || '1.0.0';

  switch (version) {
    case '1.0.0':
      // バージョン1.0.0の場合はそのまま返す
      return data;

    // 将来的なバージョン対応
    // case '2.0.0':
    //   return migrateFromV1ToV2(data);

    default:
      throw new ImportValidationError({
        code: 'INVALID_VERSION',
        message: `このバージョン（${version}）のエクスポートファイルには対応していません`,
      });
  }
}
```

---

## Error Classes

### ImportValidationError

インポート時のバリデーションエラーを表すカスタムエラークラス。

**シグネチャ**:

```typescript
class ImportValidationError extends Error {
  code: ImportErrorCode;
  details?: string;

  constructor(params: ImportValidationErrorParams);
}

interface ImportValidationErrorParams {
  code: ImportErrorCode;
  message: string;
  details?: string;
}
```

**プロパティ**:

| プロパティ | 型 | 説明 |
|-----------|----|----|
| `code` | ImportErrorCode | エラーコード |
| `message` | string | エラーメッセージ（ユーザー向け） |
| `details` | string? | 詳細情報（開発者向け） |

**例**:

```typescript
throw new ImportValidationError({
  code: 'INVALID_JSON',
  message: 'ファイル形式が正しくありません',
  details: 'SyntaxError: Unexpected token...',
});
```

---

## Summary

このAPI契約により、以下が実現できます：

1. **明確なインターフェース**: 各関数の入力・出力が明確に定義されている
2. **型安全性**: TypeScriptの型システムを活用し、コンパイル時にエラーを検出
3. **エラーハンドリング**: カスタムエラークラスにより、エラーの種類を明確に分類
4. **テスタビリティ**: 各関数が独立しており、ユニットテストが容易
5. **保守性**: 関数の責任が明確で、変更の影響範囲が限定的

次のフェーズ（タスク分解）では、これらの契約に基づいて実装タスクを作成します。
