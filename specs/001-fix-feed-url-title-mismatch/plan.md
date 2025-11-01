# Implementation Plan: 複数RSSフィード登録時のURL/タイトル不一致バグ修正

**Branch**: `001-fix-feed-url-title-mismatch` | **Date**: 2025-11-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-fix-feed-url-title-mismatch/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

複数のRSSフィードを登録した際に、3個目以降のフィードでURLとタイトルの組み合わせが誤って表示されるバグを修正する。根本原因は`useFeedAPI.ts`の`findMatchingFeed`関数における危険なインデックスフォールバック処理（`feeds[subscriptionIndex]`）であり、API応答の順序が購読リストと異なる場合に誤ったマッチングが発生する。

**技術的アプローチ**:

1. URL正規化関数を実装（プロトコル、末尾スラッシュ、www prefix、ドメイン大文字小文字の統一）
2. インデックスフォールバックを削除し、URL完全一致のみでマッチング
3. マッチング失敗時の適切なエラーハンドリングとログ出力
4. TDD（Test-Driven Development）によるリグレッション防止

**注意**: クエリパラメータは保持します（除外しません）

## Technical Context

**Language/Version**: TypeScript 5.9.3
**Primary Dependencies**: React 19.1.1, Vitest 4.0.3, @testing-library/react 16.3.0
**Storage**: localStorage（ブラウザAPI）
**Testing**: Vitest 4.0.3 + @testing-library/react 16.3.0
**Target Platform**: Web（モダンブラウザ）
**Project Type**: Web application（Frontend + Backend）
**Performance Goals**: フィード取得は10秒以内、URL正規化は1ms以内
**Constraints**: ブラウザのローカルストレージ容量制限（通常5-10MB）
**Scale/Scope**: 数十件のフィード購読、数百記事の表示

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 必須原則の確認

#### I. Test-Driven Development（TDD）- 絶対遵守

- [x] **テストファースト**: 実装前にテストを書く
  - URL正規化関数のテストを先に作成
  - `findMatchingFeed`のテストを先に作成
- [x] **Red-Green-Refactor サイクル**
  - Red: 失敗するテストを書く
  - Green: 最小限の実装でテストを通す
  - Refactor: コードの品質を向上
- [x] **小さく確実に進む**: 5-10分のベイビーステップ
- [x] **テスト実行ルール**: watchモード禁止、`npm test`を使用

#### II. テストカバレッジと品質基準

- [x] **新規コード**: 100%のカバレッジを目指す
  - URL正規化関数: 100%
  - 修正後の`findMatchingFeed`: 100%
- [x] **既存コード変更**: 変更部分は100%カバー
- [x] **最低基準**: プロジェクト全体で80%以上維持

#### III. TypeScript + React の品質基準

- [x] **any禁止**: `any`型の使用禁止（`unknown`を使用）
- [x] **strict mode**: `tsconfig.json`で`"strict": true`
- [x] **型定義**: すべての関数、変数に明示的な型定義
- [x] **テスト可能性**: カスタムフックのテスト、依存性注入

#### IV. コードレビュー基準

- [x] **テストファーストの遵守**: テストコミットが実装コミットより先
- [x] **TDDサイクル**: Red→Green→Refactor の履歴
- [x] **カバレッジ**: 新規コードのカバレッジが100%
- [x] **型安全性**: TypeScriptの型チェックがすべてパス
- [x] **リンター**: ESLint, Prettier の警告ゼロ

#### V. シンプルさの原則（YAGNI）

- [x] **必要になるまで作らない**: 現在の要求を満たす最小限の設計
- [x] **過剰設計の禁止**: URL正規化は必要最小限の機能のみ
- [x] **リファクタリングで進化**: 必要になったら設計を改善

### Phase 0後の評価結果

✅ **全てのゲートをパス** - Phase 0研究完了後も憲法違反なし。

### Phase 1後の再評価

✅ **全てのゲートをパス** - Phase 1設計完了後も憲法違反なし。

**確認事項**:
- データモデル変更なし（既存のSubscription, RSSFeedをそのまま使用）
- 新規依存関係なし（標準のURL APIのみ使用）
- テストカバレッジ目標: 100%（URL正規化関数、findMatchingFeed関数）
- TDDサイクル遵守: Red→Green→Refactor

## Project Structure

### Documentation (this feature)

```text
specs/001-fix-feed-url-title-mismatch/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   └── FeedManager/
│   │       └── FeedManager.tsx        # フィード管理UI（影響箇所）
│   ├── containers/
│   │   └── FeedContainer.tsx          # フィード購読管理（影響箇所）
│   ├── hooks/
│   │   └── useFeedAPI.ts              # **修正対象**: findMatchingFeed関数
│   ├── utils/
│   │   └── urlNormalizer.ts           # **新規追加**: URL正規化関数
│   ├── types/
│   │   ├── models.ts                  # Subscription, Article型定義
│   │   └── api.ts                     # RSSFeed, APIArticle型定義
│   └── services/
│       └── feedAPI.ts                 # バックエンドAPI呼び出し
└── tests/
    ├── unit/
    │   ├── useFeedAPI.test.ts         # **修正対象**: テスト追加
    │   └── urlNormalizer.test.ts      # **新規追加**: URL正規化テスト
    └── integration/
        └── FeedManager.integration.test.tsx  # **新規追加**: 統合テスト

backend/
└── （バックエンドは変更なし）
```

**Structure Decision**: このプロジェクトはWeb applicationパターン（frontend + backend分離）を採用している。今回の修正はフロントエンドのみで、バックエンドAPIの変更は不要。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

該当なし - すべての憲法原則を遵守しています。
