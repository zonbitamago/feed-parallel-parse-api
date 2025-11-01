# Research & Decisions: API応答にfeedUrlフィールド追加

**Feature**: 001-fix-feedurl-api-mismatch
**Phase**: 0 (Research)
**Date**: 2025-11-01

## 調査項目と決定事項

### 1. gofeedライブラリのFeedLink仕様

**調査内容**: gofeedパーサーが提供する`feed.FeedLink`フィールドの信頼性と利用可能性

**調査結果**:
- **feed.FeedLink**: RSSフィードの`<atom:link rel="self">`から取得される実際のRSSフィードURL
- **feed.Link**: RSSフィードの`<link>`から取得されるホームページURL
- **データソース**:
  - RSS 2.0: `<atom:link rel="self" href="..."/>` → `feed.FeedLink`
  - Atom: `<link rel="self" href="..."/>` → `feed.FeedLink`
  - RSS 1.0: 通常`feed.FeedLink`は空、フォールバックが必要

**決定事項**:
- ✅ **採用**: `feed.FeedLink`を主要なデータソースとして使用
- ✅ **フォールバック**: `feed.FeedLink`が空の場合、元々リクエストされたURLを使用

**根拠**:
- gofeedは広く使われているGoの標準RSSパーサー（GitHub stars: 2.5k+）
- `feed.FeedLink`はRFC 4287（Atom）とRSS 2.0仕様に準拠
- 実際のRSSフィード（Rebuild.fm等）で`feed.FeedLink`が正しく設定されていることを確認済み

**代替案と却下理由**:
- ❌ リクエストURLのみ使用: リダイレクトやエイリアスURLがある場合に不正確
- ❌ カスタムパーサー: gofeedで十分、車輪の再発明

---

### 2. 後方互換性の影響分析

**調査内容**: 既存の`link`フィールドを維持する必要性

**調査結果**:
- **現在の利用箇所**:
  - フロントエンド: `useFeedAPI.ts`の`findMatchingFeed`関数（31行目）で`f.link`を使用
  - その他: 現時点で`link`フィールドを直接使用している箇所は発見されず
- **影響範囲**:
  - API応答スキーマに`feedUrl`フィールドを追加しても、`link`を削除しない限り既存機能は壊れない
  - デプロイ順序: バックエンド → フロントエンドの順でデプロイすれば、移行期間中も動作する

**決定事項**:
- ✅ **`link`フィールドは維持**: 後方互換性のため削除しない
- ✅ **`feedUrl`フィールドを追加**: 新規フィールドとして追加
- ✅ **段階的移行**: フロントエンドは`f.link`から`f.feedUrl`に変更

**根拠**:
- 他のシステムやツールが`link`フィールドに依存している可能性（調査範囲外）
- JSONフィールド追加は破壊的変更ではない（既存クライアントは無視できる）
- 将来的に`link`フィールドを削除する場合も、deprecation期間を設けられる

**代替案と却下理由**:
- ❌ `link`フィールドを`feedUrl`に置き換え: 破壊的変更、リスクが高い
- ❌ `link`の値を実際のRSS URLに変更: 既存機能が壊れる可能性

---

### 3. フロントエンドのURL正規化互換性

**調査内容**: PR #17で実装されたURL正規化ロジックとの互換性

**調査結果**:
- **実装箇所**: `frontend/src/utils/urlNormalizer.ts`
- **正規化ルール**:
  1. 末尾スラッシュを削除
  2. プロトコル（http/https）を統一
  3. www prefixを削除
  4. ドメインを小文字に変換
- **テストカバレッジ**: `urlNormalizer.test.ts`に10テストケース（PR #17で追加）

**決定事項**:
- ✅ **URL正規化ロジックは変更不要**: `feedUrl`にも同じ正規化を適用
- ✅ **マッチングロジックの修正のみ**: `f.link`を`f.feedUrl`に変更するだけ

**根拠**:
- `normalizeUrl()`関数は既にテスト済み（10テストケース）
- `feedUrl`も同じURL形式なので、既存の正規化ロジックが適用可能
- 新規のURL正規化ロジックは不要（YAGNI原則）

**代替案と却下理由**:
- ❌ `feedUrl`専用の正規化関数: 重複コード、不要な複雑さ
- ❌ 正規化ロジックの変更: スコープ外、既存機能を壊すリスク

---

### 4. テスト戦略とカバレッジ目標

**調査内容**: TDD原則に基づくテスト戦略の設計

**決定事項**:

#### Backend（Go）
- **Unit Tests**:
  - `tests/unit/rss_model_test.go`: `FeedURL`フィールドの存在確認、JSONマーシャリング検証
  - `tests/unit/rss_service_test.go`: `feed.FeedLink` → `FeedURL`マッピングテスト、フォールバックロジックテスト
- **Contract Tests**:
  - `tests/contract/parse_api_test.go`: API応答に`feedUrl`フィールドが含まれることを検証

#### Frontend（TypeScript）
- **Unit Tests**:
  - `frontend/src/types/api.ts`: TypeScript型定義テスト（コンパイル時チェック）
  - `frontend/src/hooks/useFeedAPI.test.ts`: `feedUrl`を使用したマッチングロジックのテスト
- **Integration Tests**:
  - `frontend/tests/integration/searchFlow.test.tsx`: MSWモックに`feedUrl`追加、E2Eフロー確認

#### カバレッジ目標
- Backend新規コード: 100%
- Frontend新規コード: 100%
- 既存テスト: 全てパス（回帰テスト）

**根拠**:
- Constitution: TDD原則に基づくテストファースト
- テストピラミッド: Unit 70%, Integration 20%, E2E 10%
- 品質基準: 新規コードは100%カバレッジ

---

### 5. デプロイ戦略とリスク軽減

**調査内容**: バックエンドとフロントエンドの同時デプロイ戦略

**決定事項**:
- ✅ **デプロイ順序**: バックエンド → フロントエンド
  1. バックエンドデプロイ: `feedUrl`フィールド追加（既存`link`も維持）
  2. 検証: API応答に`feedUrl`が含まれることを確認
  3. フロントエンドデプロイ: `f.link`を`f.feedUrl`に変更
  4. 検証: Rebuild.fmで記事が表示されることを確認

- ✅ **ロールバック戦略**:
  - フロントエンドでエラーが発生した場合: フロントエンドのみロールバック（`f.feedUrl`を`f.link`に戻す）
  - バックエンドはロールバック不要（`link`フィールドを維持しているため）

**根拠**:
- Vercel serverless functionsは即座にデプロイ可能
- フロントエンドはVercel上で段階的ロールアウト可能
- `feedUrl`フィールド追加は非破壊的変更

**代替案と却下理由**:
- ❌ フィーチャーフラグ: 小規模な変更に対してオーバーエンジニアリング
- ❌ カナリアデプロイ: 本番ユーザーが少数のため、必要性低い

---

## 技術的前提条件の確認

### ✅ 確認済み項目

1. **gofeed バージョン**: 現在使用中のバージョンで`feed.FeedLink`が利用可能
2. **TypeScript strict mode**: `frontend/tsconfig.json`で`"strict": true`が有効
3. **既存テスト**: Backend 10テスト、Frontend 188テスト（全てパス）
4. **CI/CD**: GitHub Actionsでテスト自動実行（`.github/workflows/`）

### ⚠️ 注意事項

1. **RSS 1.0フィード**: `feed.FeedLink`が空の場合が多い → フォールバックロジック必須
2. **URL正規化**: 既存の`normalizeUrl()`関数に依存 → 変更不可
3. **モックデータ**: 全てのテストで`feedUrl`フィールドを追加する必要がある

---

## 次のステップ（Phase 1）

Phase 0の調査結果に基づき、Phase 1では以下を実施:

1. **data-model.md**: `RSSFeed`エンティティの詳細設計
2. **contracts/api-schema.json**: API契約の更新（OpenAPI 3.0形式）
3. **quickstart.md**: 開発者向けクイックスタートガイド
4. **エージェントコンテキスト更新**: CLAUDE.mdに技術スタック追加
