# Implementation Tasks: 購読フィードのインポート/エクスポート機能

**Feature**: 014-feed-import-export
**Branch**: `014-feed-import-export`
**Generated**: 2025-11-02

## Overview

このドキュメントでは、購読フィードのインポート/エクスポート機能の実装タスクを定義します。タスクはユーザーストーリーごとに整理され、TDD（テスト駆動開発）に従って実装します。

---

## Task Summary

| Phase | User Story | Task Count | TDD Cycles | Notes |
|-------|-----------|-----------|-----------|-------|
| Phase 1 | Setup | 2 | - | 環境確認 |
| Phase 2 | Foundational | 3 | - | 型定義、エラーメッセージ |
| Phase 3 | US1 - エクスポート | 8 | 2 cycles | exportSubscriptions、date-fns統合 |
| Phase 4 | US2 - インポート | 15 | 5 cycles | validateExportData、validateSubscription、readFileAsText、mergeSubscriptions、normalizeImportedSubscription |
| Phase 5 | US3 - バリデーション | 7 | 2 cycles | ImportValidationError、importSubscriptions |
| Phase 6 | US4 - UI配置 | 10 | 3 cycles | ImportExportButtons、useImportExport、FeedManager統合 |
| Final Phase | Polish | 3 | - | テスト、Lint、ドキュメント |
| **Total** | **4 Stories** | **48 Tasks** | **12 TDD Cycles** | **Refactorタスク（-R）はオプショナル** |

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**推奨MVP**: User Story 1（エクスポート機能のみ）

- エクスポート機能だけで独立した価値を提供可能
- ユーザーはデータバックアップができる
- インポート機能は次のイテレーションで追加

### Incremental Delivery

1. **Iteration 1**: US1（エクスポート）→ リリース可能
2. **Iteration 2**: US2 + US3（インポート + バリデーション）→ リリース可能
3. **Iteration 3**: US4（UI改善）→ リリース可能

---

## Dependencies

### User Story Dependencies

```text
US1 (エクスポート) ← 独立（依存なし）
  ↓
US2 (インポート) ← US1に依存（エクスポートファイル形式を使用）
  ↓
US3 (バリデーション) ← US2に依存（インポート処理に組み込まれる）
  ↓
US4 (UI配置) ← US1, US2に依存（エクスポート/インポート機能が完成している必要がある）
```

### Phase Dependencies

```text
Phase 1 (Setup)
  ↓
Phase 2 (Foundational) - エラーメッセージ、型定義の追加
  ↓
Phase 3 (US1) - エクスポート機能
  ↓
Phase 4 (US2) - インポート機能
  ↓
Phase 5 (US3) - バリデーション（US2と並行可能）
  ↓
Phase 6 (US4) - UI配置
  ↓
Final Phase (Polish) - テスト実行、ドキュメント更新
```

---

## Parallel Execution Opportunities

### TDD構造での並列実行

**重要**: t-wadaのTDD原則に従い、各TDDサイクルは**Red → Green → Refactor**の順で実行します。並列実行は**異なるTDDサイクル間**でのみ可能です。

### Phase 2: Foundational（全て並列実行可能）

```bash
# 3つのタスクを同時に実行可能（別ファイル、TDDサイクルなし）
vim frontend/src/constants/errorMessages.ts  # T003
vim frontend/src/types/models.ts             # T004, T005
```

### Phase 3: US1 - エクスポート（2つのTDDサイクル）

```bash
# TDDサイクル1とサイクル2は依存関係があるため順次実行
# サイクル1: exportSubscriptions（T006-T009）
npm test  # T006 (Red)
vim src   # T007 (Green)
npm test  # T008 (確認)
vim src   # T009 (Refactor)

# サイクル2: date-fns統合（T010-T012）
npm test  # T010 (Red)
vim src   # T011 (Green)
vim src   # T012 (Refactor)
```

### Phase 4: US2 - インポート（5つのTDDサイクル、一部並列化可能）

**並列実行可能**: TDDサイクル1、2、3（バリデーション関数）は独立しているため、Redフェーズを並列で開始できます。

```bash
# 並列でテストを作成（Red）
vim frontend/src/utils/importValidation.test.ts  # T014, T016, T018 (並列)

# 各TDDサイクルを順次実行（Red → Green → Refactor）
# サイクル1: validateExportData（T014-T015-R）
# サイクル2: validateSubscription（T016-T017-R）
# サイクル3: readFileAsText（T018-T019-R）
# サイクル4: mergeSubscriptions（T020-T021-R）- サイクル1-3の後
# サイクル5: normalizeImportedSubscription（T022-T023-R）- サイクル4の後
```

### Phase 5: US3 - バリデーション（2つのTDDサイクル、順次実行）

```bash
# サイクル1: ImportValidationError（T024-T025-R）
# サイクル2: importSubscriptions（T026-T027-R）- サイクル1とPhase 4完了後
# 統合テスト: T028 - サイクル2完了後
```

### Phase 6: US4 - UI配置（3つのTDDサイクル、順次実行）

```bash
# サイクル1: ImportExportButtons（T029-T030-R）
# サイクル2: useImportExport（T031-T032-R）- サイクル1完了後
# サイクル3: FeedManager統合（T033-T034-R）- サイクル1,2完了後
# 手動テスト: T035 - サイクル3完了後
```

### 並列実行の原則

1. **同じTDDサイクル内は順次実行**: Red → Green → Refactor の順番を守る
2. **独立したTDDサイクル間は並列化可能**: 依存関係のない別の関数のテストは並列で作成できる
3. **Refactorタスク（-R）はオプショナル**: 必要な場合のみ実行

---

## Phase 1: Setup

**目的**: プロジェクトの初期設定と開発環境の確認

### Tasks

- [X] T001 開発環境のセットアップ確認（Node.js、npm、Git）
  - `node --version` でNode.js v18以上を確認
  - `npm --version` でnpm v9以上を確認
  - `git --version` でGit v2.30以上を確認
  - ブランチが `014-feed-import-export` であることを確認

- [X] T002 依存関係のインストールと確認
  - `cd frontend && npm install` を実行
  - `npm test -- --version` でVitest 4.0.3を確認
  - `npm run dev` で開発サーバーが起動することを確認

---

## Phase 2: Foundational（基盤タスク）

**目的**: 全ユーザーストーリーで使用する基盤コンポーネントを作成

### Tasks

- [X] T003 [P] エラーメッセージ定義を追加 `frontend/src/constants/errorMessages.ts`
  - `IMPORT_EXPORT_ERROR_MESSAGES` オブジェクトを追加
  - `IMPORT_INVALID_JSON`, `IMPORT_INVALID_SCHEMA`, `IMPORT_FILE_TOO_LARGE`, `IMPORT_FILE_READ_ERROR`, `EXPORT_FAILED` を定義
  - 既存の `FEED_ERROR_MESSAGES` パターンに従う

- [X] T004 [P] ExportData型を定義 `frontend/src/types/models.ts`
  - `ExportData` インターフェースを追加（version, exportedAt, subscriptions）
  - `ImportErrorCode` 型を追加（'INVALID_JSON' | 'INVALID_SCHEMA' | ...）

- [X] T005 [P] ImportResult型とImportValidationError型を定義 `frontend/src/types/models.ts`
  - `ImportResult` インターフェースを追加（success, addedCount, skippedCount, message, error?）
  - `ImportValidationError` インターフェースを追加（code, message, details?）

---

## Phase 3: User Story 1 - 購読フィードのエクスポート (Priority: P1)

**Story Goal**: ユーザーが1クリックで全購読フィードをJSONファイルとしてダウンロードできる

**Independent Test**: 購読フィードが5件ある状態で、エクスポートボタンをクリックし、ダウンロードされたJSONファイルに全5件のフィードデータが含まれることを確認

### Tasks

#### TDDサイクル1: exportSubscriptions の基本実装

**Red（失敗するテストを書く）**

- [X] T006 [P] [US1] exportSubscriptionsのテストを作成（Red） `frontend/src/services/importExport.service.test.ts`
  - テストケース: 購読フィードが3件ある場合、3件を含むJSONファイルをダウンロードする
  - テストケース: 購読フィードが0件の場合、空の配列を含むJSONファイルをダウンロードする
  - テストケース: カスタムタイトルを設定したフィードが正しくエクスポートされる
  - モック: `loadSubscriptions()`, `URL.createObjectURL()`, `HTMLAnchorElement.prototype.click()`
  - テスト実行: `npm test` で失敗することを確認（正しく失敗する = Red）
  - **コミット**: `git commit -m "test(US1): exportSubscriptionsのテストを追加（Red）"`

**Green（最小限の実装でテストを通す）**

- [X] T007 [US1] exportSubscriptions関数を仮実装（Green） `frontend/src/services/importExport.service.ts`
  - **仮実装アプローチ**: まず定数を返してテストを通す
  - ステップ1: モックデータを返す最小実装
  - ステップ2: `loadSubscriptions()` でlocalStorageから読み込み
  - ステップ3: `ExportData` 型でラップ（version: "1.0.0", exportedAt: 固定値）
  - ステップ4: `JSON.stringify(data, null, 2)` でJSON文字列化
  - ステップ5: `Blob` 作成 → `URL.createObjectURL()` → ダウンロード

- [X] T008 [US1] テストを実行してGreen状態を確認
  - `npm test importExport.service.test.ts` を実行
  - 全テストケースがパスすることを確認（Green達成）
  - **コミット**: `git commit -m "feat(US1): exportSubscriptionsを仮実装（Green）"`

**Refactor（コードの品質を向上）**

- [X] T009 [US1] exportSubscriptionsをリファクタリング（Refactor）
  - 重複コードの排除: 共通処理を関数に抽出
  - 変数名の明確化: `data` → `exportData`, `url` → `downloadUrl`
  - エラーハンドリングの追加: `try-catch` でエラーをキャッチ
  - exportedAtを現在日時に変更（固定値から動的値へ）
  - テスト実行: `npm test` で引き続きパスすることを確認（Greenを維持）
  - **コミット**: `git commit -m "refactor(US1): exportSubscriptionsの重複を排除（Refactor）"`

#### TDDサイクル2: date-fns統合

**Red（失敗するテストを書く）**

- [X] T010 [P] [US1] date-fns統合のテストを作成（Red） `frontend/src/services/importExport.service.test.ts`
  - テストケース: ファイル名が「subscriptions_YYYY-MM-DD.json」形式である
  - `date-fns` の `format()` を使用してファイル名を生成することを確認
  - テスト実行: `npm test` で失敗することを確認（Red）
  - **コミット**: `git commit -m "test(US1): date-fns統合のテストを追加（Red）"`

**Green（テストを通す）**

- [X] T011 [US1] date-fns統合を実装（Green） `frontend/src/services/importExport.service.ts`
  - `import { format } from 'date-fns'` を追加
  - ファイル名を `subscriptions_${format(new Date(), 'yyyy-MM-dd')}.json` に変更
  - テスト実行: `npm test` でパスすることを確認（Green達成）
  - **コミット**: `git commit -m "feat(US1): date-fns統合を実装（Green）"`

**Refactor（必要に応じて）**

- [X] T012 [US1] date-fns統合後のリファクタリング（Refactor）
  - 日付フォーマット処理を関数に抽出（必要な場合）
  - テスト実行: `npm test` で引き続きパスすることを確認
  - **コミット**: `git commit -m "refactor(US1): date-fns統合のリファクタリング（Refactor）"`（変更がある場合のみ）

#### 手動テスト

- [X] T013 [US1] 手動テストでエクスポート機能を確認
  - ブラウザで `http://localhost:5173` を開く
  - 購読フィードを3件追加
  - エクスポートボタンをクリック（仮のボタンを作成）
  - JSONファイルがダウンロードされることを確認
  - ファイル内容を確認（全フィールドが含まれるか）

---

## Phase 4: User Story 2 - 購読フィードのインポート（マージ方式） (Priority: P1)

**Story Goal**: 以前エクスポートしたフィードリストをインポートし、既存データとマージする

**Independent Test**: 既に2件のフィードを購読している状態で、5件のフィード（うち2件は既存と同じURL）を含むJSONファイルをインポートし、結果として合計5件になることを確認

### Tasks

#### TDDサイクル1: バリデーション関数（validateExportData）

**Red（失敗するテストを書く）**

- [X] T014 [P] [US2] validateExportDataのテストを作成（Red） `frontend/src/utils/importValidation.test.ts`
  - テストケース: 有効なExportDataを検証してtrueを返す
  - テストケース: versionフィールドが欠落している場合、falseを返す
  - テストケース: subscriptionsが配列でない場合、falseを返す
  - テスト実行: `npm test` で失敗することを確認（正しく失敗する = Red）
  - **コミット**: `git commit -m "test(US2): validateExportDataのテストを追加（Red）"`

**Green（最小限の実装でテストを通す）**

- [X] T015 [US2] validateExportData関数を仮実装（Green） `frontend/src/utils/importValidation.ts`
  - **仮実装アプローチ**: まず常にtrueを返してテストを通す
  - ステップ1: 常にtrueを返す最小実装
  - ステップ2: versionフィールドの存在チェックを追加
  - ステップ3: subscriptionsが配列かチェック
  - ステップ4: `data is ExportData` 型ガード関数として一般化
  - テスト実行: `npm test` でパスすることを確認（Green達成）
  - **コミット**: `git commit -m "feat(US2): validateExportDataを実装（Green）"`

**Refactor（コードの品質を向上）**

- [X] T015-R [US2] validateExportDataをリファクタリング（Refactor）
  - 重複コードの排除: フィールドチェックを関数に抽出
  - エラーメッセージの改善: より具体的な検証
  - テスト実行: `npm test` で引き続きパスすることを確認
  - **コミット**: `git commit -m "refactor(US2): validateExportDataの検証ロジックを改善（Refactor）"`（変更がある場合のみ）

#### TDDサイクル2: バリデーション関数（validateSubscription）

**Red（失敗するテストを書く）**

- [X] T016 [P] [US2] validateSubscriptionのテストを作成（Red） `frontend/src/utils/importValidation.test.ts`
  - テストケース: urlフィールドが存在する場合、trueを返す
  - テストケース: urlフィールドが欠落している場合、falseを返す
  - テストケース: statusが'active'または'error'の場合、trueを返す
  - テスト実行: `npm test` で失敗することを確認（Red）
  - **コミット**: `git commit -m "test(US2): validateSubscriptionのテストを追加（Red）"`

**Green（最小限の実装でテストを通す）**

- [X] T017 [US2] validateSubscription関数を仮実装（Green） `frontend/src/utils/importValidation.ts`
  - **仮実装アプローチ**: まず常にtrueを返してテストを通す
  - ステップ1: 常にtrueを返す最小実装
  - ステップ2: urlフィールドの存在チェックを追加
  - ステップ3: statusフィールドの値チェックを追加
  - ステップ4: `data is Partial<Subscription>` 型ガード関数として一般化
  - テスト実行: `npm test` でパスすることを確認（Green達成）
  - **コミット**: `git commit -m "feat(US2): validateSubscriptionを実装（Green）"`

**Refactor（コードの品質を向上）**

- [X] T017-R [US2] validateSubscriptionをリファクタリング（Refactor）
  - 重複コードの排除: フィールドチェックを関数に抽出
  - 型ガードの精度向上: より厳密な型チェック
  - テスト実行: `npm test` で引き続きパスすることを確認
  - **コミット**: `git commit -m "refactor(US2): validateSubscriptionの型チェックを強化（Refactor）"`（変更がある場合のみ）

#### TDDサイクル3: ファイル読み込み（readFileAsText）

**Red（失敗するテストを書く）**

- [X] T018 [P] [US2] readFileAsTextのテストを作成（Red） `frontend/src/utils/importValidation.test.ts`
  - テストケース: ファイルを正常に読み込み、テキストを返す
  - テストケース: ファイル読み込みに失敗した場合、ImportValidationErrorをthrowする
  - テスト実行: `npm test` で失敗することを確認（Red）
  - **コミット**: `git commit -m "test(US2): readFileAsTextのテストを追加（Red）"`

**Green（最小限の実装でテストを通す）**

- [X] T019 [US2] readFileAsText関数を仮実装（Green） `frontend/src/utils/importValidation.ts`
  - **仮実装アプローチ**: まず固定文字列を返してテストを通す
  - ステップ1: 固定文字列を返す最小実装
  - ステップ2: `FileReader` APIを使用してファイルを読み込み
  - ステップ3: `Promise<string>` を返すように一般化
  - ステップ4: エラーハンドリングを追加（`ImportValidationError` をthrow）
  - テスト実行: `npm test` でパスすることを確認（Green達成）
  - **コミット**: `git commit -m "feat(US2): readFileAsTextを実装（Green）"`

**Refactor（コードの品質を向上）**

- [X] T019-R [US2] readFileAsTextをリファクタリング（Refactor）
  - エラーハンドリングの改善: より具体的なエラーメッセージ
  - Promiseの処理を簡潔に
  - テスト実行: `npm test` で引き続きパスすることを確認
  - **コミット**: `git commit -m "refactor(US2): readFileAsTextのエラーハンドリングを改善（Refactor）"`（変更がある場合のみ）

#### TDDサイクル4: マージ関数（mergeSubscriptions）

**Red（失敗するテストを書く）**

- [X] T020 [P] [US2] mergeSubscriptionsのテストを作成（Red） `frontend/src/services/importExport.service.test.ts`
  - テストケース: URLが重複するフィードをスキップし、新規フィードのみを追加する
  - テストケース: 全フィードが重複している場合、added.length = 0, skipped = 5
  - テスト実行: `npm test` で失敗することを確認（Red）
  - **コミット**: `git commit -m "test(US2): mergeSubscriptionsのテストを追加（Red）"`

**Green（最小限の実装でテストを通す）**

- [X] T021 [US2] mergeSubscriptions関数を仮実装（Green） `frontend/src/services/importExport.service.ts`
  - **仮実装アプローチ**: まず全てを追加する最小実装
  - ステップ1: 全てのフィードを追加する最小実装
  - ステップ2: 既存URLをSetに格納（高速検索）
  - ステップ3: 重複チェック: `existingUrls.has(importedSub.url)`
  - ステップ4: `normalizeImportedSubscription()` で新規フィードを正規化
  - ステップ5: added/skippedの集計を追加
  - テスト実行: `npm test` でパスすることを確認（Green達成）
  - **コミット**: `git commit -m "feat(US2): mergeSubscriptionsを実装（Green）"`

**Refactor（コードの品質を向上）**

- [X] T021-R [US2] mergeSubscriptionsをリファクタリング（Refactor）
  - 重複コードの排除: URL重複チェックを関数に抽出
  - パフォーマンス最適化: Setの使用を最適化
  - テスト実行: `npm test` で引き続きパスすることを確認
  - **コミット**: `git commit -m "refactor(US2): mergeSubscriptionsの重複チェックを最適化（Refactor）"`（変更がある場合のみ）

#### TDDサイクル5: 正規化関数（normalizeImportedSubscription）

**Red（失敗するテストを書く）**

- [X] T022 [P] [US2] normalizeImportedSubscriptionのテストを作成（Red） `frontend/src/services/importExport.service.test.ts`
  - テストケース: idが新規生成される（UUIDv4形式）
  - テストケース: subscribedAtが現在日時に設定される
  - テストケース: lastFetchedAtがnullに設定される
  - テストケース: statusが'active'に設定される
  - テスト実行: `npm test` で失敗することを確認（Red）
  - **コミット**: `git commit -m "test(US2): normalizeImportedSubscriptionのテストを追加（Red）"`

**Green（最小限の実装でテストを通す）**

- [X] T023 [US2] normalizeImportedSubscription関数を仮実装（Green） `frontend/src/services/importExport.service.ts`
  - **仮実装アプローチ**: まず固定値を返してテストを通す
  - ステップ1: 固定値のオブジェクトを返す最小実装
  - ステップ2: `crypto.randomUUID()` でidを新規生成
  - ステップ3: `new Date().toISOString()` でsubscribedAtを現在日時に
  - ステップ4: lastFetchedAtをnull、statusを'active'に設定
  - ステップ5: インポートデータのフィールド（url, title, customTitle）をマージ
  - テスト実行: `npm test` でパスすることを確認（Green達成）
  - **コミット**: `git commit -m "feat(US2): normalizeImportedSubscriptionを実装（Green）"`

**Refactor（コードの品質を向上）**

- [X] T023-R [US2] normalizeImportedSubscriptionをリファクタリング（Refactor）
  - 重複コードの排除: デフォルト値の設定を整理
  - 型安全性の向上: より明示的な型アサーション
  - テスト実行: `npm test` で引き続きパスすることを確認
  - **コミット**: `git commit -m "refactor(US2): normalizeImportedSubscriptionのデフォルト値設定を整理（Refactor）"`（変更がある場合のみ）

---

## Phase 5: User Story 3 - インポート時のファイル検証とエラーハンドリング (Priority: P1)

**Story Goal**: 不正なファイルをインポートしようとした場合、分かりやすいエラーメッセージを表示し、データの整合性を保つ

**Independent Test**: テキストファイル、巨大なJSONファイル（2MB）、不正な形式のJSONファイルをそれぞれインポートし、適切なエラーメッセージが表示されることを確認

### Tasks

#### TDDサイクル1: ImportValidationErrorクラス

**Red（失敗するテストを書く）**

- [ ] T024 [P] [US3] ImportValidationErrorクラスのテストを作成（Red） `frontend/src/utils/importValidation.test.ts`
  - テストケース: エラーコードとメッセージが正しく設定される
  - テストケース: detailsフィールドが任意で設定できる
  - テストケース: Errorクラスを継承している
  - テスト実行: `npm test` で失敗することを確認（正しく失敗する = Red）
  - **コミット**: `git commit -m "test(US3): ImportValidationErrorクラスのテストを追加（Red）"`

**Green（最小限の実装でテストを通す）**

- [ ] T025 [US3] ImportValidationErrorクラスを仮実装（Green） `frontend/src/utils/importValidation.ts`
  - **仮実装アプローチ**: まず固定値を返す最小実装
  - ステップ1: 固定値のエラーメッセージを返す最小実装
  - ステップ2: `Error` クラスを継承
  - ステップ3: `code`, `message`, `details` プロパティを追加
  - ステップ4: コンストラクタで `ImportValidationErrorParams` を受け取る
  - テスト実行: `npm test` でパスすることを確認（Green達成）
  - **コミット**: `git commit -m "feat(US3): ImportValidationErrorクラスを実装（Green）"`

**Refactor（コードの品質を向上）**

- [ ] T025-R [US3] ImportValidationErrorクラスをリファクタリング（Refactor）
  - エラーメッセージの改善: より具体的なメッセージ
  - 型定義の改善: `ImportValidationErrorParams` の型を厳密に
  - テスト実行: `npm test` で引き続きパスすることを確認
  - **コミット**: `git commit -m "refactor(US3): ImportValidationErrorクラスの型定義を改善（Refactor）"`（変更がある場合のみ）

#### TDDサイクル2: importSubscriptions関数（統合関数）

**Red（失敗するテストを書く）**

- [X] T026 [P] [US3] importSubscriptionsのテストを作成（Red） `frontend/src/services/importExport.service.test.ts`
  - テストケース: 有効なJSONファイルをインポートし、重複しないフィードを追加する
  - テストケース: ファイルサイズが1MBを超える場合、ImportValidationErrorをthrowする
  - テストケース: 不正なJSON形式の場合、ImportValidationErrorをthrowする
  - テストケース: スキーマ不一致の場合、ImportValidationErrorをthrowする
  - テストケース: インポート中のエラーで既存データが変更されない（ロールバック）
  - テスト実行: `npm test` で失敗することを確認（Red）
  - **コミット**: `git commit -m "test(US3): importSubscriptionsのテストを追加（Red）"`

**Green（最小限の実装でテストを通す）**

- [X] T027 [US3] importSubscriptions関数を仮実装（Green） `frontend/src/services/importExport.service.ts`
  - **仮実装アプローチ**: まず成功ケースだけ実装
  - ステップ1: 固定の成功結果を返す最小実装
  - ステップ2: ファイルサイズチェック（1MB = 1048576 bytes）を追加
  - ステップ3: `readFileAsText()` でファイル読み込みを追加
  - ステップ4: `JSON.parse()` でJSONパースを追加（try-catch）
  - ステップ5: `validateExportData()` でスキーマ検証を追加
  - ステップ6: `mergeSubscriptions()` でマージを追加
  - ステップ7: `saveSubscriptions()` でlocalStorageに保存
  - ステップ8: `ImportResult` を返却
  - テスト実行: `npm test` でパスすることを確認（Green達成）
  - **コミット**: `git commit -m "feat(US3): importSubscriptionsを実装（Green）"`

**Refactor（コードの品質を向上）**

- [X] T027-R [US3] importSubscriptionsをリファクタリング（Refactor）
  - 重複コードの排除: バリデーション処理を関数に抽出
  - エラーハンドリングの改善: より具体的なエラーメッセージ
  - ロールバック処理の強化: try-catch内でlocalStorageの変更を保護
  - テスト実行: `npm test` で引き続きパスすることを確認
  - **コミット**: `git commit -m "refactor(US3): importSubscriptionsのエラーハンドリングを改善（Refactor）"`（変更がある場合のみ）

#### 統合テスト

- [X] T028 [US3] インポート機能の統合テストを実行
  - `npm test importExport.service.test.ts` を実行
  - 全テストケースがパスすることを確認
  - カバレッジ確認: `npm test -- --coverage` で100%を確認

---

## Phase 6: User Story 4 - UI配置とアクセシビリティ (Priority: P2)

**Story Goal**: エクスポート/インポート機能を簡単に見つけて使えるようにする

**Independent Test**: FeedManager画面を開き、「エクスポート」「インポート」ボタンが購読フィード一覧の上部に表示され、クリックできることを確認

### Tasks

#### TDDサイクル1: ImportExportButtonsコンポーネント

**Red（失敗するテストを書く）**

- [X] T029 [P] [US4] ImportExportButtonsのテストを作成（Red） `frontend/src/components/FeedManager/ImportExportButtons.test.tsx`
  - テストケース: エクスポートボタンが表示される
  - テストケース: インポートボタンが表示される
  - テストケース: エクスポートボタンをクリックするとonExport関数が呼ばれる
  - テストケース: ファイル選択後にonImport関数が呼ばれる
  - テスト実行: `npm test` で失敗することを確認（正しく失敗する = Red）
  - **コミット**: `git commit -m "test(US4): ImportExportButtonsのテストを追加（Red）"`

**Green（最小限の実装でテストを通す）**

- [X] T030 [US4] ImportExportButtonsコンポーネントを仮実装（Green） `frontend/src/components/FeedManager/ImportExportButtons.tsx`
  - **仮実装アプローチ**: まず最小限のボタンだけ表示
  - ステップ1: 固定テキストのボタンを2つ表示する最小実装
  - ステップ2: Props型定義を追加（`onExport: () => void`, `onImport: (file: File) => void`）
  - ステップ3: エクスポートボタンにonClickハンドラーを追加
  - ステップ4: インポートボタンを`<label>` + `<input type="file" accept=".json" />`に変更
  - ステップ5: ファイル選択時のonChangeハンドラーを追加
  - テスト実行: `npm test` でパスすることを確認（Green達成）
  - **コミット**: `git commit -m "feat(US4): ImportExportButtonsを実装（Green）"`

**Refactor（コードの品質を向上）**

- [X] T030-R [US4] ImportExportButtonsをリファクタリング（Refactor）
  - TailwindCSSでスタイリング（既存パターンを踏襲）
  - ボタンのアクセシビリティ改善（aria-label追加）
  - 重複コードの排除: ボタンスタイルを共通化
  - テスト実行: `npm test` で引き続きパスすることを確認
  - **コミット**: `git commit -m "refactor(US4): ImportExportButtonsのスタイリングを改善（Refactor）"`（変更がある場合のみ）

#### TDDサイクル2: useImportExportカスタムフック

**Red（失敗するテストを書く）**

- [X] T031 [P] [US4] useImportExportのテストを作成（Red） `frontend/src/hooks/useImportExport.test.ts`
  - テストケース: handleExport関数がexportSubscriptionsを呼ぶ
  - テストケース: handleImport関数がimportSubscriptionsを呼び、結果をstateに保存する
  - テストケース: エラー時にerrorStateが設定される
  - テスト実行: `npm test` で失敗することを確認（Red）
  - **コミット**: `git commit -m "test(US4): useImportExportのテストを追加（Red）"`

**Green（最小限の実装でテストを通す）**

- [X] T032 [US4] useImportExportカスタムフックを仮実装（Green） `frontend/src/hooks/useImportExport.ts`
  - **仮実装アプローチ**: まず空の関数を返す最小実装
  - ステップ1: 空のhandleExport, handleImport関数を返す最小実装
  - ステップ2: `handleExport()`: `exportSubscriptions()` を呼ぶ
  - ステップ3: `handleImport(file: File)`: `importSubscriptions(file)` を呼ぶ
  - ステップ4: importResult stateを追加し、結果を保存
  - ステップ5: エラーハンドリング: `try-catch` でエラーをキャッチし、errorStateに保存
  - テスト実行: `npm test` でパスすることを確認（Green達成）
  - **コミット**: `git commit -m "feat(US4): useImportExportを実装（Green）"`

**Refactor（コードの品質を向上）**

- [X] T032-R [US4] useImportExportをリファクタリング（Refactor）
  - 重複コードの排除: エラーハンドリングを関数に抽出
  - state管理の改善: useReducerの検討（必要に応じて）
  - テスト実行: `npm test` で引き続きパスすることを確認
  - **コミット**: `git commit -m "refactor(US4): useImportExportのエラーハンドリングを改善（Refactor）"`（変更がある場合のみ）

#### TDDサイクル3: FeedManager統合

**Red（失敗するテストを書く）**

- [X] T033 [P] [US4] FeedManagerにImportExportButtonsを統合するテストを追加（Red） `frontend/src/components/FeedManager/FeedManager.test.tsx`
  - テストケース: ImportExportButtonsコンポーネントが表示される
  - テストケース: エクスポートボタンをクリックするとエクスポート処理が実行される
  - テストケース: インポートが成功すると結果メッセージが表示される
  - テスト実行: `npm test` で失敗することを確認（Red）
  - **コミット**: `git commit -m "test(US4): FeedManager統合テストを追加（Red）"`

**Green（最小限の実装でテストを通す）**

- [X] T034 [US4] FeedManagerにImportExportButtonsを統合（Green） `frontend/src/components/FeedManager/FeedManager.tsx`
  - **仮実装アプローチ**: まずコンポーネントを配置するだけ
  - ステップ1: `<ImportExportButtons />` を配置する最小実装（propsなし）
  - ステップ2: `useImportExport()` フックを使用
  - ステップ3: `onExport={handleExport}` `onImport={handleImport}` を渡す
  - ステップ4: 購読フィード一覧の上部（フォームの下）に配置
  - ステップ5: インポート結果のメッセージを表示（`{importResult && <div>{importResult.message}</div>}`）
  - テスト実行: `npm test` でパスすることを確認（Green達成）
  - **コミット**: `git commit -m "feat(US4): FeedManagerにImportExportButtonsを統合（Green）"`

**Refactor（コードの品質を向上）**

- [X] T034-R [US4] FeedManager統合をリファクタリング（Refactor）
  - レイアウトの改善: フレックスボックスでボタン配置を整理
  - メッセージ表示の改善: 成功/エラーで色分け
  - テスト実行: `npm test` で引き続きパスすることを確認
  - **コミット**: `git commit -m "refactor(US4): FeedManagerのレイアウトを改善（Refactor）"`（変更がある場合のみ）

#### 手動テスト

- [X] T035 [US4] 手動テストでUI配置とアクセシビリティを確認
  - ブラウザで `http://localhost:5173` を開く
  - エクスポート/インポートボタンが購読フィード一覧の折りたたみ領域内に表示されることを確認
  - 購読リストを折りたたむとボタンも一緒に隠れることを確認
  - エクスポートボタンをクリックしてファイルがダウンロードされることを確認
  - インポートボタンでファイルを選択してインポートが成功することを確認
  - インポート後にページがリロードされて反映されることを確認

---

## Final Phase: Polish & Cross-Cutting Concerns

**目的**: コード品質の最終確認とドキュメント更新

### Tasks

- [X] T036 [P] 全テストを実行してカバレッジを確認
  - `npm test -- --coverage` を実行
  - カバレッジが80%以上であることを確認
  - カバレッジレポートを確認: `open coverage/index.html`

- [X] T037 [P] TypeScript型チェックとLintを実行
  - `npx tsc --noEmit` を実行（型エラーがないことを確認）
  - `npm run lint` を実行（警告ゼロを確認）
  - `npm run format` でコードフォーマット

- [X] T038 [P] ドキュメントの更新
  - SPECIFICATION.mdを更新（新機能セクションを追加）
  - README.mdを更新（使い方セクションを追加、テストカバレッジ数値を更新）
  - 最終更新日を更新

---

## Testing Strategy

### Test Types

| テスト種別 | 配置場所 | 実行コマンド | 目的 |
|-----------|---------|------------|------|
| ユニットテスト | `src/**/*.test.ts(x)` | `npm test` | 関数・コンポーネント単位 |
| インテグレーションテスト | `tests/integration/*.test.tsx` | `npm test` | UIフロー全体 |

### Coverage Goals

- **新規コード**: 100%カバレッジ
- **プロジェクト全体**: 80%以上

### Test Execution Rules（CPU負荷対策）

- ✅ **推奨**: `npm test`（1回限りの実行）
- ⚠️ **禁止**: `npm run test:watch`（watchモード、CPU負荷高）

---

## Commit Strategy

### TDDサイクルごとにコミット（t-wada原則）

**重要**: Red-Green-Refactorの各フェーズで必ずコミットを作成します。これにより、開発の履歴が明確になり、問題発生時のロールバックが容易になります。

```bash
# Phase 3: TDDサイクル1の例（exportSubscriptions）

# T006: Red フェーズ（テスト作成）
git add frontend/src/services/importExport.service.test.ts
git commit -m "test(US1): exportSubscriptionsのテストを追加（Red）"

# T007-T008: Green フェーズ（仮実装 → 一般化）
git add frontend/src/services/importExport.service.ts
git commit -m "feat(US1): exportSubscriptionsを仮実装（Green）"

# T009: Refactor フェーズ（コード品質向上）
git add frontend/src/services/importExport.service.ts
git commit -m "refactor(US1): exportSubscriptionsの重複を排除（Refactor）"
```

### コミットメッセージのフォーマット

```
<type>(<scope>): <subject>（<phase>）

type: test | feat | refactor
scope: US1 | US2 | US3 | US4
subject: 何を変更したか（日本語OK）
phase: Red | Green | Refactor
```

**例**:
- `test(US2): validateExportDataのテストを追加（Red）`
- `feat(US2): validateExportDataを実装（Green）`
- `refactor(US2): validateExportDataの検証ロジックを改善（Refactor）`
- `test(US4): ImportExportButtonsのテストを追加（Red）`
- `feat(US4): ImportExportButtonsを実装（Green）`

### Refactorタスク（-R）のコミット

Refactorタスクは**変更がある場合のみコミット**します。変更がない場合はスキップしてください。

```bash
# 変更がある場合
git commit -m "refactor(US1): exportSubscriptionsの重複を排除（Refactor）"

# 変更がない場合
# コミットせずに次のタスクに進む
```

---

## Validation Checklist

実装完了後、以下のチェックリストで品質を確認します：

### Constitution Compliance

- [X] すべてのテストがパス
- [X] カバレッジが80%以上
- [X] TypeScript の型チェックがパス
- [X] ESLint の警告ゼロ
- [X] TDDサイクル（Red-Green-Refactor）を遵守

### Functional Requirements

- [X] FR-001~FR-018: 全機能要件を満たしている
- [X] SC-001~SC-009: 全成功基準を満たしている

### User Story Acceptance

- [X] US1: エクスポート機能が独立して動作する
- [X] US2: インポート機能がマージ方式で動作する
- [X] US3: バリデーションとエラーハンドリングが適切に動作する
- [X] US4: UI配置が適切で、アクセシビリティが確保されている

---

## Next Steps

1. `/speckit.implement` コマンドを実行してタスクを自動実行
2. 各タスク完了後にコミット
3. 全タスク完了後にプルリクエストを作成
4. コードレビューを受ける
5. CI/CDパイプラインがグリーンになることを確認
6. mainブランチにマージ

**タスク生成完了！実装を開始してください。** 🚀
