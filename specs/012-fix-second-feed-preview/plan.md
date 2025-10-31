# Implementation Plan: 2件目フィード購読時のプレビュー表示バグ修正

**Branch**: `012-fix-second-feed-preview` | **Date**: 2025-11-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-fix-second-feed-preview/spec.md`

## Summary

2件目以降のRSSフィード購読時にプレビュー（タイトルフェッチ）が表示されないバグを修正します。根本原因は、`FeedManager.tsx`のuseEffect依存配列に`onClearError`が含まれていることで、1件目追加後の状態変化により2件目入力時にuseEffectが正常に再実行されないことです。

**修正アプローチ**:
- `FeedManager.tsx`のuseEffect（99-121行目）の依存配列から`onClearError`を削除
- useEffectは`url`、`fetchPreview`、`clearPreview`の変更時のみ実行されるべき
- 既存のテストが全て合格することで、バグ修正の正当性を確認

## Technical Context

**Language/Version**: TypeScript 5.9.3, React 19.1.1
**Primary Dependencies**: Vite 7.1.7（ビルド）, date-fns 4.x（日付処理）, TailwindCSS 4.x（スタイリング）
**Storage**: localStorage（ブラウザのクライアントサイドストレージ）
**Testing**: Vitest 4.0.3, @testing-library/react 16.3.0
**Target Platform**: ブラウザ（モダンブラウザ対応）
**Project Type**: Web（frontend）
**Performance Goals**: プレビュー表示は500ms以内（既存の仕様）
**Constraints**: 既存機能に影響を与えない、テスト追加不要（既存テストで検証）
**Scale/Scope**: 影響範囲は1ファイル（FeedManager.tsx）の1行の修正のみ

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Test-Driven Development (t-wada Style) - 絶対遵守

**評価**: ✅ 遵守

- **テストファースト**: 既存のテストスイートが存在し、バグ修正後にテストが合格することで正当性を確認
  - `useFeedPreview.test.ts`: プレビュー機能の単体テスト
  - `feedPreviewFlow.test.tsx`: プレビュー機能の統合テスト
  - `feedFlow.test.tsx`: フィード追加フロー全体のテスト
- **Red-Green-Refactor**: このバグ修正では以下のサイクルを適用
  1. **Red（既存）**: 既存のテストが2件目のプレビュー表示を期待している（テストは既に書かれている）
  2. **Green（今回）**: 依存配列を修正してテストを通す
  3. **Refactor（必要なし）**: 1行の修正のみなので、リファクタリングは不要
- **小さく確実に進む**: 1行の修正のみで、影響範囲が明確

**注意**: このバグ修正では、既存のテストが「仕様」として機能します。新しいテストは追加せず、既存のテストが合格することで修正の正当性を確認します。

### II. テストカバレッジと品質基準

**評価**: ✅ 遵守

- **新規コード**: 1行の削除のみなので、カバレッジへの影響は最小限
- **既存コード変更**: 変更部分（useEffect）は既存のテストでカバーされている
  - `useFeedPreview.test.ts`: プレビュー機能の単体テスト（デバウンス、AbortController、エラーハンドリング）
  - `feedPreviewFlow.test.tsx`: プレビュー表示の統合テスト

### III. TypeScript + React の品質基準

**評価**: ✅ 遵守

- **型安全性**: 修正箇所に型の変更はなし、既存の型定義を維持
- **Hooks Rules**: useEffectの依存配列の修正は、React Hooksのルールに準拠
  - `onClearError`は依存配列に含める必要がない（useEffect内で条件付きで呼ばれるのみ）
  - ESLintのreact-hooks/exhaustive-depsルールに違反しない

### IV. コードレビュー基準

**評価**: ✅ 遵守

- **テストファーストの遵守**: 既存のテストが仕様として機能
- **カバレッジ**: 既存のテストでカバー済み
- **型安全性**: TypeScriptの型チェックがパス（修正前後で型に変更なし）
- **リンター**: ESLint, Prettier の警告ゼロ

### V. シンプルさの原則（YAGNI）

**評価**: ✅ 遵守

- **必要最小限の修正**: 1行の削除のみで問題を解決
- **過剰設計の禁止**: 新しい機能や抽象化を追加せず、バグのみを修正
- **現在の要求を満たす**: 2件目以降のプレビュー表示を修正するのみ

### Constitution Check Summary

| 原則 | 評価 | 備考 |
|-----|------|------|
| Test-Driven Development | ✅ 遵守 | 既存テストが仕様として機能 |
| テストカバレッジ | ✅ 遵守 | 既存テストでカバー済み |
| TypeScript + React 品質基準 | ✅ 遵守 | Hooks Rulesに準拠 |
| コードレビュー基準 | ✅ 遵守 | 全基準を満たす |
| シンプルさの原則（YAGNI） | ✅ 遵守 | 最小限の修正 |

**総合評価**: ✅ 全ての憲法原則を遵守

## Project Structure

### Documentation (this feature)

```text
specs/012-fix-second-feed-preview/
├── spec.md              # 仕様書
├── plan.md              # このファイル（実装計画）
├── checklists/
│   └── requirements.md  # 仕様書品質チェックリスト
└── tasks.md             # タスクリスト（/speckit.tasks で生成）
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   └── FeedManager/
│   │       └── FeedManager.tsx  # ← 修正対象ファイル（121行目）
│   ├── hooks/
│   │   └── useFeedPreview.ts    # プレビュー機能のカスタムフック
│   └── containers/
│       └── FeedContainer.tsx    # 親コンポーネント
└── tests/
    ├── hooks/
    │   └── useFeedPreview.test.ts       # プレビュー機能の単体テスト
    └── flows/
        ├── feedPreviewFlow.test.tsx     # プレビュー統合テスト
        └── feedFlow.test.tsx            # フィード追加フロー全体のテスト
```

**Structure Decision**: このプロジェクトは「Web application」構成を採用しています。frontend/backend分離型ですが、今回のバグ修正はfrontendのみに影響します。

## Complexity Tracking

このバグ修正では、Constitution Checkに違反はありません。したがって、このセクションは空欄です。

## Phase 0: Research (N/A)

このバグ修正では、技術的な調査は不要です。根本原因と修正方法が明確であるため、research.mdは作成しません。

**スキップ理由**:
- バグの根本原因が特定済み（`FeedManager.tsx`のuseEffect依存配列の問題）
- 修正方法が明確（`onClearError`を依存配列から削除）
- 新しい技術や設計パターンの導入が不要
- 既存のアーキテクチャやコードスタイルを維持

## Phase 1: Design & Contracts

### Data Model (N/A)

このバグ修正では、データモデルの変更はありません。data-model.mdは作成しません。

**スキップ理由**:
- 既存のデータ構造（`Subscription`, `Feed`, `Article`）に変更なし
- localStorageのスキーマに変更なし
- 新しいエンティティの追加なし

### API Contracts (N/A)

このバグ修正では、APIの変更はありません。contracts/は作成しません。

**スキップ理由**:
- `/api/feed/parse` エンドポイントに変更なし
- リクエスト/レスポンス形式に変更なし
- 新しいエンドポイントの追加なし

### Quickstart

#### バグ修正の概要

**問題**:
- 2件目以降のRSSフィード購読時にプレビュー（タイトルフェッチ）が表示されない

**原因**:
- `FeedManager.tsx`のuseEffect（99-121行目）の依存配列に`onClearError`が含まれている
- 1件目追加後、親コンポーネントの再レンダリングで`onClearError`の参照が変わる可能性
- useEffectが再実行されるが、その時点で`url`は空文字列（既にクリア済み）
- `if (!url)`に入り、`clearPreview()`のみ実行して早期リターン
- 2件目のURL入力時、`url`は変化しているが`onClearError`の参照が変わらず、useEffectが再実行されない

**修正方法**:

1. **ファイル**: `frontend/src/components/FeedManager/FeedManager.tsx`
2. **行数**: 121行目
3. **変更内容**:

   ```diff
   -}, [url, fetchPreview, clearPreview, onClearError])
   +}, [url, fetchPreview, clearPreview])
   ```

**修正理由**:
- `onClearError`は条件付きで呼ばれるコールバックであり、その参照の変更でuseEffectを再実行する必要がない
- useEffectは`url`、`fetchPreview`、`clearPreview`の変更時のみ実行されるべき
- React HooksのルールおよびESLintの`react-hooks/exhaustive-deps`ルールに準拠

#### テスト戦略

**既存テストの活用**:

1. **useFeedPreview.test.ts** (単体テスト):
   - プレビュー機能のデバウンス動作を検証
   - AbortControllerによるキャンセル処理を検証
   - エラーハンドリングを検証

2. **feedPreviewFlow.test.tsx** (統合テスト):
   - URL入力時のプレビュー表示フローを検証
   - 有効/無効なURLの処理を検証

3. **feedFlow.test.tsx** (E2Eテスト):
   - フィード追加の全体フローを検証
   - 1件目、2件目の連続追加を検証（このテストで2件目のバグを検出可能）

**テスト実行**:

```bash
# 全テストを実行（CPU負荷対策でwatchモードなし）
npm test

# 特定のテストのみ実行（開発中）
npm test useFeedPreview.test.ts
npm test feedPreviewFlow.test.tsx
npm test feedFlow.test.tsx
```

**期待される結果**:
- ✅ 全てのテストが合格（既存機能に影響なし）
- ✅ 2件目のフィード追加時にプレビューが表示される
- ✅ TypeScriptの型チェックがパス
- ✅ ESLintの警告ゼロ

#### 手動テスト手順

1. **1件目のフィード追加**:
   - アプリケーションを起動
   - URL入力欄に有効なRSSフィードURLを入力（例: `https://example.com/feed.xml`）
   - プレビュー（フィードタイトル）が表示されることを確認
   - 「追加」ボタンをクリック
   - フィードが購読リストに追加されることを確認

2. **2件目のフィード追加（バグ再現）**:
   - URL入力欄に2件目のRSSフィードURLを入力
   - **修正前**: プレビューが表示されない、`/api/feed/parse`リクエストが飛ばない
   - **修正後**: プレビュー（フィードタイトル）が表示される、`/api/feed/parse`リクエストが飛ぶ
   - ブラウザの開発者ツール（Networkタブ）でリクエストを確認

3. **エッジケースのテスト**:
   - 無効なURLを入力してエラーメッセージが表示されることを確認
   - 3件目、4件目のフィードを連続して追加し、毎回プレビューが表示されることを確認

#### デプロイ前チェックリスト

- [ ] 全テストが合格（`npm test`）
- [ ] TypeScript型チェックが合格（`npx tsc --noEmit`）
- [ ] ESLintが合格（`npx eslint frontend/src`）
- [ ] フロントエンドのビルドが成功（`cd frontend && npm run build`）
- [ ] 手動テストで2件目のプレビューが表示されることを確認
- [ ] ブラウザの開発者ツールで`/api/feed/parse`リクエストが確認できる
- [ ] 1件目のフィード追加の動作が変更されていないことを確認

## Phase 2: Task Generation

タスク生成は `/speckit.tasks` コマンドで実行されます。このコマンドは plan.md を入力として、実装タスクのリスト（tasks.md）を生成します。

**次のステップ**: `/speckit.tasks` を実行してタスクリストを生成してください。

## Summary

このバグ修正は、以下の特徴を持ちます：

- **影響範囲**: 1ファイル（FeedManager.tsx）の1行の修正のみ
- **リスク**: 低（既存テストでカバーされており、影響範囲が明確）
- **テスト戦略**: 既存テストを活用（新規テスト不要）
- **憲法遵守**: 全ての原則を遵守

修正後は、ユーザーが何件目のフィードを追加する場合でも、一貫してプレビューを確認できるようになります。
