# Research: 複数RSSフィード登録時のURL/タイトル不一致バグ修正

**Date**: 2025-11-01
**Feature**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

## 1. 問題の根本原因分析

### 現在の実装（useFeedAPI.ts:20-26）

```typescript
function findMatchingFeed(
  subscription: Subscription,
  feeds: RSSFeed[],
  subscriptionIndex: number
): RSSFeed | undefined {
  return feeds.find(f => f.link === subscription.url) || feeds[subscriptionIndex]
  //                                                      ^^^^^^^^^^^^^^^^^^^^^^
  //                                                      危険なフォールバック
}
```

### 問題点

1. **URLマッチングが失敗した場合**、インデックスでフォールバック
2. **API応答の順序が購読リストと異なる**場合、誤ったフィードとマッチング
3. **並列処理による順序不定**が原因で、3個目以降で頻発

### 再現シナリオ

```text
購読リスト:
[0] https://example.com/feed1 → 期待: "フィード1"
[1] https://example.com/feed2 → 期待: "フィード2"
[2] https://example.com/feed3 → 期待: "フィード3"

API応答（順序が異なる）:
feeds[0] = { link: "https://example.com/feed2", title: "フィード2" }
feeds[1] = { link: "https://example.com/feed3", title: "フィード3" }
feeds[2] = { link: "https://example.com/feed1", title: "フィード1" }

結果（URLマッチング失敗時）:
subscription[0] → feeds[0] → "フィード2"が表示（誤り）
subscription[1] → feeds[1] → "フィード3"が表示（誤り）
subscription[2] → feeds[2] → "フィード1"が表示（誤り）
```

## 2. URL正規化のベストプラクティス

### Decision: URL正規化戦略

**選択**: シンプルなURL正規化関数を実装（YAGNI原則に基づく）

### Rationale

1. **プロトコル統一**: http → https（多くのフィードがリダイレクト）
2. **末尾スラッシュ除去**: `https://example.com/feed/` → `https://example.com/feed`
3. **クエリパラメータ保持**: URLの完全性を維持するため、クエリパラメータは保持する
4. **小文字変換**: ドメイン部分のみ小文字化
5. **www prefix除去**: `www.example.com` → `example.com`

### Alternatives Considered

1. **外部ライブラリ（normalize-url）**
   - **却下理由**: バンドルサイズ増加（~10KB）、過剰な機能
   - **必要性**: シンプルな正規化で十分

2. **完全なURL正規化（RFC 3986準拠）**
   - **却下理由**: 過剰設計、パフォーマンスオーバーヘッド
   - **必要性**: RSSフィードのURLは比較的単純

3. **正規化なし（完全一致のみ）**
   - **却下理由**: ユーザー体験の低下、マッチング失敗率が高い
   - **必要性**: 多様なURL形式に対応する必要

### 実装方針

```typescript
// frontend/src/utils/urlNormalizer.ts

/**
 * URLを正規化して比較可能な形式に変換
 *
 * 正規化ルール:
 * 1. プロトコルをhttpsに統一
 * 2. ドメインを小文字化
 * 3. www prefixを除去
 * 4. 末尾スラッシュを除去
 * 5. クエリパラメータは保持
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)

    // 1. プロトコル統一
    urlObj.protocol = 'https:'

    // 2. ドメイン小文字化 + www除去
    urlObj.hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '')

    // 3. 末尾スラッシュ除去
    let normalized = urlObj.toString()
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1)
    }

    return normalized
  } catch (error) {
    // URL解析失敗時は元のURLを返す
    console.warn('URL正規化失敗:', url, error)
    return url
  }
}
```

## 3. エラーハンドリング戦略

### Decision: マッチング失敗時の処理

**選択**: マッチング失敗時は既存のタイトルを保持し、ログ出力

### Rationale

1. **データ整合性**: 誤ったタイトルを表示しない
2. **デバッグ支援**: ログ出力で問題を特定可能
3. **ユーザー体験**: フォールバック値（URLまたは前回のタイトル）を表示

### 実装方針

```typescript
function findMatchingFeed(
  subscription: Subscription,
  feeds: RSSFeed[]
): RSSFeed | undefined {
  const normalizedSubUrl = normalizeUrl(subscription.url)

  const matched = feeds.find(f => {
    const normalizedFeedLink = normalizeUrl(f.link)
    return normalizedFeedLink === normalizedSubUrl
  })

  if (!matched) {
    console.warn(
      `フィードマッチング失敗: ${subscription.url}`,
      `正規化URL: ${normalizedSubUrl}`,
      `利用可能なフィード:`, feeds.map(f => normalizeUrl(f.link))
    )
  }

  return matched
}
```

## 4. テスト戦略

### Decision: TDDによる段階的実装

**テストの優先順位**:

1. **P1: URL正規化関数のテスト**（基盤）
   - プロトコル統一
   - 末尾スラッシュ除去
   - クエリパラメータ除外
   - ドメイン小文字化
   - www prefix除去
   - エラーハンドリング

2. **P1: findMatchingFeed関数のテスト**（コア機能）
   - URL正規化によるマッチング成功
   - マッチング失敗時の動作
   - API応答順序が異なる場合
   - 空の配列、nullチェック

3. **P2: useFeedAPIフックの統合テスト**
   - 複数フィード登録（3個以上）
   - API応答順序が異なる場合
   - マッチング失敗時のタイトル保持

4. **P3: E2Eテスト**（オプション）
   - 実際のフィード登録フロー
   - ページリロード後の永続化確認

### テストカバレッジ目標

- URL正規化関数: **100%**
- findMatchingFeed関数: **100%**
- useFeedAPI全体: **90%以上**（既存部分を含む）

## 5. パフォーマンス考慮事項

### Decision: URL正規化のパフォーマンス最適化

**選択**: メモ化なし、シンプルな実装

### Rationale

1. **頻度**: フィード取得時のみ実行（低頻度）
2. **コスト**: URL正規化は1ms以下の軽量処理
3. **シンプルさ**: メモ化は過剰設計（YAGNI）

### パフォーマンス目標

- URL正規化: **1ms以内**
- findMatchingFeed: **10ms以内**（10件のフィード）
- フィード取得全体: **10秒以内**（既存と同じ）

## 6. リスク評価

### 高リスク

なし

### 中リスク

1. **URL正規化の副作用**
   - **リスク**: 正規化により本来異なるURLが同一と判定される
   - **対策**: 最小限の正規化ルール、テストで検証
   - **確率**: 低（RSSフィードのURLは比較的単純）

2. **既存データとの互換性**
   - **リスク**: localStorageの既存データが影響を受ける
   - **対策**: データ構造は変更しない、タイトルのみ更新
   - **確率**: 低（既存のSubscription型をそのまま使用）

### 低リスク

1. **パフォーマンス劣化**
   - **リスク**: URL正規化によるオーバーヘッド
   - **対策**: シンプルな実装、1ms以内の処理時間
   - **確率**: 極めて低

## 7. 実装順序

### TDDサイクルに基づく実装順序

1. **Red**: URL正規化のテストを書く（失敗することを確認）
2. **Green**: URL正規化を実装（テストを通す）
3. **Refactor**: URL正規化をリファクタリング

4. **Red**: findMatchingFeedのテストを書く（失敗することを確認）
5. **Green**: findMatchingFeedを修正（インデックスフォールバック削除）
6. **Refactor**: findMatchingFeedをリファクタリング

7. **Red**: useFeedAPIの統合テストを書く（失敗することを確認）
8. **Green**: useFeedAPIを修正（正規化URLを使用）
9. **Refactor**: useFeedAPIをリファクタリング

10. **最終確認**: 全テストの実行、カバレッジ確認

## 8. 参考資料

- [RFC 3986: Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986)
- [WHATWG URL Standard](https://url.spec.whatwg.org/)
- [MDN: URL API](https://developer.mozilla.org/en-US/docs/Web/API/URL)
- Kent Beck『Test Driven Development: By Example』
- 和田卓人『テスト駆動開発』

## まとめ

**調査完了**: すべての技術的な不明点が解決されました。

**次のフェーズ**: Phase 1（Design & Contracts）に進むことができます。
