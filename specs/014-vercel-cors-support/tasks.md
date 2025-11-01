---

description: "Task list for Vercel CORS設定追加 feature implementation"
---

# Tasks: Vercel CORS設定追加

**Feature**: 014-vercel-cors-support
**Input**: Design documents from `/specs/014-vercel-cors-support/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), quickstart.md

**Tests**: ⚠️ **TDD一部適用外** - [Constitution Check](./plan.md#constitution-check)参照

**理由**: この機能はHTTPヘッダー設定のみで、Vercelサーバーレス関数の統合テストはローカル環境での再現が困難。代わりにVercelプレビュー環境での手動統合テストを実施。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## 🎯 実装戦略

この機能はシンプルなHTTPヘッダー設定のため、**明白な実装（Obvious Implementation）** を推奨。

### 実装手法

**明白な実装（Obvious Implementation）** - 自信があるとき ⭐️ 推奨

- シンプルな操作はそのまま実装
- 既存のローカル環境（`cmd/server/main.go`）に同一実装が存在し、動作実績あり
- 同じコードパターンを `api/parse.go` に適用

### テスト戦略

- **単体テスト**: なし（Vercel関数の統合テストは困難）
- **統合テスト**: Vercelプレビュー環境での手動テスト（quickstart.md参照）
- **品質保証**: ローカル環境との実装一貫性確認

---

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **API**: `api/parse.go` (Vercel serverless function)
- **Reference**: `cmd/server/main.go` (local development CORS implementation)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 環境準備と既存実装の確認

- [X] T001 既存のローカルCORS実装を確認 - `cmd/server/main.go:47-68` を読む
- [X] T002 [P] `api/parse.go` の現在の実装を確認 - Handler関数の構造を理解
- [X] T003 [P] Vercel環境の制約を確認 - `vercel.json`でのCORS設定が非対応か確認

**Checkpoint**: 既存実装の理解完了

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: この機能には foundational タスクなし（1ファイルの修正のみ）

**⚠️ SKIP**: このフェーズは不要 - User Story実装に直接進む

---

## Phase 3: User Story 1 - プレビュー環境でのAPI動作確認 (Priority: P1) 🎯 MVP

**Goal**: Vercelプレビュー環境でCORSエラーを解消し、フィード解析機能が正常に動作する

**Independent Test**: プレビュー環境のフロントエンドからフィードURLを入力し、CORSエラーなく成功

**実装手法**: **明白な実装（Obvious Implementation）** - ローカル環境の実装をそのまま適用

### 🔴 Red Phase: Tests for User Story 1

> **注意**: この機能はTDD一部適用外（plan.md参照）
>
> Vercelサーバーレス関数の統合テストはローカル環境での再現が困難なため、失敗するテストは作成しない。
> 代わりに、実装後にVercelプレビュー環境での手動統合テストを実施。

**SKIP**: このフェーズは不要 - 実装に直接進む

---

### ✅ Green Phase: Implementation for User Story 1（最小限の実装でテストを通す）

> **品質は問わない、まず動かす**: ローカル環境と同じCORSヘッダー設定を `api/parse.go` に追加

**実装手法**: **明白な実装（Obvious Implementation）** - 既存の `cmd/server/main.go` と同じコードパターンを使用

- [X] T004 [US1] CORSヘッダー設定を `api/parse.go` の Handler関数冒頭に追加【明白な実装】
  - ファイル: `api/parse.go:11-16`
  - 追加内容:
    ```go
    // CORS ヘッダー設定
    w.Header().Set("Access-Control-Allow-Origin", "*")
    w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
    w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
    ```
  - 参照: `cmd/server/main.go:53-55` と同じヘッダー設定

- [X] T005 [US1] OPTIONSメソッドのプリフライト処理を追加【明白な実装】
  - ファイル: `api/parse.go:17-21`
  - 追加内容:
    ```go
    // プリフライト OPTIONS リクエストの処理
    if r.Method == http.MethodOptions {
        w.WriteHeader(http.StatusOK)
        return
    }
    ```
  - 参照: `cmd/server/main.go:58-62` と同じパターン

- [X] T006 [US1] ローカル環境との一貫性を確認 - `cmd/server/main.go` と `api/parse.go` のヘッダー設定が同一か比較

**Checkpoint**: 実装完了（Green完了）

- ✅ CORSヘッダーが追加されている
- ✅ OPTIONSメソッドが処理される
- ✅ ローカル環境と同じヘッダー設定

---

### ♻️ Refactor Phase: Code Quality Improvement（コード品質向上）

> **テストを通したまま、コードの品質を向上させる**: 既存実装と完全一致のため、リファクタリングは不要

**SKIP**: この機能はシンプルなHTTPヘッダー設定のため、リファクタリングの余地なし

**Checkpoint**: Refactor完了 - User Story 1のコア機能完成

---

### 📋 Manual Integration Test: Vercel Preview Environment（手動統合テスト）

> **重要**: TDD一部適用外のため、Vercelプレビュー環境での手動テストで品質保証

- [X] T007 [US1] 変更をコミットしてプッシュ
  - コマンド:
    ```bash
    git add api/parse.go
    git commit -m "fix(api): Vercel CORS設定を追加してプレビュー環境のCORSエラーを解消"
    git push origin 014-vercel-cors-support
    ```

- [ ] T008 [US1] GitHubでPRを作成し、Vercelプレビュー環境のURLを取得
  - Vercel Botが投稿するプレビューURLをコピー
  - 例: `https://feed-parallel-parse-api-git-014-*.vercel.app`

- [ ] T009 [US1] プレビュー環境でCORSエラーの解消を確認（quickstart.md参照）
  - プレビューURLにアクセス
  - フィードURLを入力（例: `https://zenn.dev/feed`）
  - ブラウザ開発者ツール > Networkタブでプリフライトリクエスト（OPTIONS）を確認
  - Response Headers に `Access-Control-Allow-Origin: *` が含まれることを確認
  - POSTリクエストが成功し、CORSエラーが表示されないことを確認

- [ ] T010 [US1] ブラウザConsoleタブでCORSエラーが発生していないことを確認

**Checkpoint**: User Story 1完了 - プレビュー環境でCORSエラーが解消された ✅

---

## Phase 4: User Story 2 - 本番環境の互換性維持 (Priority: P2)

**Goal**: 本番環境（Same-Origin構成）で従来通り正常に動作し、パフォーマンスに影響なし

**Independent Test**: 本番環境でフィード解析機能をテストし、動作に変化がないことを確認

**実装**: User Story 1で完了（同じコード変更が本番環境にも適用される）

### Manual Integration Test: Production Environment（手動統合テスト）

- [ ] T011 [US2] PRをmainブランチにマージ
  - PRレビュー完了後、マージボタンをクリック
  - Vercelが自動で本番環境にデプロイ

- [ ] T012 [US2] 本番環境での動作確認（quickstart.md参照）
  - 本番URL: `https://feed-parallel-parse-api.vercel.app`
  - フィードURLを入力（例: `https://zenn.dev/feed`）
  - 従来通り正常にフィードデータが取得できることを確認

- [ ] T013 [US2] 本番環境のレスポンスヘッダーを確認
  - ブラウザ開発者ツール > Networkタブで `/api/parse` リクエストを確認
  - Response Headers に `Access-Control-Allow-Origin: *` が含まれることを確認
  - Same-Originのため、ヘッダーは無視され動作に影響なし

- [ ] T014 [US2] 本番環境のパフォーマンス確認
  - ブラウザ開発者ツール > Networkタブで API応答時間を確認
  - 変更前後で応答時間が±5%以内であることを確認（quickstart.md参照）

**Checkpoint**: User Story 2完了 - 本番環境で正常動作を確認 ✅

---

## Phase 5: User Story 3 - ローカル開発環境の互換性維持 (Priority: P3)

**Goal**: Dockerローカル環境で既存のCORS設定と新しいVercel用CORS設定が共存し、正常に動作

**Independent Test**: `docker-compose up`でローカル環境を起動し、フロントエンドからAPIを呼び出して動作確認

**実装**: User Story 1で完了（ローカル環境は `cmd/server/main.go` を使用、Vercel環境は `api/parse.go` を使用）

### Manual Integration Test: Local Docker Environment（手動統合テスト）

- [ ] T015 [US3] Dockerローカル環境を起動
  - コマンド:
    ```bash
    docker-compose up
    ```

- [ ] T016 [US3] ローカル環境での動作確認
  - ブラウザで `http://localhost:3000` にアクセス
  - フィードURLを入力（例: `https://zenn.dev/feed`）
  - 正常にフィードデータが取得できることを確認

- [ ] T017 [US3] ローカル環境とVercel環境のCORS実装を比較
  - `cmd/server/main.go:53-55` のヘッダー設定を確認
  - `api/parse.go:12-14` のヘッダー設定を確認
  - 両者が同じヘッダー設定（`Access-Control-Allow-Origin: *`）を使用していることを確認

**Checkpoint**: User Story 3完了 - ローカル環境で正常動作を確認 ✅

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ドキュメント更新と最終確認

- [X] T018 [P] SPECIFICATION.mdを更新 - CORS設定の追加を記載（API仕様セクション）
- [X] T019 [P] README.mdの更新必要性を判断フロー（CLAUDE.md参照）で確認
  - 質問1: ユーザーの使い方に影響するか？ → いいえ（内部的なCORS設定）
  - 質問2: セットアップ手順やコマンドが変わるか？ → いいえ
  - 質問3: 技術スタックやバージョンが変わるか？ → いいえ
  - **結論**: README更新は不要
- [ ] T020 全環境での動作を最終確認
  - ローカル環境（Docker）: ⏳ ユーザーが確認（T015-T017）
  - プレビュー環境（Vercel）: ⏳ ユーザーが確認（T008-T010）
  - 本番環境（Vercel）: ⏳ ユーザーが確認（T011-T014）

**Checkpoint**: すべてのタスク完了 - 機能リリース準備完了 🎉

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Story 1 (Phase 3)**: Depends on Setup completion - MVP実装
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion（同じコード変更が本番環境に適用される）
- **User Story 3 (Phase 5)**: Depends on User Story 1 completion（既存ローカル環境との互換性確認）
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup - No dependencies on other stories
- **User Story 2 (P2)**: Depends on User Story 1（本番環境へのマージ前提）
- **User Story 3 (P3)**: Independent from User Story 1/2（ローカル環境は別実装）

### Within Each User Story

User Story 1:
1. Implementation (T004-T006) - sequential
2. Manual Integration Test (T007-T010) - sequential

User Story 2:
1. Deploy to production (T011)
2. Manual Integration Test (T012-T014) - sequential

User Story 3:
1. Manual Integration Test (T015-T017) - sequential

### Parallel Opportunities

- **Setup tasks**: T001, T002, T003 can run in parallel
- **Polish tasks**: T018, T019 can run in parallel
- **User Stories**: User Story 3（ローカル環境確認）は User Story 1完了後すぐに並行実行可能

---

## Parallel Example: Setup Phase

```bash
# Launch all setup tasks together:
Task: "既存のローカルCORS実装を確認 - cmd/server/main.go:47-68 を読む"
Task: "api/parse.go の現在の実装を確認 - Handler関数の構造を理解"
Task: "Vercel環境の制約を確認 - vercel.jsonでのCORS設定が非対応か確認"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup（環境準備）
2. Complete Phase 3: User Story 1（プレビュー環境でCORSエラー解消）
3. **STOP and VALIDATE**: Vercelプレビュー環境で動作確認
4. 動作確認OK → PRレビュー依頼

### Incremental Delivery

1. Setup → 既存実装の理解完了
2. User Story 1 → プレビュー環境で動作確認 → PRレビュー（MVP!）
3. User Story 2 → 本番環境にマージ → 本番環境で動作確認
4. User Story 3 → ローカル環境で動作確認
5. Polish → ドキュメント更新 → リリース完了

### Sequential Strategy (Recommended)

この機能は1ファイルの修正のため、順次実行を推奨：

1. Setup（環境準備）
2. User Story 1（実装 + プレビュー環境テスト）
3. PRレビュー + マージ
4. User Story 2（本番環境テスト）
5. User Story 3（ローカル環境テスト）
6. Polish（ドキュメント更新）

---

## Notes

### 実装のポイント

- **明白な実装**: ローカル環境（`cmd/server/main.go`）の実装をそのまま適用
- **一貫性重視**: すべての環境で同じCORSヘッダー設定を使用
- **シンプルさ**: ワイルドカード（`*`）のみ実装、環境変数制御は将来的に必要になった時点で追加

### TDD一部適用外の理由

- HTTPヘッダー設定のみの変更で、ビジネスロジックを含まない
- Vercelサーバーレス関数の統合テストは、ローカル環境での再現が困難
- 既存のローカル環境（`cmd/server/main.go`）に同一実装が存在し、動作実績あり
- 代替策: Vercelプレビュー環境での手動統合テスト

### タスク管理

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] label**: Maps task to specific user story for traceability
- **Stop at any checkpoint**: 各チェックポイントで独立検証可能

### コミット戦略

```bash
# 実装（Green Phase相当）
git add api/parse.go
git commit -m "fix(api): Vercel CORS設定を追加してプレビュー環境のCORSエラーを解消"

# ドキュメント更新
git add SPECIFICATION.md
git commit -m "docs(spec): CORS設定の追加を記載"
```

### 参考文献

- [quickstart.md](./quickstart.md) - 動作確認手順の詳細
- [plan.md](./plan.md) - 実装計画と設計決定
- [spec.md](./spec.md) - 機能仕様とユーザーストーリー
- [CLAUDE.md](../../CLAUDE.md) - プロジェクト開発ガイドライン
