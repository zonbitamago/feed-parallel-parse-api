# Implementation Plan: 購読フィードのインポート/エクスポート機能

**Branch**: `014-feed-import-export` | **Date**: 2025-11-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-feed-import-export/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

購読フィードをJSONファイルとしてエクスポート・インポートする機能を実装します。エクスポートでは全フィールド（id、URL、タイトル、カスタムタイトル、購読日時、最終取得日時、ステータス）を含むJSONファイルをダウンロードし、インポートでは既存データとマージ（URLベースの重複チェック）します。FeedManagerコンポーネント内にエクスポート/インポートボタンを配置し、ブラウザの標準File API（Blob、FileReader、URL.createObjectURL）を使用して実装します。

## Technical Context

**Language/Version**: TypeScript 5.9.3
**Primary Dependencies**: React 19.1.1, Vite 7.1.7, TailwindCSS 4.1.16, date-fns 4.1.0
**Storage**: localStorage（ブラウザAPI、キー: `rss_reader_subscriptions`）
**Testing**: Vitest 4.0.3, @testing-library/react 16.3.0, happy-dom
**Target Platform**: モダンブラウザ（Chrome, Firefox, Safari, Edge 最新版、File API対応必須）
**Project Type**: Web（フロントエンドのみ）
**Performance Goals**: 100件のフィードを1秒以内にインポート処理
**Constraints**: ファイルサイズ最大1MB、localStorage容量制限（通常5MB）
**Scale/Scope**: 購読フィード管理機能の拡張（エクスポート/インポート機能追加）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Test-Driven Development (TDD) - 絶対遵守

- [x] **テストファースト**: 実装前にテストを書く（Red-Green-Refactorサイクル）
- [x] **高速テスト**: 単体テストは1秒以内、全体でも数秒以内
- [x] **CPU負荷対策**: `npm test`（1回限りの実行）を使用、watchモード禁止

**遵守状況**: ✅ PASS
- テスト駆動で実装を進める
- ユニットテスト（エクスポート/インポート関数）とインテグレーションテスト（UIフロー）の両方を実施
- `npm test`でテスト実行（watchモード不使用）

### II. テストカバレッジと品質基準

- [x] **新規コード**: 100%のカバレッジを目指す
- [x] **テストピラミッド**: 単体テスト70%、統合テスト20%、E2Eテスト10%

**遵守状況**: ✅ PASS
- 単体テスト: `importExport.service.test.ts`（エクスポート/インポート関数）
- 統合テスト: `FeedManager.test.tsx`（UI + ビジネスロジック）
- E2Eテスト: このフェーズでは不要（既存のE2Eテストで十分）

### III. TypeScript + React の品質基準

- [x] **any禁止**: `any`型の使用は原則禁止（`unknown`を使用）
- [x] **strict mode**: `tsconfig.json`で`"strict": true`を必須化
- [x] **Props型定義**: React コンポーネントのPropsは必ず型定義

**遵守状況**: ✅ PASS
- すべての関数に明示的な型定義を追加
- `unknown`型を使用してバリデーション関数を実装（`validateExportData(data: unknown)`）
- 既存のstrict mode設定を継承

### IV. シンプルさの原則（YAGNI）

- [x] **必要になるまで作らない**: 将来の拡張性より現在のシンプルさ
- [x] **過剰設計の禁止**: 現在の要求を満たす最小限の設計

**遵守状況**: ✅ PASS
- OPML形式のサポートは将来的な拡張として、現時点ではJSON形式のみサポート（Out of Scope）
- プログレスバーは100件程度であれば瞬時に完了するため不要（Out of Scope）
- 最小限の機能（エクスポート/インポート/バリデーション）のみを実装

### V. Quality Gates（マージ前の必須条件）

- [ ] すべてのテストがパス
- [ ] カバレッジが基準（80%）以上
- [ ] TypeScript の型チェックがパス
- [ ] ESLint の警告ゼロ
- [ ] コードレビュー承認
- [ ] CI/CDパイプラインがグリーン

**遵守状況**: ⏳ PENDING（実装後に確認）
- 実装フェーズで全てのQuality Gatesをクリアする

## Project Structure

### Documentation (this feature)

```text
specs/014-feed-import-export/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── importExport.contract.md
├── checklists/          # Quality validation checklists
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── types/
│   │   └── models.ts                        # 既存（Subscription型）+ 新規追加（ExportData、ImportResult、ImportValidationError）
│   ├── constants/
│   │   └── errorMessages.ts                 # 既存 + 新規追加（IMPORT_EXPORT_ERROR_MESSAGES）
│   ├── services/
│   │   ├── storage.ts                       # 既存（loadSubscriptions、saveSubscriptions）
│   │   ├── importExport.service.ts          # 新規（exportSubscriptions、importSubscriptions）
│   │   └── importExport.service.test.ts     # 新規テスト
│   ├── hooks/
│   │   ├── useImportExport.ts               # 新規（インポート/エクスポートロジック）
│   │   └── useImportExport.test.ts          # 新規テスト
│   ├── utils/
│   │   ├── importValidation.ts              # 新規（バリデーション関数）
│   │   ├── importValidation.test.ts         # 新規テスト
│   │   └── ... (既存ファイル)
│   └── components/
│       └── FeedManager/
│           ├── FeedManager.tsx              # 既存（エクスポート/インポートボタンを追加）
│           ├── FeedManager.test.tsx         # 既存（新規テストケースを追加）
│           ├── ImportExportButtons.tsx      # 新規（エクスポート/インポートボタンUI）
│           ├── ImportExportButtons.test.tsx # 新規テスト
│           └── ... (既存ファイル)
└── tests/
    └── integration/
        └── importExportFlow.test.tsx        # 新規（インテグレーションテスト）
```

**Structure Decision**:

このプロジェクトはWeb application（フロントエンドのみ）の構成です。既存のディレクトリ構造を踏襲し、以下の方針で新規ファイルを配置します：

1. **型定義**: `types/models.ts`に追加（ExportData、ImportResult、ImportValidationError）
2. **エラーメッセージ**: `constants/errorMessages.ts`に追加（IMPORT_EXPORT_ERROR_MESSAGES）
3. **ビジネスロジック**: `services/importExport.service.ts`を新規作成
4. **UIロジック**: `hooks/useImportExport.ts`を新規作成
5. **バリデーション**: `utils/importValidation.ts`を新規作成
6. **UIコンポーネント**: `components/FeedManager/ImportExportButtons.tsx`を新規作成
7. **テスト**: ソースファイルと同じディレクトリに`.test.ts(x)`を配置

## Complexity Tracking

**Status**: ✅ No violations

憲法違反はありません。すべての設計原則を遵守しています。
