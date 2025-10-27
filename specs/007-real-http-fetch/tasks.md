# Tasks: 実際のHTTP GETによるRSSフィード取得

**Input**: Design documents from `/specs/007-real-http-fetch/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: 既存のテスト構造を維持し、HTTP GET機能をテストするために更新します。

**Organization**: タスクはユーザーストーリー別に整理され、各ストーリーを独立して実装・テストできるようになっています。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: どのユーザーストーリーに属するか（US1, US2, US3）
- 説明には正確なファイルパスを含む

## Path Conventions

このプロジェクトはWeb application構造を採用：
- **バックエンド**: `pkg/services/`, `pkg/models/`
- **API**: `api/`
- **テスト**: `tests/unit/`, `tests/integration/`, `tests/contract/`

---

## Phase 1: Setup（共有インフラストラクチャ）

**Purpose**: プロジェクトの初期化と基本構造（すでに存在するため、追加セットアップなし）

✅ **このフェーズは完了済み** - 既存のプロジェクト構造、Go環境、依存関係はすでに整っています。

---

## Phase 2: Foundational（ブロッキング前提条件）

**Purpose**: すべてのユーザーストーリーを実装する前に完了する必要があるコアインフラストラクチャ

**⚠️ CRITICAL**: このフェーズが完了するまで、ユーザーストーリーの作業を開始できません

- [ ] T001 `pkg/services/rss_service.go` の RSSService 構造体に httpClient フィールドを追加
- [ ] T002 `pkg/services/rss_service.go` の NewRSSService() にHTTPクライアント設定を追加（タイムアウト10秒、リダイレクト最大10回）

**Checkpoint**: 基盤準備完了 - ユーザーストーリーの実装を並列に開始可能

---

## Phase 3: User Story 1 - 実際のRSSフィードの取得 (Priority: P1) 🎯 MVP

**Goal**: ダミーレスポンスを実際のHTTP GETリクエストに置き換え、実際のRSSフィードを取得してパースする

**Independent Test**: 有効なRSSフィードURLをPOSTリクエストで送信し、実際のフィードコンテンツがパースされて返されることを確認

### Implementation for User Story 1

- [ ] T003 [US1] `pkg/services/rss_service.go` の ParseFeeds メソッド内のダミーレスポンス部分を削除（112-142行目）
- [ ] T004 [US1] `pkg/services/rss_service.go` に HTTP GET リクエスト作成ロジックを実装（http.NewRequestWithContext使用）
- [ ] T005 [US1] `pkg/services/rss_service.go` に User-Agent ヘッダー設定を追加（"feed-parallel-parse-api/1.0 (RSS Reader)"）
- [ ] T006 [US1] `pkg/services/rss_service.go` に HTTP GET リクエスト実行ロジックを実装（s.httpClient.Do使用）
- [ ] T007 [US1] `pkg/services/rss_service.go` に レスポンスボディ読み取りロジックを実装（io.ReadAll使用）
- [ ] T008 [US1] `pkg/services/rss_service.go` に既存の gofeed パーサーとの統合を実装（parser.ParseString使用）
- [ ] T009 [US1] `pkg/services/rss_service.go` に成功時のレスポンス処理を実装（feedToRSSFeed変換）

### Tests for User Story 1

- [ ] T010 [P] [US1] `tests/unit/rss_service_test.go` に httptest.Server を使用した正常系テストを追加（TestParseFeeds_RealHTTP_Success）
- [ ] T011 [P] [US1] `tests/unit/rss_service_test.go` に RSS2.0 フィード取得テストを追加（TestParseFeeds_RSS20）
- [ ] T012 [P] [US1] `tests/unit/rss_service_test.go` に Atom フィード取得テストを追加（TestParseFeeds_Atom）
- [ ] T013 [US1] `tests/contract/parse_api_test.go` を更新して実際のHTTP取得動作を検証
- [ ] T014 [US1] `tests/integration/performance_test.go` を更新して実際のフィード取得のパフォーマンスを測定

**Checkpoint**: この時点で、User Story 1 は完全に機能し、独立してテスト可能

---

## Phase 4: User Story 2 - HTTPエラーハンドリング (Priority: P2)

**Goal**: HTTPエラー（4xx、5xx）やネットワークエラーを適切に処理し、エラー情報を返す

**Independent Test**: 無効なURL（404エラーを返すURLなど）を含むリクエストを送信し、該当URLにはエラー情報が返され、他の有効なURLは正常に処理されることを確認

### Implementation for User Story 2

- [ ] T015 [US2] `pkg/services/rss_service.go` に HTTPステータスコードチェックを追加（200以外はエラー）
- [ ] T016 [US2] `pkg/services/rss_service.go` に HTTPエラーメッセージ生成ロジックを追加（"HTTPエラー: %d %s"形式）
- [ ] T017 [US2] `pkg/services/rss_service.go` に ネットワークエラーハンドリングを追加（DNS解決失敗、接続失敗など）
- [ ] T018 [US2] `pkg/services/rss_service.go` に パースエラーハンドリングを追加（無効なRSS/Atom形式）
- [ ] T019 [US2] `pkg/services/rss_service.go` に リクエスト作成エラーハンドリングを追加
- [ ] T020 [US2] `pkg/services/rss_service.go` に ボディ読み取りエラーハンドリングを追加

### Tests for User Story 2

- [ ] T021 [P] [US2] `tests/unit/rss_service_test.go` に 404エラーテストを追加（TestParseFeeds_HTTP404）
- [ ] T022 [P] [US2] `tests/unit/rss_service_test.go` に 500エラーテストを追加（TestParseFeeds_HTTP500）
- [ ] T023 [P] [US2] `tests/unit/rss_service_test.go` に 無効なURLテストを追加（TestParseFeeds_InvalidURL）
- [ ] T024 [P] [US2] `tests/unit/rss_service_test.go` に パースエラーテストを追加（TestParseFeeds_ParseError）
- [ ] T025 [US2] `tests/integration/error_test.go` を更新してHTTPエラーケースを追加
- [ ] T026 [US2] `tests/integration/error_test.go` に 混在URL（正常+エラー）テストを追加

**Checkpoint**: この時点で、User Stories 1 AND 2 は両方とも独立して動作

---

## Phase 5: User Story 3 - ネットワークタイムアウト設定 (Priority: P3)

**Goal**: 適切なタイムアウト時間を設定し、応答が遅いサーバーに対して無限に待機しないようにする

**Independent Test**: 意図的に遅いレスポンスを返すモックサーバーに対してリクエストを送信し、設定されたタイムアウト時間内にエラーが返されることを確認

### Implementation for User Story 3

✅ **このストーリーは Phase 2 で完了済み** - T002 でHTTPクライアントにタイムアウト10秒を設定済み

### Tests for User Story 3

- [ ] T027 [P] [US3] `tests/unit/rss_service_test.go` に タイムアウトテストを追加（TestParseFeeds_Timeout）
- [ ] T028 [P] [US3] `tests/unit/rss_service_test.go` に タイムアウト内完了テストを追加（TestParseFeeds_WithinTimeout）
- [ ] T029 [US3] `tests/integration/performance_test.go` に タイムアウト動作の検証を追加

**Checkpoint**: すべてのユーザーストーリーが独立して機能可能

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 複数のユーザーストーリーに影響する改善

- [ ] T030 [P] すべてのエラーメッセージが日本語で適切に表示されることを確認
- [ ] T031 [P] コードのリファクタリング（重複コード削除、可読性向上）
- [ ] T032 すべてのテストを実行して合格することを確認（go test ./...）
- [ ] T033 quickstart.md の手順に従ってローカル動作確認を実施
- [ ] T034 [P] vercel dev でAPIをローカル起動し、curlでテスト
- [ ] T035 実際の公開RSSフィード（例: https://example.com/feed.xml）で動作確認

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 完了済み - 依存関係なし
- **Foundational (Phase 2)**: Setup完了後 - すべてのユーザーストーリーをブロック
- **User Stories (Phase 3-5)**: すべてFoundational phase完了に依存
  - ユーザーストーリーは並列に進行可能（スタッフがいれば）
  - または優先順位順に順次実行（P1 → P2 → P3）
- **Polish (Phase 6)**: すべての希望するユーザーストーリーが完了に依存

### User Story Dependencies

- **User Story 1 (P1)**: Foundational (Phase 2)完了後に開始可能 - 他のストーリーに依存なし
- **User Story 2 (P2)**: Foundational (Phase 2)完了後に開始可能 - US1の実装に依存（HTTP GETロジックが必要）
- **User Story 3 (P3)**: Foundational (Phase 2)で完了済み - テストのみ残っている

### Within Each User Story

- 実装タスクは順次実行（T003 → T004 → ... → T009）
- テストタスクは並列実行可能（[P]マーク付き）
- 実装完了後にテスト実行

### Parallel Opportunities

- Foundational tasks (T001, T002) は並列実行可能
- User Story 1 のテスト (T010, T011, T012) は並列実行可能
- User Story 2 のテスト (T021-T024) は並列実行可能
- User Story 3 のテスト (T027, T028) は並列実行可能
- Polish phase の独立タスク (T030, T031, T034) は並列実行可能

---

## Parallel Example: User Story 1

```bash
# User Story 1 の全テストを一緒に起動:
Task: "httptest.Server を使用した正常系テストを追加 in tests/unit/rss_service_test.go"
Task: "RSS2.0 フィード取得テストを追加 in tests/unit/rss_service_test.go"
Task: "Atom フィード取得テストを追加 in tests/unit/rss_service_test.go"

# User Story 2 のエラーハンドリングテストを一緒に起動:
Task: "404エラーテストを追加 in tests/unit/rss_service_test.go"
Task: "500エラーテストを追加 in tests/unit/rss_service_test.go"
Task: "無効なURLテストを追加 in tests/unit/rss_service_test.go"
Task: "パースエラーテストを追加 in tests/unit/rss_service_test.go"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup ✅（完了済み）
2. Complete Phase 2: Foundational（T001-T002）- すべてのストーリーをブロック
3. Complete Phase 3: User Story 1（T003-T014）
4. **STOP and VALIDATE**: User Story 1 を独立してテスト
5. 準備ができたらデプロイ/デモ

### Incremental Delivery

1. Setup + Foundational を完了 → 基盤準備完了
2. User Story 1 を追加 → 独立してテスト → デプロイ/デモ（MVP!）
3. User Story 2 を追加 → 独立してテスト → デプロイ/デモ
4. User Story 3 を追加 → 独立してテスト → デプロイ/デモ
5. 各ストーリーは、以前のストーリーを壊すことなく価値を追加

### Parallel Team Strategy

複数の開発者がいる場合：

1. チームで Setup + Foundational を一緒に完了
2. Foundational 完了後:
   - Developer A: User Story 1（T003-T014）
   - Developer B: User Story 2（T015-T026、US1完了待ち）
   - Developer C: User Story 3（T027-T029、テストのみ）
3. ストーリーは独立して完了し、統合

---

## Task Summary

### Total Tasks: 35

- **Phase 1 (Setup)**: 0 tasks（完了済み）
- **Phase 2 (Foundational)**: 2 tasks
- **Phase 3 (US1)**: 12 tasks（実装7 + テスト5）
- **Phase 4 (US2)**: 12 tasks（実装6 + テスト6）
- **Phase 5 (US3)**: 3 tasks（テストのみ、実装は Phase 2 で完了済み）
- **Phase 6 (Polish)**: 6 tasks

### Tasks per User Story

- **User Story 1 (P1)**: 12 tasks
- **User Story 2 (P2)**: 12 tasks
- **User Story 3 (P3)**: 3 tasks（実装は Foundational で完了済み）

### Parallel Opportunities

- Foundational: 2 tasks（T001, T002 は異なる部分に追加）
- User Story 1 tests: 3 tasks（T010, T011, T012）
- User Story 2 tests: 4 tasks（T021-T024）
- User Story 3 tests: 2 tasks（T027, T028）
- Polish: 3 tasks（T030, T031, T034）

### Independent Test Criteria

- **US1**: 有効なRSSフィードURLから実際のコンテンツを取得し、パースして返せる
- **US2**: HTTPエラーやネットワークエラーを適切に処理し、エラー情報を返せる
- **US3**: タイムアウトが正しく動作し、遅いサーバーに対して無限待機しない

### Suggested MVP Scope

**MVP = User Story 1 のみ**

最小限の価値提供：
- ダミーレスポンスから実際のHTTP GETへの移行
- 実際のRSSフィードを取得してパース
- 基本的な動作確認

その後、US2（エラーハンドリング）とUS3（タイムアウト）を順次追加して、堅牢性を向上。

---

## Notes

- [P] タスク = 異なるファイル、依存関係なし
- [Story] ラベルは特定のユーザーストーリーにタスクをマッピング
- 各ユーザーストーリーは独立して完了・テスト可能
- 実装前にテストが失敗することを確認
- 各タスクまたは論理グループの後にコミット
- 任意のチェックポイントで停止してストーリーを独立検証
- 避けるべき: 曖昧なタスク、同じファイルの競合、独立性を損なうストーリー間の依存関係