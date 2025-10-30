# Implementation Plan: フィードプレビュー取得時のAbortController処理修正

**Branch**: `010-fix-feed-preview` | **Date**: 2025-10-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-fix-feed-preview/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

この機能は、RSSフィード購読時のプレビュー取得におけるAbortController処理の不具合を修正します。現在、`feedAPI.ts`の`parseFeeds`関数が外部からのAbortSignalによるキャンセル（意図的なリクエストキャンセル）とタイムアウトを区別せずにエラー処理しているため、`useFeedPreview`フックのデバウンス処理が正しく動作していません。

修正により、外部からのAbortSignalによるキャンセルの場合はAbortErrorをそのまま再スローし、タイムアウトの場合のみFeedAPIErrorでラップすることで、2件目以降のフィード追加時でもプレビューが正しく表示されるようになります。

## Technical Context

**Language/Version**: TypeScript 5.9.3
**Primary Dependencies**: React 19.1.1, Vite 7.1.7
**Storage**: N/A（この機能はストレージを使用しない）
**Testing**: Vitest 4.0.3, @testing-library/react 16.3.0
**Target Platform**: モダンブラウザ（AbortController API対応）
**Project Type**: Web（frontend）
**Performance Goals**: プレビュー取得レスポンス < 2秒、デバウンス遅延 500ms
**Constraints**: タイムアウト 10秒、既存テストの100%パス維持
**Scale/Scope**: 影響範囲は1ファイル（feedAPI.ts）、既存テスト修正は不要

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### TDD原則の遵守

- ✅ **テストファースト**: 既存のテストスイート（`useFeedPreview.test.ts`）が存在し、修正後も継続して動作する必要がある
- ✅ **Red-Green-Refactor**:
  1. Red: 既存テストが現在の不具合を再現できるか確認
  2. Green: feedAPI.tsのAbortError処理を修正
  3. Refactor: エラーハンドリングロジックの改善

### カバレッジ基準

- ✅ **新規コード100%**: 修正部分のカバレッジを100%に維持
- ✅ **既存カバレッジ維持**: 現在のカバレッジ（188テスト）を低下させない

### 型安全性

- ✅ **any禁止**: AbortErrorの型チェックを適切に実装
- ✅ **strict mode**: 既存のtsconfig.jsonの設定を遵守

### テスト実行ルール

- ✅ **watchモード禁止**: テスト実行は`npm test`（1回限り）を使用
- ✅ **選択的テスト実行**: 開発中は`npm test useFeedPreview.test.ts feedAPI.test.ts`で関連テストのみ実行

### YAGNI原則

- ✅ **最小限の修正**: AbortController処理の修正のみに留め、追加機能は実装しない
- ✅ **過剰設計の回避**: 現在の要求（外部キャンセルとタイムアウトの区別）のみを満たす

## Project Structure

### Documentation (this feature)

```text
specs/010-fix-feed-preview/
├── spec.md              # 機能仕様（完了）
├── plan.md              # このファイル（/speckit.plan command output）
├── research.md          # Phase 0 output（後述）
├── data-model.md        # Phase 1 output（この機能では不要 - データモデル変更なし）
├── quickstart.md        # Phase 1 output（後述）
├── contracts/           # Phase 1 output（この機能では不要 - API契約変更なし）
├── checklists/
│   └── requirements.md  # 仕様品質チェックリスト（完了）
└── tasks.md             # Phase 2 output（/speckit.tasks command - NOT created by /speckit.plan）
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── services/
│   │   └── feedAPI.ts              # 修正対象ファイル（AbortController処理）
│   ├── hooks/
│   │   └── useFeedPreview.ts       # 影響を受けるファイル（変更不要）
│   └── components/
│       └── FeedManager/
│           └── FeedManager.tsx     # 影響を受けるファイル（変更不要）
└── tests/
    └── hooks/
        └── useFeedPreview.test.ts  # 既存テスト（動作確認用）
```

**Structure Decision**: このプロジェクトは既にWeb application構造（frontend/backend分離）を採用しています。今回の修正はfrontend/src/services/feedAPI.tsの1ファイルのみに影響します。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

憲法違反はありません。この機能はTDD原則、型安全性、YAGNI原則のすべてに準拠しています。
