# Feature Specification: コードベース全体のリファクタリング

**Feature Branch**: `015-codebase-refactoring`
**Created**: 2025-11-02
**Status**: Draft
**Input**: User description: "コードベース全体のリファクタリングを実施する。対象は14箇所（優先度「高」5箇所、「中」7箇所、「低」2箇所）。目的はコード品質向上、保守性改善、パフォーマンス最適化。"

## User Scenarios & Testing

### User Story 1 - API層の保守性向上 (Priority: P1)

開発者として、APIエラーが発生した際に、エラーの種類（タイムアウト、ネットワークエラー、パースエラー）を明確に特定できるようにしたい。これにより、デバッグ時間を短縮し、適切なエラーハンドリングを実装できる。

**Why this priority**: API層は全てのフィード取得処理の基盤であり、エラーハンドリングの改善は全体のユーザー体験に直結する。現状では重複コードが約70行存在し、保守性が低い状態。

**Independent Test**: feedAPI.tsのユニットテストを実行し、各エラー種別が正しく分類されることを確認できる。既存の機能に影響を与えずに独立してテスト可能。

**Acceptance Scenarios**:

1. **Given** API呼び出しがタイムアウトした場合、**When** エラーが発生する、**Then** エラー種別が "timeout" として明確に識別される
2. **Given** ネットワークエラーが発生した場合、**When** API呼び出しが失敗する、**Then** エラー種別が "network" として明確に識別される
3. **Given** API応答のパースに失敗した場合、**When** データ処理が失敗する、**Then** エラー種別が "parse" として明確に識別される
4. **Given** parseFeeds()とfetchFeedTitle()を実行する場合、**When** 共通のAPI呼び出しロジックを使用する、**Then** コードの重複が排除され、約70行のコードが削減される

---

### User Story 2 - 状態管理の簡素化 (Priority: P1)

開発者として、フィードプレビューの状態（ローディング中、成功、エラー）を一元管理したい。これにより、状態の不整合によるバグを防ぎ、新機能追加時の保守性を向上させる。

**Why this priority**: 現状では複数の状態変数を個別に更新しており、不整合が発生しやすい。状態管理の簡素化は、今後の機能拡張においても重要な基盤となる。

**Independent Test**: useFeedPreview.tsのテストケースを実行し、状態遷移が正しく動作することを確認できる。既存のプレビュー機能に影響を与えずに独立してテスト可能。

**Acceptance Scenarios**:

1. **Given** フィードプレビューが開始される、**When** ローディング状態に遷移する、**Then** state.state が 'loading' に設定され、他の状態変数との不整合が発生しない
2. **Given** プレビューが成功する、**When** データが取得される、**Then** state.state が 'success' に設定され、データが正しく格納される
3. **Given** プレビューが失敗する、**When** エラーが発生する、**Then** state.state が 'error' に設定され、エラーメッセージが正しく格納される
4. **Given** ArticleContext.tsxのreducerで複数のアクションが実行される、**When** filterArticles()が呼ばれる、**Then** 共通のフィルタリング処理が一元化され、状態同期ロジックが簡潔になる

---

### User Story 3 - useEffectの複雑度削減 (Priority: P2)

開発者として、FeedContainer.tsxの複雑なuseEffect（8個）を理解しやすくしたい。これにより、新規開発者のオンボーディング時間を短縮し、バグ修正時の影響範囲を把握しやすくする。

**Why this priority**: 現状では8個のuseEffectと複数のeslint-disableコメントがあり、リーダビリティが低い。カスタムフックへの集約により、依存配列管理が簡素化される。

**Independent Test**: FeedContainer.tsxのテストケースを実行し、フィード同期ロジックが正しく動作することを確認できる。既存のフィード表示機能に影響を与えずに独立してテスト可能。

**Acceptance Scenarios**:

1. **Given** useFeedSync()カスタムフックが作成される、**When** FeedContainer.tsxでフィード同期ロジックを使用する、**Then** 8個のuseEffectが集約され、コードの可読性が向上する
2. **Given** カスタムフックで依存配列を管理する、**When** 状態変化が発生する、**Then** eslint-disableコメントが不要になり、依存配列の管理が簡潔になる

---

### User Story 4 - パフォーマンス最適化 (Priority: P2)

開発者として、検索バーのdebounce機能を正しく動作させたい。これにより、ユーザーが入力中に不要なAPI呼び出しが発生せず、パフォーマンスが向上する。

**Why this priority**: 現状ではonSearchが毎回新規作成されるとuseEffectが再実行され、debounceが機能しない可能性がある。パフォーマンス最適化はユーザー体験に直結する。

**Independent Test**: SearchBar.tsxのテストケースを実行し、debounce機能が正しく動作することを確認できる。検索機能に影響を与えずに独立してテスト可能。

**Acceptance Scenarios**:

1. **Given** ユーザーが検索バーに文字を入力する、**When** 連続して文字を入力する、**Then** debounce機能により、最後の入力から指定時間経過後にのみ検索処理が実行される
2. **Given** FeedManager.tsxのuseMemo依存配列が最適化される、**When** subscriptionListItemsが再計算される、**Then** 過剰なメモ化が削減され、キャッシュ効果が向上する

---

### User Story 5 - バックエンド設定の柔軟性向上 (Priority: P3)

開発者として、CORS設定を環境変数で制御できるようにしたい。これにより、開発環境、ステージング環境、本番環境で異なるCORS設定を簡単に適用できる。

**Why this priority**: 現状ではCORS Originが "*" にハードコード化されており、セキュリティリスクがある。環境変数化により、柔軟性とセキュリティが向上する。

**Independent Test**: main.goのテストケースを実行し、環境変数からCORS設定が正しく読み込まれることを確認できる。既存のAPI機能に影響を与えずに独立してテスト可能。

**Acceptance Scenarios**:

1. **Given** 環境変数CORS_ALLOWED_ORIGINSが設定される、**When** サーバーが起動する、**Then** 指定されたOriginのみがCORSで許可される
2. **Given** logger設計が改善される、**When** テストを実行する、**Then** dependency injectionにより、logger初期化チェックが不要になる

---

### User Story 6 - コード品質向上 (Priority: P3)

開発者として、エラーメッセージを一元管理したい。これにより、エラーメッセージの一貫性が保たれ、多言語対応時の保守性が向上する。

**Why this priority**: 現状ではエラーメッセージが定数ファイルとコンポーネント内に分散しており、保守性が低い。優先度は低いが、将来的な拡張性を考慮すると重要。

**Independent Test**: エラーメッセージ定数ファイルを参照するコンポーネントのテストケースを実行し、エラーメッセージが正しく表示されることを確認できる。

**Acceptance Scenarios**:

1. **Given** 全てのエラーメッセージがerrorMessages.tsで定義される、**When** コンポーネントでエラーが発生する、**Then** 一元管理されたエラーメッセージが表示される
2. **Given** 変数名が明確化される、**When** コードをレビューする、**Then** updatedSubscriptions → subscriptionsWithFetchedTitles のように、変数の意味が推測しやすくなる
3. **Given** useFeedAPI.ts内の関数が分離される、**When** ユニットテストを実行する、**Then** findMatchingFeed、transformArticlesがユーティリティ関数として独立してテスト可能になる

---

### Edge Cases

- リファクタリング中に既存のテストが失敗した場合、どのようにロールバックするか？
- リファクタリング後に新たなバグが発見された場合、どのように対応するか？
- 各フェーズの実施中に他の開発者が同じファイルを変更した場合、どのようにマージコンフリクトを解決するか？
- パフォーマンス最適化後に、実際のパフォーマンス改善効果が測定できない場合、どのように評価するか？

## Requirements

### Functional Requirements

- **FR-001**: API層はエラー種別（timeout、network、parse）を明確に区別するenumを定義すること
- **FR-002**: parseFeeds()とfetchFeedTitle()で共通のAPI呼び出しロジック（createFeedAPIRequest()）を使用し、コードの重複を排除すること
- **FR-003**: FeedAPIErrorはAbortError専用クラスで拡張され、キャンセル原因を型安全に判定できること
- **FR-004**: useFeedPreview.tsの状態管理は単一の状態オブジェクト（state: 'idle' | 'loading' | 'success' | 'error'）で一元化されること
- **FR-005**: ArticleContext.tsxのreducerでfilterArticles()が共通のフィルタリング処理として一元化されること
- **FR-006**: FeedContainer.tsxの8個のuseEffectがカスタムフックuseFeedSync()に集約されること
- **FR-007**: SearchBar.tsxのdebounce実装がuseCallbackまたはカスタムフックuseDebounce()で改善されること
- **FR-008**: FeedManager.tsxのuseMemo依存配列が最適化され、過剰なメモ化が削減されること
- **FR-009**: main.goのlogger設計がdependency injectionまたはinit関数で改善されること
- **FR-010**: CORS設定が環境変数CORS_ALLOWED_ORIGINSから読み込まれること
- **FR-011**: useFeedAPI.ts内のfindMatchingFeed()とtransformArticles()がユーティリティ関数として分離されること
- **FR-012**: 全てのエラーメッセージがerrorMessages.tsで一元管理されること
- **FR-013**: updatedSubscriptionsがsubscriptionsWithFetchedTitlesのように明確な変数名に変更されること
- **FR-014**: 各フェーズ完了後に`npm test`を実行し、既存のテストが全てパスすること
- **FR-015**: リファクタリング後も既存機能の動作が保証されること（破壊的変更なし）

## Success Criteria

### Measurable Outcomes

- **SC-001**: API層のコード重複が約70行削減され、保守性が向上する
- **SC-002**: FeedContainer.tsxのuseEffectが8個から1個のカスタムフックに集約され、コードの可読性が40%向上する（行数ベース）
- **SC-003**: useFeedPreview.tsの状態管理が単一オブジェクトに統一され、状態の不整合によるバグが発生しない
- **SC-004**: SearchBar.tsxのdebounce機能が正しく動作し、ユーザー入力中の不要なAPI呼び出しが0件になる
- **SC-005**: 全てのテストケース（npm test）が引き続きパスし、既存機能の動作が保証される
- **SC-006**: リファクタリング後のコードカバレッジが現状と同等以上（減少しない）
- **SC-007**: エラーメッセージが一元管理され、コンポーネント内のエラーメッセージ定義が0件になる
- **SC-008**: CORS設定が環境変数で制御でき、環境ごとに異なる設定を適用できる
- **SC-009**: logger設計が改善され、テスト時の初期化チェックが不要になる
- **SC-010**: 変数名の明確化により、コードレビュー時の質問件数が減少する

## Assumptions

- 既存のテストスイートが十分なカバレッジを持っており、リファクタリング後の動作を保証できる
- リファクタリング中は他の開発者による同一ファイルの変更が少ない、またはマージコンフリクトが発生した場合は適切に解決できる
- パフォーマンス最適化の効果は、既存のテスト実行時間やブラウザのパフォーマンス計測ツールで確認できる
- 環境変数CORS_ALLOWED_ORIGINSはデプロイ時に適切に設定される
- リファクタリングは段階的に実施され、各フェーズごとにテストとレビューが行われる

## Out of Scope

以下はこのリファクタリングの範囲外とします：

- 新機能の追加（既存機能の動作を変更しない）
- データベーススキーマの変更
- 外部APIとの統合変更
- UIデザインの変更
- 多言語対応（エラーメッセージの一元管理は行うが、翻訳は含まない）
- パフォーマンスベンチマークの自動化（既存のテストフレームワークの範囲内で評価）
