# Implementation Plan: API応答にfeedUrlフィールド追加によるマッチング精度改善

**Branch**: `001-fix-feedurl-api-mismatch` | **Date**: 2025-11-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-fix-feedurl-api-mismatch/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

PR #17マージ後、RSSフィードの記事が一切表示されなくなった本番バグの修正。根本原因は、APIが`feed.link`（ホームページURL）のみを返しており、実際のRSSフィードURL（`feed.FeedLink`）を返していないこと。これにより、フロントエンドのURL正規化マッチングが機能せず、登録したフィードと記事が紐付かない。

**技術的アプローチ**:
1. バックエンド（Go）: `RSSFeed`モデルに`FeedURL`フィールド追加、gofeedの`feed.FeedLink`から値を取得
2. フロントエンド（TypeScript）: `RSSFeed`型に`feedUrl`フィールド追加、マッチングロジックで`f.feedUrl`を使用
3. 後方互換性: 既存の`link`フィールドは維持

## Technical Context

**Language/Version**:
- Backend: Go 1.25.1
- Frontend: TypeScript 5.9.3, Node.js 25.0.0

**Primary Dependencies**:
- Backend: github.com/mmcdole/gofeed (RSSパーサー), Vercel serverless functions
- Frontend: React 19.1.1, Vite 7.1.7, date-fns 4.1.0, TailwindCSS 4.1.16

**Storage**:
- Backend: N/A（ステートレスAPI）
- Frontend: localStorage（購読情報の永続化）

**Testing**:
- Backend: Go標準のtesting + github.com/stretchr/testify (tests/unit/, tests/integration/, tests/contract/)
- Frontend: Vitest 4.0.3, @testing-library/react 16.3.0, MSW 2.11.6 (モック)

**Target Platform**:
- Backend: Vercel Serverless Functions（Linux runtime）
- Frontend: モダンブラウザ（Chrome, Firefox, Safari最新版）、PWA対応

**Project Type**: Web application（フロントエンド + バックエンドAPI）

**Performance Goals**:
- API応答時間: <2秒（複数フィードの並列パース）
- フロントエンド初回レンダリング: <1秒
- フィードマッチング: 100%の精度（URL正規化込み）

**Constraints**:
- 後方互換性: 既存の`link`フィールドを維持（他の機能で使用されている可能性）
- ゼロダウンタイム: バックエンドとフロントエンドは同時デプロイ
- 既存テスト: 全テストが継続してパスする必要がある

**Scale/Scope**:
- 対象ファイル: 6ファイル（Backend: 3, Frontend: 3）
- 影響範囲: API応答スキーマ、型定義、マッチングロジック
- テスト: 既存テスト更新 + 新規テスト追加（約10-15テストケース）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Test-Driven Development (TDD) - 絶対遵守

**適用方法**:
- **Red-Green-Refactor サイクル**: 全ての変更（Backend + Frontend）でTDDサイクルを厳守
  1. Red: 失敗するテストを先に書く（例: `feedUrl`フィールドがないことをテストで確認）
  2. Green: 最小限の実装でテストを通す（`FeedURL`フィールド追加）
  3. Refactor: コード品質を向上（重複排除、命名改善）

- **テストファースト**: 1行のプロダクションコードも、失敗するテストなしには書かない
  - Backend: `pkg/models/rss.go`修正前に`tests/unit/rss_model_test.go`を更新
  - Frontend: `types/api.ts`修正前に型テストを追加

- **小さく確実に進む（ベイビーステップ）**: 5-10分で完了するタスクに分割
  - タスク1: Backend型定義のテスト（Red）
  - タスク2: Backend型定義の実装（Green）
  - タスク3: Backend型定義のリファクタリング（Refactor）
  - ...以下同様にFrontendでも実施

**watchモード禁止**: 実装時は`npm test`（1回限り実行）を使用し、CPU負荷を抑える

### ✅ テストカバレッジと品質基準

**新規コードカバレッジ**: 100%を目指す
- Backend: `pkg/models/rss.go`, `pkg/services/rss_service.go`の変更部分
- Frontend: `types/api.ts`, `hooks/useFeedAPI.ts`の変更部分

**テストピラミッド**:
- Unit Tests（70%）: モデル、サービス、フック単位のテスト
- Integration Tests（20%）: API契約テスト（`feedUrl`フィールドの存在確認）
- E2E Tests（10%）: 実際のRSSフィード（Rebuild.fm）での動作確認

### ✅ TypeScript品質基準（Frontend）

- **型安全性**: `any`禁止、`strict: true`遵守
- **Props型定義**: `RSSFeed`インターフェースに`feedUrl: string`を明示的に定義
- **テスト可能性**: マッチングロジックは純粋関数として実装済み（変更箇所のみテスト）

### ✅ コードレビュー基準

- [x] テストファーストの遵守: テストコミットが実装コミットより先
- [x] TDDサイクル: Red→Green→Refactor の履歴が確認できる
- [x] カバレッジ: 新規コードのカバレッジが100%
- [x] 型安全性: TypeScriptの型チェックがすべてパス
- [x] リンター: ESLint, Prettier の警告ゼロ

### ✅ シンプルさの原則（YAGNI）

- **必要最小限の変更**: `feedUrl`フィールドのみ追加、他の拡張は行わない
- **過剰設計の禁止**: 将来のフィールド追加のための抽象化は行わない
- **既存機能の維持**: `link`フィールドは削除せず、後方互換性を保つ

### Constitution Check結果

**判定**: ✅ **合格** - TDD原則に完全準拠した実装計画

**違反なし**: この機能はシンプルなフィールド追加であり、TDDサイクルで段階的に実装可能

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Backend（Go）
pkg/
├── models/
│   └── rss.go                  # 🔴 変更: FeedURL フィールド追加
├── services/
│   └── rss_service.go          # 🔴 変更: feed.FeedLink から FeedURL を設定
└── lib/
    ├── error.go
    └── log.go

api/
└── parse.go                     # 変更なし（handler層）

tests/
├── unit/
│   ├── rss_model_test.go       # 🔴 変更: FeedURL フィールドのテスト追加
│   └── rss_service_test.go     # 🔴 変更: FeedLink→FeedURL マッピングテスト追加
├── integration/
│   └── error_test.go           # 変更なし
└── contract/
    └── parse_api_test.go       # 🔴 変更: API契約に feedUrl フィールド追加確認

# Frontend（TypeScript + React）
frontend/src/
├── types/
│   └── api.ts                  # 🔴 変更: RSSFeed に feedUrl フィールド追加
├── hooks/
│   ├── useFeedAPI.ts           # 🔴 変更: f.link → f.feedUrl に変更
│   └── useFeedAPI.test.ts      # 🔴 変更: feedUrl を使用したテストケース追加
├── services/
│   └── feedAPI.ts              # 変更なし（型定義のみ影響）
└── utils/
    └── urlNormalizer.ts        # 変更なし（既存機能）

frontend/tests/
└── integration/
    └── searchFlow.test.tsx      # 🔴 変更: MSWモックに feedUrl 追加
```

**Structure Decision**: Web application（Option 2相当）

- **Backend**: Goのパッケージベース構造（`pkg/`）+ Vercel serverless functions（`api/`）
- **Frontend**: React + TypeScript、機能別ディレクトリ構造（`types/`, `hooks/`, `services/`, `utils/`）
- **Testing**: Backend（`tests/unit/`, `tests/integration/`, `tests/contract/`）、Frontend（各ディレクトリ内に`.test.ts`）

## Complexity Tracking

**該当なし**: Constitution Checkに違反なし。シンプルなフィールド追加のみで、過剰な複雑さは導入しない。

---

## Phase 0: Research Findings

**ステータス**: ✅ 完了

**成果物**: [research.md](./research.md)

### 主要な決定事項

1. **gofeed.FeedLinkの採用**: `feed.FeedLink`を主要なデータソースとし、空の場合はリクエストURLにフォールバック
2. **後方互換性の維持**: 既存の`link`フィールドは削除せず、`feedUrl`を追加
3. **URL正規化の再利用**: PR #17の`normalizeUrl()`関数をそのまま使用、新規ロジック不要
4. **TDD戦略**: Backend 100%カバレッジ、Frontend 100%カバレッジを目標
5. **デプロイ順序**: Backend → Frontend（非破壊的変更のため安全）

### 技術的前提条件

- ✅ gofeedで`feed.FeedLink`が利用可能
- ✅ TypeScript strict mode有効
- ✅ 既存テスト全てパス（Backend 10テスト、Frontend 188テスト）
- ✅ CI/CD（GitHub Actions）で自動テスト実行

---

## Phase 1: Design Artifacts

**ステータス**: ✅ 完了

**成果物**:
- [data-model.md](./data-model.md) - エンティティ詳細設計
- [contracts/api-schema.json](./contracts/api-schema.json) - OpenAPI 3.0契約書
- [quickstart.md](./quickstart.md) - 開発者向けクイックスタート

### データモデル設計

#### Backend（Go）

```go
type RSSFeed struct {
    Title    string    `json:"title"`
    Link     string    `json:"link"`     // ホームページURL（既存）
    FeedURL  string    `json:"feedUrl"`  // 実際のRSSフィードURL（新規）
    Articles []Article `json:"articles"`
}
```

**マッピングロジック**:
```go
feedURL := feed.FeedLink
if feedURL == "" {
    feedURL = requestedURL  // フォールバック
}
```

#### Frontend（TypeScript）

```typescript
export interface RSSFeed {
  title: string;
  link: string;       // ホームページURL（既存）
  feedUrl: string;    // 実際のRSSフィードURL（新規）
  articles: APIArticle[];
}
```

**マッチングロジック変更**:
```typescript
// 変更前
const matchedFeed = feeds.find(f => normalizeUrl(f.link) === normalizedSubscriptionUrl)

// 変更後
const matchedFeed = feeds.find(f => normalizeUrl(f.feedUrl) === normalizedSubscriptionUrl)
```

### API契約（OpenAPI 3.0）

**バージョン**: 1.1.0（`feedUrl`フィールド追加）

**主要変更点**:
- `RSSFeed`スキーマに`feedUrl`フィールド追加（必須）
- 既存の`link`フィールドは維持（後方互換性）
- レスポンス例を更新（Rebuild.fmの実データ）

### TDD実装ガイド

**所要時間**: 約2-3時間

**TDDサイクル数**: 10サイクル（Backend 5回 + Frontend 5回）

**チェックポイント**:
1. Backend: モデル定義（Red → Green → Refactor）
2. Backend: サービス層（Red → Green → Refactor）
3. Frontend: 型定義（Red → Green → Refactor）
4. Frontend: マッチングロジック（Red → Green → Refactor）
5. 統合テスト（Backend + Frontend）

---

## Next Steps: Phase 2 (Task Generation)

Phase 1の設計成果物に基づき、次のコマンドで詳細なタスクリストを生成:

```bash
/speckit.tasks
```

**生成されるタスク内容**:
- TDDサイクルごとの具体的なタスク（Red/Green/Refactor）
- 依存関係の順序付け
- 各タスクの所要時間見積もり
- テストケース一覧
- デプロイチェックリスト

**実装開始条件**:
- ✅ Constitution Check合格
- ✅ Phase 0: Research完了
- ✅ Phase 1: Design完了
- ✅ 全成果物がレビュー済み

---

## Summary

**Feature**: API応答にfeedUrlフィールド追加によるマッチング精度改善
**Branch**: `001-fix-feedurl-api-mismatch`
**Status**: 設計完了、実装準備完了

**主要成果物**:
- ✅ [spec.md](./spec.md) - 機能仕様書
- ✅ [research.md](./research.md) - 技術調査結果
- ✅ [data-model.md](./data-model.md) - データモデル設計
- ✅ [contracts/api-schema.json](./contracts/api-schema.json) - API契約書
- ✅ [quickstart.md](./quickstart.md) - 実装ガイド
- ✅ plan.md（このファイル） - 実装計画

**次のアクション**: `/speckit.tasks`でタスク生成 → TDD実装開始
