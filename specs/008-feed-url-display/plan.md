# Implementation Plan: 購読フィード識別表示の改善

**Branch**: `008-feed-url-display` | **Date**: 2025-10-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-feed-url-display/spec.md`

## Summary

RSSフィード購読リストにおいて、URLのみの表示では識別しにくいという問題を解決します。フィードからタイトルを自動取得して表示し、ユーザーが必要に応じてカスタム名を設定できる機能を実装します。既存のSubscriptionモデルとlocalStorageを拡張し、フロントエンドのFeedManagerコンポーネントに編集機能を追加します。

## Technical Context

**Language/Version**: TypeScript 5.9.3, React 19.1.1
**Primary Dependencies**: Vite 7.1.7, TailwindCSS 4.x, date-fns 4.x
**Storage**: localStorage（ブラウザのクライアントサイドストレージ）
**Testing**: Vitest 4.0.3, @testing-library/react 16.3.0
**Target Platform**: Web（モダンブラウザ）
**Project Type**: Web application（frontend + backend structure）
**Performance Goals**: フィード表示のレンダリング時間 < 100ms、編集操作の応答時間 < 50ms
**Constraints**: localStorage容量制限（通常5-10MB）、既存のSubscriptionモデルとの後方互換性
**Scale/Scope**: 最大100件のフィード購読、各フィードタイトル最大200文字

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS - プロジェクトにconstitution.mdが設定されていないため、ゲートチェックをスキップします。

**Note**: 今後プロジェクトの成長に応じて、constitution.mdを作成することを推奨します。

## Project Structure

### Documentation (this feature)

```text
specs/008-feed-url-display/
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
│   │       ├── FeedManager.tsx          # 既存：編集機能を追加
│   │       └── FeedManager.test.tsx     # 既存：テストを拡張
│   ├── contexts/
│   │   ├── SubscriptionContext.tsx      # 既存：カスタム名管理を追加
│   │   └── SubscriptionContext.test.tsx # 既存：テストを拡張
│   ├── types/
│   │   └── models.ts                    # 既存：Subscription型を拡張
│   └── utils/
│       ├── titleUtils.ts                # 新規：タイトル処理ユーティリティ
│       └── titleUtils.test.ts           # 新規：ユーティリティテスト
└── tests/
    └── integration/
        └── feedTitleFlow.test.tsx       # 新規：統合テスト
```

**Structure Decision**: 既存のWeb applicationアーキテクチャを維持し、frontend/src配下に機能を追加します。APIバックエンドの変更は不要で、フロントエンドのみの変更で完結します。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

該当なし - constitution.mdが未設定のため、違反項目はありません。

## Phase 0: Outline & Research

### Research Tasks

1. **既存のフィード取得処理の調査**
   - 目的：現在どのようにフィードタイトルが取得・保存されているかを確認
   - 調査範囲：SubscriptionContext, ArticleContext, API連携部分
   - 期待される発見：タイトル取得のタイミングと保存方法

2. **localStorage容量管理のベストプラクティス**
   - 目的：カスタム名追加による容量影響を評価
   - 調査内容：平均的なフィードタイトル長、100件での総容量見積もり
   - 期待される結論：容量制限内で実装可能かの判断

3. **React編集可能コンポーネントのパターン**
   - 目的：インライン編集UIの最適な実装方法を決定
   - 調査内容：編集モード切り替え、キャンセル処理、バリデーション
   - 期待される結論：実装パターンの選択（controlled component等）

4. **HTMLエスケープとサニタイゼーション**
   - 目的：RSSフィードタイトルに含まれるHTMLタグの安全な処理方法
   - 調査内容：既存のエスケープ処理、XSS対策
   - 期待される結論：使用するライブラリまたはユーティリティ関数の決定

### Output

research.mdに以下の情報を記載：
- 各調査項目の結果
- 選択した実装アプローチとその理由
- 代替案とその評価

## Phase 1: Design & Contracts

### Data Model Changes

**Subscription型の拡張** (frontend/src/types/models.ts):

```typescript
export interface Subscription {
  id: string;
  url: string;
  title: string | null;               // 既存：自動取得されたタイトル
  customTitle: string | null;         // 新規：ユーザー設定のカスタム名
  subscribedAt: string;
  lastFetchedAt: string | null;
  status: 'active' | 'error';
}

// 表示用ヘルパー関数
export function getDisplayTitle(subscription: Subscription): string {
  return subscription.customTitle || subscription.title || subscription.url;
}
```

### Component Interface Changes

**FeedManagerコンポーネント**に追加する機能:
- フィードタイトルの表示（customTitle優先、fallbackでtitle、最終的にURL）
- 編集ボタンとインライン編集UI
- 保存/キャンセル機能
- バリデーション（空文字チェック）

### API Contracts

この機能はフロントエンドのみで完結するため、新規APIエンドポイントは不要です。

既存のAPI応答を確認：
- GET `/api/feeds` - フィードタイトル情報が含まれているか確認（research.mdで詳細化）

### Testing Strategy

1. **Unit Tests**:
   - `titleUtils.test.ts`: HTMLエスケープ、切り詰め処理
   - `FeedManager.test.tsx`: 編集UI、保存/キャンセル
   - `SubscriptionContext.test.tsx`: customTitle管理

2. **Integration Tests**:
   - `feedTitleFlow.test.tsx`:
     - フィード追加 → タイトル自動表示
     - タイトル編集 → 保存 → 再表示確認
     - リロード後の永続化確認

### Output

- `data-model.md`: Subscription型の詳細設計
- `contracts/`: API契約（変更なしの確認）
- `quickstart.md`: 開発者向けクイックスタートガイド

## Phase 2: Implementation Roadmap

*このフェーズは `/speckit.tasks` コマンドで生成されます*

実装タスクのプレビュー：
1. 型定義の拡張（Subscription型）
2. titleUtilsユーティリティの実装
3. SubscriptionContextの拡張
4. FeedManagerコンポーネントの編集機能追加
5. テストの実装
6. 統合テストとE2Eテスト
7. ドキュメント更新

## Next Steps

1. ✅ Phase 0を実行してresearch.mdを生成
2. ✅ Phase 1を実行してdata-model.md、quickstart.mdを生成
3. ⏸️ `/speckit.tasks`を実行してタスクリストを生成（このコマンドの対象外）

## Notes

- 既存のSubscriptionモデルとの後方互換性を保つため、`customTitle`をオプショナル（`null`許容）として追加
- localStorageの既存データに影響を与えないよう、マイグレーション処理は不要
- APIバックエンドの変更は不要で、フロントエンドのみで完結
- 既存のテストケースに影響を与えないよう、新しいテストを追加する形で拡張