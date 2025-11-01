# Tasks: Docker ローカル開発環境

**Feature**: 013-docker-local-env
**Input**: `/specs/013-docker-local-env/` の設計ドキュメント
**Prerequisites**: plan.md, spec.md, research.md, contracts/, quickstart.md

**Tests**: ✅ **手動テスト中心** - インフラストラクチャコード（Dockerfile, docker-compose.yml）は設定ファイルのため、手動テストとIntegration Testを実施。HTTP Server Wrapper (`cmd/server/main.go`) のみTDD適用。

**Organization**: タスクはUser Storyごとにグループ化され、各Storyの独立した実装とテストを可能にする。

## Format: `- [ ] [ID] [P?] [Story?] 説明`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: このタスクが属するUser Story (US1, US2, US3)
- 説明には正確なファイルパスを含める

## パス規約

- **Webアプリ**: リポジトリルートにDockerファイル、`cmd/` にGoサーバー、`frontend/` にReact
- Backend: `cmd/server/main.go`, `pkg/`, `api/`
- Frontend: `frontend/src/`, `frontend/package.json`
- Docker: `Dockerfile.backend`, `Dockerfile.frontend`, `docker-compose.yml`, `.dockerignore`

---

## Phase 1: セットアップ（共通インフラ）

**Purpose**: Docker環境の基本ファイル作成と前提条件確認

- [ ] T001 Docker Desktopがインストールされ、起動していることを確認: `docker --version && docker-compose --version`
- [X] T002 [P] リポジトリルートに `.dockerignore` ファイルを作成
- [X] T003 [P] Goホットリロード用の `.air.toml` 設定ファイルをリポジトリルートに作成

**Checkpoint**: Docker環境の前提条件確認完了

---

## Phase 2: 基盤（ブロッキング要件）

**Purpose**: HTTP Server Wrapper作成（TDD適用） - 全User Storiesのブロッキング要件

**⚠️ CRITICAL**: このフェーズ完了後、User Story 1-3を並行実装可能

### TDD Phase: HTTP Server Wrapper (cmd/server/main.go)

**Strategy**: t-wada式TDD準拠 (Red-Green-Refactor)

#### 🔴 Red Phase: テストファースト

- [X] T004 [P] `cmd/server/main_test.go` にCORSヘッダーのユニットテストを作成 (Red - テスト失敗)
- [X] T005 [P] `cmd/server/main_test.go` にOPTIONSリクエスト処理のユニットテストを作成 (Red - テスト失敗)
- [X] T006 [P] `tests/integration/server_test.go` にAPIエンドポイントルーティングの統合テストを作成 (Red - テスト失敗)

**Checkpoint**: 全テストが期待通り失敗することを確認（Red完了）

#### ✅ Green Phase: 最小限の実装

- [X] T007 `cmd/server/` ディレクトリを作成
- [X] T008 `cmd/server/main.go` にHTTPサーバーラッパーとCORSミドルウェアを実装（テストを通す最小限の実装）
- [X] T009 テストを実行し、全て合格することを確認: `go test ./cmd/server/... -v && go test ./tests/integration/... -v`

**Checkpoint**: 全テストが合格（Green完了）

#### ♻️ Refactor Phase: コード品質向上

- [X] T010 Refactor: `cmd/server/main.go` のCORSミドルウェアを別関数に抽出
- [X] T011 Refactor: `cmd/server/main.go` に構造化ログを追加
- [X] T012 リファクタリング後にテストを実行し、リグレッションがないことを確認: `go test ./cmd/server/... -v`

**Checkpoint**: 基盤フェーズ完了 - HTTPサーバーがコンテナ化準備完了

---

## Phase 3: User Story 1 - 開発環境の即座起動 (Priority: P1) 🎯 MVP

**Goal**: 開発者が `docker-compose up` コマンド1つでバックエンドとフロントエンドの両方を起動し、ホットリロードが5分以内に動作する

**Independent Test**: `docker-compose up` を実行し、5分以内にバックエンド（http://localhost:8080/api/parse）とフロントエンド（http://localhost:5173）の両方がアクセス可能になることを確認

### バックエンドコンテナセットアップ

- [X] T013 [P] [US1] マルチステージビルドで `Dockerfile.backend` を作成 (Go 1.25.1-alpine)
- [X] T014 [P] [US1] ホットリロード用にAirインストールを `Dockerfile.backend` に追加
- [X] T015 [P] [US1] バックエンド準備完了確認用にヘルスチェックを `Dockerfile.backend` に追加

### フロントエンドコンテナセットアップ

- [X] T016 [P] [US1] `Dockerfile.frontend` を作成 (Node 25.0-alpine)
- [X] T017 [P] [US1] `Dockerfile.frontend` でVite dev serverを `--host 0.0.0.0` で設定

### Docker Composeオーケストレーション

- [X] T018 [US1] backendとfrontendサービスを含む `docker-compose.yml` を作成
- [X] T019 [US1] ホットリロード用にボリュームマウントを `docker-compose.yml` で設定:
  - Backend: `./:/app` (`frontend/` を除外)
  - Frontend: `./frontend:/app` (`node_modules` を保持)
- [X] T020 [US1] 環境変数を `docker-compose.yml` で設定:
  - Backend: `PORT=8080`
  - Frontend: `VITE_API_BASE_URL=http://localhost:8080`
- [X] T021 [US1] サービス依存関係を `docker-compose.yml` に追加 (frontendはbackendのhealthcheckに依存)
- [X] T022 [US1] ポートマッピングを `docker-compose.yml` で設定: backend `8080:8080`, frontend `5173:5173`

### 手動テスト（統合テスト）

- [X] T023 [US1] 手動テスト: `docker-compose up` を実行し、5分以内に起動完了を確認
- [X] T024 [US1] 手動テスト: http://localhost:8080/api/parse にPOSTリクエストを送信し、API応答を確認
- [X] T025 [US1] 手動テスト: http://localhost:5173 をブラウザで開き、フロントエンド表示を確認
- [X] T026 [US1] 手動テスト: バックエンドコード（`cmd/server/main.go`）を変更し、15秒以内に自動再起動を確認
- [X] T027 [US1] 手動テスト: フロントエンドコード（`frontend/src/App.tsx`）を変更し、15秒以内にブラウザ更新を確認

**Checkpoint**: User Story 1完了 - 開発環境起動とホットリロードが動作 🎯 **MVP達成**

---

## Phase 4: User Story 2 - 環境の確実な停止とクリーンアップ (Priority: P2)

**Goal**: 開発者が `docker-compose down` コマンドで環境を完全停止し、必要に応じてボリューム削除でクリーンアップできる

**Independent Test**: `docker-compose down` を実行し、全コンテナとネットワークが削除されることを確認。`docker-compose down -v` でボリュームも削除されることを確認

### ドキュメントとクリーンアップコマンド

- [X] T028 [P] [US2] クリーンアップコマンドを `docker-compose.yml` のコメントに追加 (stop, down, down -v)
- [X] T029 [P] [US2] quickstart.mdに「停止とクリーンアップ」セクションを追加

### 手動テスト

- [X] T030 [US2] 手動テスト: `docker-compose stop` を実行し、コンテナが停止することを確認
- [X] T031 [US2] 手動テスト: `docker-compose start` でコンテナが再開することを確認
- [X] T032 [US2] 手動テスト: `docker-compose down` を実行し、コンテナとネットワークが削除されることを確認（`docker ps -a` で確認）
- [X] T033 [US2] 手動テスト: `docker-compose up` で環境が再作成されることを確認
- [X] T034 [US2] 手動テスト: `docker-compose down -v` を実行し、ボリュームも削除されることを確認（`docker volume ls` で確認）

**Checkpoint**: User Story 2完了 - 停止とクリーンアップが正しく動作

---

## Phase 5: User Story 3 - エラー診断とログ確認 (Priority: P3)

**Goal**: 開発者が起動エラーやランタイムエラーの原因を `docker-compose logs` コマンドで5分以内に特定できる

**Independent Test**: 意図的にエラーを発生させ（ポート競合、存在しないファイル参照等）、`docker-compose logs` で原因を特定できることを確認

### エラーハンドリングとログ機能強化

- [X] T035 [P] [US3] `cmd/server/main.go` に起動ログを追加（サーバー起動メッセージ、ポート情報）
- [X] T036 [P] [US3] `cmd/server/main.go` にエラーログを追加（HTTPエラー、APIハンドラーエラー）
- [X] T037 [P] [US3] `docker-compose.yml` でdocker-composeのログ設定を追加（json-fileドライバー、max-size 10m）

### 手動テスト（エラーシナリオ）

- [X] T038 [US3] 手動テスト: ポート8080を別プロセスで使用中の状態で `docker-compose up` を実行し、エラーメッセージが明確か確認
- [X] T039 [US3] 手動テスト: Docker Desktopを停止した状態で `docker-compose up` を実行し、接続エラーメッセージを確認
- [X] T040 [US3] 手動テスト: `cmd/server/main.go` に意図的な構文エラーを入れ、ビルドエラーログを確認
- [X] T041 [US3] 手動テスト: `docker-compose logs backend` でバックエンドログのみ表示されることを確認
- [X] T042 [US3] 手動テスト: `docker-compose logs -f` でリアルタイムログが表示されることを確認

**Checkpoint**: User Story 3完了 - エラー診断とログ確認が効率的に実施可能

---

## Phase 6: 仕上げと横断的関心事

**Purpose**: 全User Storiesに影響する改善とドキュメント整備

### ドキュメント

- [X] T043 [P] Docker セットアップ手順をREADME.mdに追加
- [X] T044 [P] README.mdに「Dockerローカル開発」セクションをquickstartコマンドと共に追加
- [X] T045 [P] Docker環境の技術スタックをCLAUDE.mdに追加（エージェントスクリプトで未更新の場合）

### コード品質

- [X] T046 [P] `cmd/server/main.go` に `gofmt` を実行
- [X] T047 [P] `go mod tidy` を実行して依存関係をクリーンアップ
- [X] T048 [P] `.dockerignore` が全ての不要なファイルを除外することを確認（node_modules, .git, dist, coverage）

### パフォーマンス最適化

- [X] T049 `Dockerfile.backend` のDockerビルドキャッシュレイヤーを最適化（COPY . の前にCOPY go.mod）
- [X] T050 `Dockerfile.frontend` のDockerビルドキャッシュレイヤーを最適化（COPY . の前にCOPY package*.json）

### 最終検証

- [X] T051 クリーンな状態からquickstart.mdの全ワークフローを実行（docker-compose down -v → up）
- [X] T052 起動時間を測定して記録（初回ビルド、2回目以降のビルド、ホットリロード時間）
- [X] T053 spec.mdの全Success Criteriaを検証:
  - SC-001: 環境起動 < 5分
  - SC-002: ホットリロード < 15秒
  - SC-003: 起動成功率 > 95% (3回テスト)
  - SC-004: エラー診断 < 5分
  - SC-005: セットアップ時間削減 (記録)

**Checkpoint**: 全機能完成、本番準備完了

---

## 依存関係と実行順序

### Phase間の依存関係

- **セットアップ (Phase 1)**: 依存関係なし - 即座に開始可能
- **基盤 (Phase 2)**: セットアップ完了に依存 - 全User Storiesをブロック
  - T001-T003 (セットアップ) がT004の前に完了必須
  - T004-T012 (HTTP Server Wrapper) がUS1-US3をブロック
- **User Stories (Phase 3-5)**: 全て基盤フェーズ完了 (T012) に依存
  - US1, US2, US3 はT012完了後に並行実行可能（チーム容量による）
  - または優先順位順に逐次実行: US1 (MVP) → US2 → US3
- **仕上げ (Phase 6)**: 全User Storiesの完了に依存 (T043以降)

### User Story間の依存関係

- **User Story 1 (P1)**: T012 (HTTP Server) に依存 - US2/US3への依存なし
- **User Story 2 (P2)**: T012 (HTTP Server) に依存 - US1/US3への依存なし（但しUS1完了後の方がテスト効率的）
- **User Story 3 (P3)**: T012 (HTTP Server) に依存 - 推奨: US1完了後（エラーログがより意味を持つ）

### 各User Story内の依存関係

**User Story 1** (T013-T027):
- T013-T017: コンテナ定義（並列実行可能）
- T018-T022: Docker Composeセットアップ（逐次実行、T018が最初）
- T023-T027: 手動テスト（T022完了後に逐次実行）

**User Story 2** (T028-T034):
- T028-T029: ドキュメント（並列実行可能）
- T030-T034: 手動テスト（逐次実行）

**User Story 3** (T035-T042):
- T035-T037: ログ実装（並列実行可能）
- T038-T042: エラーシナリオテスト（逐次実行）

### 並列実行の機会

**セットアップフェーズ (T001-T003)**:
- T002 (.dockerignore) と T003 (.air.toml) は並列実行可能

**基盤フェーズ**:
- T004-T006 (テスト) は並列実行可能

**User Story 1**:
- T013-T015 (backendコンテナ) と T016-T017 (frontendコンテナ) は並列実行可能
- T018-T022 は逐次実行必須 (docker-compose.ymlの依存関係)

**User Story 2**:
- T028-T029 は並列実行可能

**User Story 3**:
- T035-T037 は並列実行可能

**仕上げフェーズ**:
- T043-T048 は全て並列実行可能
- T049-T050 は並列実行可能

---

## 並列実行例: User Story 1

```bash
# T012 (HTTP Server) 完了後、以下のタスクを並列実行:

# ターミナル 1: バックエンドコンテナ
Task: "マルチステージビルドで Dockerfile.backend を作成 (Go 1.25.1-alpine)"
Task: "Airインストールを Dockerfile.backend に追加"
Task: "ヘルスチェックを Dockerfile.backend に追加"

# ターミナル 2: フロントエンドコンテナ（ターミナル1と並行）
Task: "Dockerfile.frontend を作成 (Node 25.0-alpine)"
Task: "Vite dev serverを Dockerfile.frontend で設定"

# 両方のコンテナ完了後、docker-compose.yml の設定を逐次実行
```

---

## 実装戦略

### MVPファースト (User Story 1のみ) - 推奨

1. Phase 1完了: セットアップ (T001-T003) → ~10分
2. Phase 2完了: 基盤 (T004-T012) → ~30分 (TDD)
3. Phase 3完了: User Story 1 (T013-T027) → ~60分
4. **停止して検証**: 手動テスト (T023-T027) で完全動作確認
5. **MVP完成** 🎯 - ローカル開発環境が起動可能

**MVP所要時間見積もり**: ~1.5時間

### 段階的デリバリー

1. **基盤** (T001-T012) → 環境準備完了
2. **MVP** (T013-T027) → ローカル開発環境起動 🎯
3. **+クリーンアップ** (T028-T034) → 環境停止・クリーンアップ機能追加
4. **+ログ** (T035-T042) → エラー診断機能追加
5. **+仕上げ** (T043-T053) → ドキュメント整備、最適化

### 並列チーム戦略

開発者2名の場合:

1. **一緒に**: Phase 1 (セットアップ) + Phase 2 (基盤) → T001-T012
2. **T012完了後に分担**:
   - **開発者A**: User Story 1 (T013-T027) - Backend + Frontend コンテナ
   - **開発者B**: User Story 2 (T028-T034) - クリーンアップドキュメント（早期開始可能）
3. **US1完了後**:
   - **開発者A**: User Story 3 (T035-T042) - ログ機能
   - **開発者B**: 仕上げ (T043-T050) - ドキュメント + 最適化
4. **一緒に**: 最終検証 (T051-T053)

---

## Notes

### TDD Compliance

- **HTTP Server Wrapper (cmd/server/main.go)**: 厳格なTDD適用 (T004-T012)
  - Red → Green → Refactor サイクル遵守
  - テストファーストで実装
- **インフラストラクチャコード**: 手動テスト中心
  - Dockerfile, docker-compose.yml, .air.toml は設定ファイル
  - Integration Test (手動) で検証

### Manual Testing Strategy

- 各User Storyの最後に手動テストタスク配置
- Success Criteria (spec.md) との整合性確認を最終検証 (T053) で実施

### Commit Strategy

推奨コミット例:
```bash
# Foundational Phase (TDD)
git commit -m "test(server): Add CORS header tests (Red)"
git commit -m "feat(server): Implement HTTP server wrapper (Green)"
git commit -m "refactor(server): Extract CORS middleware (Refactor)"

# User Story 1
git commit -m "feat(docker): Add backend Dockerfile with Air"
git commit -m "feat(docker): Add frontend Dockerfile with Vite"
git commit -m "feat(docker): Add docker-compose.yml orchestration"
git commit -m "test(docker): Verify US1 - environment startup and hot reload"

# User Story 2
git commit -m "docs(docker): Add cleanup commands to quickstart"
git commit -m "test(docker): Verify US2 - environment cleanup"

# User Story 3
git commit -m "feat(server): Add structured logging"
git commit -m "test(docker): Verify US3 - error diagnostics"

# Polish
git commit -m "docs(readme): Add Docker setup instructions"
git commit -m "perf(docker): Optimize build cache layers"
git commit -m "test(docker): Final validation - all Success Criteria verified"
```

### Success Criteria Mapping

- **SC-001** (起動 < 5分): T023で検証
- **SC-002** (ホットリロード < 15秒): T026-T027で検証
- **SC-003** (起動成功率 > 95%): T053で3回テスト
- **SC-004** (エラー診断 < 5分): T038-T042で検証
- **SC-005** (セットアップ時間削減): T052で測定

### File Path Reference

**New Files (this feature)**:
- `cmd/server/main.go` - HTTP server wrapper
- `cmd/server/main_test.go` - Unit tests for server
- `tests/integration/server_test.go` - Integration test
- `Dockerfile.backend` - Backend container definition
- `Dockerfile.frontend` - Frontend container definition
- `docker-compose.yml` - Service orchestration
- `.dockerignore` - Build optimization
- `.air.toml` - Go hot reload configuration

**Updated Files**:
- `README.md` - Docker setup instructions
- `CLAUDE.md` - Technology stack update (auto-updated)

---

## タスクサマリー

**総タスク数**: 53

### フェーズ別:
- Phase 1 (セットアップ): 3タスク (T001-T003)
- Phase 2 (基盤): 9タスク (T004-T012) - **全User Storyをブロック**
- Phase 3 (User Story 1 - P1): 15タスク (T013-T027) 🎯 **MVP**
- Phase 4 (User Story 2 - P2): 7タスク (T028-T034)
- Phase 5 (User Story 3 - P3): 8タスク (T035-T042)
- Phase 6 (仕上げ): 11タスク (T043-T053)

### タイプ別:
- TDDテスト (Red Phase): 3タスク (T004-T006)
- 実装: 32タスク
- 手動テスト: 18タスク
- ドキュメント: 5タスク
- 最適化: 2タスク
- 検証: 3タスク

### 並列実行可能タスク:
- [P]マーク付きの22タスクは並列実行可能

### 推定時間:
- MVP (T001-T027): 約1.5時間
- 全機能 (T001-T053): 約3-4時間

---

**フォーマット検証**: ✅ 全タスクが `- [ ] [TaskID] [P?] [Story?] ファイルパス付き説明` の形式に準拠
