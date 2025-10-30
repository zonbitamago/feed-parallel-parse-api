# Research: フィードプレビュー取得時のAbortController処理修正

**Feature**: 010-fix-feed-preview
**Date**: 2025-10-31
**Status**: Completed

## Research Summary

このバグ修正のための技術調査を実施しました。主な調査項目は、AbortController APIの仕様、エラーハンドリングのベストプラクティス、および既存コードの動作分析です。

## 1. AbortController API仕様の確認

### Decision
AbortController APIは標準的な方法でリクエストキャンセルを管理します。外部からのAbortSignalと内部タイムアウトを区別するには、フラグベースのアプローチを採用します。

### Rationale
- **標準API**: AbortControllerはすべてのモダンブラウザでサポートされており、追加の依存関係が不要
- **エラー区別の必要性**: AbortErrorの原因（外部キャンセル vs タイムアウト）を区別することで、適切なエラーハンドリングが可能
- **フラグベース**: 外部AbortSignalのaddEventListenerでフラグを立てる方法がシンプルで明確

### Alternatives Considered
1. **カスタムエラークラス**: 複雑で過剰設計
2. **Promiseラッパー**: 既存コードの大幅な変更が必要
3. **タイムスタンプ比較**: 不正確でレースコンディションのリスク

### Implementation Approach
```typescript
// 外部からのAbortSignalでキャンセルされたかどうかを追跡
let externalAbort = false;

if (options?.signal) {
  options.signal.addEventListener('abort', () => {
    externalAbort = true;
    controller.abort();
  });
}

// エラーハンドリング時にフラグをチェック
if (error instanceof Error && error.name === 'AbortError') {
  if (externalAbort) {
    throw error; // AbortErrorをそのまま再スロー
  }
  throw new FeedAPIError('APIリクエストがタイムアウトしました', error);
}
```

## 2. 既存コードの動作分析

### Current Issue
`feedAPI.ts`の`parseFeeds`関数は、すべてのAbortErrorを`FeedAPIError`でラップしています。これにより、`useFeedPreview.ts`でのAbortError無視処理（デバウンス時のキャンセル）が機能していません。

**問題のコード（feedAPI.ts:48-50）**:
```typescript
if (error instanceof Error && error.name === 'AbortError') {
  throw new FeedAPIError('APIリクエストがタイムアウトしました', error);
}
```

**影響を受けるコード（useFeedPreview.ts:122-125）**:
```typescript
// AbortErrorは無視（意図的なキャンセル）
if (error instanceof Error && error.name === 'AbortError') {
  return
}
```

### Root Cause
`FeedAPIError`でラップされたAbortErrorは、`error.name`が`'FeedAPIError'`になるため、`useFeedPreview`のAbortError無視処理が動作しません。

### Required Fix
外部からのAbortSignalによるキャンセルの場合は、AbortErrorをラップせずにそのまま再スローする必要があります。

## 3. テストケースの確認

### Existing Tests
`useFeedPreview.test.ts`には以下のテストケースが存在します：
- プレビュー取得成功
- デバウンス処理（連続入力時のAPI呼び出し削減）
- 無効URL/ネットワークエラー
- プレビューのクリア
- 空文字入力

### Missing Test Cases
現在のテストでは、以下のシナリオがカバーされていません：
1. **外部AbortSignalによるキャンセル**: デバウンス処理で古いリクエストがキャンセルされる動作
2. **タイムアウトエラー**: 10秒のタイムアウトが発生した場合のエラー表示

これらのテストケースを追加する必要があります。

## 4. エラーハンドリングのベストプラクティス

### Decision
エラーの原因に応じて、適切なエラータイプを使い分けます：
- **意図的なキャンセル**: AbortErrorをそのまま伝播（呼び出し側で無視）
- **タイムアウト**: FeedAPIErrorでラップ（ユーザーにエラー表示）

### Rationale
- **明確な意図**: エラータイプで処理方法が明確
- **デバッグ性**: エラーの原因がログから特定しやすい
- **拡張性**: 将来的に別のキャンセル理由を追加しやすい

### Alternatives Considered
1. **すべてAbortErrorとして扱う**: タイムアウトとキャンセルの区別ができない
2. **カスタムエラーコード**: 複雑で過剰設計
3. **ステータスフィールド**: エラークラスの責務を超える

## 5. パフォーマンスへの影響

### Analysis
この修正はパフォーマンスにほぼ影響しません：
- **追加コスト**: フラグ変数1つとイベントリスナー1つのみ
- **メモリ使用量**: 無視できるレベル（数バイト）
- **実行速度**: イベントリスナーの登録/解除はマイクロ秒単位

### Measurement
既存のテストスイートで、修正前後のテスト実行時間を比較します。有意な差（>5%）がないことを確認します。

## 6. 後方互換性

### Impact Assessment
この修正は既存の動作に影響を与えません：
- ✅ **外部キャンセルの場合**: 新しい動作（AbortErrorそのまま再スロー）
- ✅ **タイムアウトの場合**: 既存の動作（FeedAPIErrorでラップ）を維持
- ✅ **fetchFeedTitle関数**: 影響なし（外部AbortSignalを使用しない）

### Migration Strategy
移行作業は不要です。既存のテストがすべてパスすることを確認するのみです。

## Implementation Checklist

- [ ] feedAPI.tsのparseFeeds関数を修正
  - [ ] 外部AbortSignalトラッキング用のフラグを追加
  - [ ] AbortErrorハンドリングロジックを更新
- [ ] テストケースの追加（必要に応じて）
  - [ ] 外部AbortSignalによるキャンセルのテスト
  - [ ] タイムアウトエラーのテスト
- [ ] 既存テストの実行と確認
  - [ ] useFeedPreview.test.ts: すべてパス
  - [ ] feedAPI.test.ts: すべてパス（存在する場合）
- [ ] 手動テスト
  - [ ] 1件目のフィード追加: プレビュー表示
  - [ ] 2件目のフィード追加: プレビュー表示
  - [ ] URL連続変更: デバウンス動作確認

## References

- [MDN Web Docs: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [MDN Web Docs: AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- [JavaScript.info: Fetch Abort](https://javascript.info/fetch-abort)
- プロジェクトconstitution: `.specify/memory/constitution.md`
- 既存実装: `frontend/src/services/feedAPI.ts`
- 既存テスト: `frontend/src/hooks/useFeedPreview.test.ts`
