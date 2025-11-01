# Contract: URL正規化関数

**Date**: 2025-11-01
**Module**: `frontend/src/utils/urlNormalizer.ts`
**Feature**: [spec.md](../spec.md)

## 概要

URL正規化関数の契約（入出力仕様、制約、保証）を定義します。この関数は、RSSフィードのURLマッチング精度を向上させるために使用されます。

## 関数シグネチャ

```typescript
/**
 * URLを正規化して比較可能な形式に変換
 *
 * @param url - 正規化対象のURL文字列
 * @returns 正規化されたURL文字列
 * @throws なし（エラー時は元のURLを返す）
 */
export function normalizeUrl(url: string): string
```

## 入力契約（Preconditions）

### 必須条件

- `url`: 文字列型であること
- `url`: 空文字列でないこと（推奨）

### 推奨条件

- `url`: 有効なURL形式（http/https）
- `url`: 解析可能なURL（`new URL(url)`が成功する）

### 動作仕様

- クエリパラメータは常に保持されます
- ハッシュ（フラグメント）は除外されます

## 出力契約（Postconditions）

### 保証事項

1. **冪等性**: `normalizeUrl(normalizeUrl(url)) === normalizeUrl(url)`
2. **非破壊**: 入力URLは変更されない
3. **エラー安全性**: 例外をスローせず、最悪の場合は元のURLを返す

### 正規化ルール

| 項目 | 変換前 | 変換後 | 備考 |
|-----|-------|-------|-----|
| **プロトコル** | `http://example.com` | `https://example.com` | 常にhttpsに統一 |
| **ドメイン（大文字）** | `https://EXAMPLE.COM` | `https://example.com` | 小文字化 |
| **www prefix** | `https://www.example.com` | `https://example.com` | www除去 |
| **末尾スラッシュ** | `https://example.com/feed/` | `https://example.com/feed` | 末尾スラッシュ除去 |
| **クエリパラメータ** | `https://example.com?id=123` | `https://example.com?id=123` | 保持される |
| **ハッシュ** | `https://example.com#section` | `https://example.com` | ハッシュは除外 |

### 出力形式

- **型**: string
- **形式**: 有効なURL文字列（プロトコル付き）
- **エラー時**: 元のURL文字列（警告ログ付き）

## テストケース

### 正常系

```typescript
// TC-1: プロトコル統一
normalizeUrl('http://example.com')
// => 'https://example.com'

// TC-2: ドメイン小文字化
normalizeUrl('https://EXAMPLE.COM')
// => 'https://example.com'

// TC-3: www prefix除去
normalizeUrl('https://www.example.com/feed')
// => 'https://example.com/feed'

// TC-4: 末尾スラッシュ除去
normalizeUrl('https://example.com/feed/')
// => 'https://example.com/feed'

// TC-5: クエリパラメータは保持される
normalizeUrl('https://example.com/feed?id=123')
// => 'https://example.com/feed?id=123'

// TC-6: 複合ケース
normalizeUrl('http://www.EXAMPLE.com/feed/?utm_source=app')
// => 'https://example.com/feed?utm_source=app'

// TC-7: 冪等性
const url = 'http://www.example.com/feed/'
normalizeUrl(normalizeUrl(url)) === normalizeUrl(url)
// => true
```

### 異常系

```typescript
// TC-8: 無効なURL（エラー時は元のURLを返す）
normalizeUrl('not-a-url')
// => 'not-a-url' (console.warnでログ出力)

// TC-9: 空文字列（エラー時は元のURLを返す）
normalizeUrl('')
// => '' (console.warnでログ出力)

// TC-10: 特殊なプロトコル（ftp, file）
normalizeUrl('ftp://example.com')
// => 'https://example.com' または 'ftp://example.com' (エラー処理)
```

### エッジケース

```typescript
// TC-11: パス付きURL
normalizeUrl('https://example.com/path/to/feed')
// => 'https://example.com/path/to/feed'

// TC-12: ポート番号付きURL
normalizeUrl('https://example.com:8080/feed')
// => 'https://example.com:8080/feed' (ポートは保持)

// TC-13: サブドメイン
normalizeUrl('https://sub.example.com')
// => 'https://sub.example.com' (サブドメインは保持)

// TC-14: IPアドレス
normalizeUrl('http://192.168.1.1')
// => 'https://192.168.1.1'

// TC-15: クエリパラメータ複数
normalizeUrl('https://example.com/feed?a=1&b=2')
// => 'https://example.com/feed?a=1&b=2' (すべて保持)
```

## パフォーマンス契約

### 計算量

- **時間計算量**: O(1) - URL文字列の長さに依存するが、実質的には定数時間
- **空間計算量**: O(1) - 入力URLのコピーのみ

### パフォーマンス目標

- **処理時間**: 1ms以内（1,000回/秒の処理が可能）
- **メモリ**: 1KB以内（URL文字列のコピー）

### ベンチマーク

```typescript
// 1,000回の正規化処理
const iterations = 1000
const urls = [
  'http://www.example.com/feed/',
  'https://EXAMPLE.COM/feed?utm=source',
  'https://example.com/feed'
]

const start = performance.now()
for (let i = 0; i < iterations; i++) {
  urls.forEach(url => normalizeUrl(url))
}
const end = performance.now()

const avgTime = (end - start) / (iterations * urls.length)
// 期待値: avgTime < 0.001ms (1マイクロ秒)
```

## エラーハンドリング

### エラー時の動作

1. **URL解析失敗時**: 元のURLを返す
2. **console.warn()でログ出力**: デバッグ支援
3. **例外スロー禁止**: エラー時も処理を継続

### ログ出力形式

```typescript
console.warn('URL正規化失敗:', url, error)
```

## 不変条件（Invariants）

1. **冪等性**: 何度正規化しても同じ結果
2. **非破壊性**: 入力は変更されない
3. **決定性**: 同じ入力に対して常に同じ出力

## セキュリティ考慮事項

### 安全性

- **XSS対策**: URL文字列の検証（`new URL()`による検証）
- **プロトコル制限**: http/https のみを想定（ftp, file等は除外）

### 脆弱性

- **オープンリダイレクト**: URL正規化自体にはリダイレクトリスクなし
- **SSRF**: バックエンドAPIでの検証が必要（この関数の責任範囲外）

## 使用例

### 基本的な使用

```typescript
import { normalizeUrl } from '@/utils/urlNormalizer'

const userInputUrl = 'http://www.Example.COM/feed/'
const normalized = normalizeUrl(userInputUrl)
// => 'https://example.com/feed'

// マッチング
const feedLink = 'https://example.com/feed'
if (normalizeUrl(userInputUrl) === normalizeUrl(feedLink)) {
  console.log('マッチング成功')
}
```

### クエリパラメータ付きURL

```typescript
// クエリパラメータは常に保持される
const urlWithQuery = 'https://example.com/feed?id=123'
const normalized = normalizeUrl(urlWithQuery)
// => 'https://example.com/feed?id=123'
```

## 参考文献

- [RFC 3986: Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986)
- [WHATWG URL Standard](https://url.spec.whatwg.org/)
- [MDN: URL API](https://developer.mozilla.org/en-US/docs/Web/API/URL)

## 変更履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-11-01 | 1.0.0 | 初版作成 |
