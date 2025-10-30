# Feature Specification: フィードプレビュー取得時のAbortController処理修正

**Feature Branch**: `010-fix-feed-preview`
**Created**: 2025-10-31
**Status**: Draft
**Input**: User description: "RSSフィード購読時、ユーザーがURL入力フィールドに2件目以降のフィードURLを入力する際、フィードタイトルのプレビュー取得が正しく動作していない問題を修正する。外部からのAbortSignalによるキャンセルとタイムアウトを正しく区別し、意図的なキャンセルの場合はAbortErrorをそのまま再スローすることで、プレビュー取得機能を正常に動作させる。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 2件目以降のフィードURL入力時のプレビュー表示 (Priority: P1)

ユーザーが既に1件以上のRSSフィードを購読している状態で、新しいフィードを追加するためにURL入力フィールドに2件目以降のフィードURLを入力すると、そのフィードのタイトルがプレビューとして正しく表示される。

**Why this priority**: これは現在動作していない主要な機能であり、ユーザーが複数のフィードを購読する際の基本的なUXを提供するため、最優先で修正する必要がある。

**Independent Test**: URL入力フィールドに有効なRSSフィードURLを入力し、500msのデバウンス後にフィードタイトルのプレビューが表示されることを確認することで独立してテスト可能。

**Acceptance Scenarios**:

1. **Given** 1件のRSSフィードが既に購読されている状態、**When** ユーザーがURL入力フィールドに2件目の有効なフィードURLを入力、**Then** 入力停止から500ms後にフィードタイトルのプレビューが表示される
2. **Given** URL入力フィールドが空の状態、**When** ユーザーが最初のフィードURLを入力、**Then** プレビューが正しく表示される（既存機能の継続動作確認）

---

### User Story 2 - URL入力の連続変更時のデバウンス処理 (Priority: P2)

ユーザーがURL入力フィールドで連続してURLを変更した場合、デバウンス処理により最後の入力に対してのみプレビュー取得が実行され、不要なAPI呼び出しが抑制される。

**Why this priority**: パフォーマンス最適化とAPI負荷軽減のための重要な機能だが、P1の基本機能が動作すれば最低限の価値は提供できる。

**Independent Test**: URL入力フィールドで短時間に複数回URLを変更し、最後の入力のみに対してプレビュー取得が実行されることをAPI呼び出し回数で確認することで独立してテスト可能。

**Acceptance Scenarios**:

1. **Given** URL入力フィールドが空の状態、**When** ユーザーが500ms以内に3回異なるURLを入力、**Then** 最後のURL入力から500ms後に1回だけプレビュー取得が実行される
2. **Given** プレビュー取得が実行中の状態、**When** ユーザーが新しいURLを入力、**Then** 実行中のリクエストがキャンセルされ、新しいURLに対するプレビュー取得が開始される

---

### User Story 3 - タイムアウト時のエラー表示 (Priority: P3)

プレビュー取得がタイムアウト（10秒）した場合、ユーザーに適切なエラーメッセージが表示される。

**Why this priority**: エラーハンドリングの改善であり、基本機能が動作すればユーザー体験の最低要件は満たせる。

**Independent Test**: モックサーバーで10秒以上かかるレスポンスを返し、タイムアウトエラーメッセージが表示されることを確認することで独立してテスト可能。

**Acceptance Scenarios**:

1. **Given** URL入力フィールドに有効なフィードURLを入力、**When** プレビュー取得が10秒でタイムアウト、**Then** 「APIリクエストがタイムアウトしました」というエラーメッセージが表示される

---

### Edge Cases

- ユーザーがURL入力中にフィールドを空にした場合、プレビュー表示とローディング状態がクリアされるか？
- 複数のフィードを連続して追加した場合（1件目追加→2件目入力→3件目入力）、プレビュー取得が正しく動作するか？
- プレビュー取得中にコンポーネントがアンマウントされた場合、実行中のリクエストが正しくキャンセルされるか？

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: システムは外部からのAbortSignalによるキャンセルとタイムアウトを区別しなければならない
- **FR-002**: 外部からのAbortSignalによるキャンセルの場合、AbortErrorをそのまま再スローしなければならない
- **FR-003**: タイムアウトの場合、FeedAPIErrorでラップして「APIリクエストがタイムアウトしました」というメッセージを含めなければならない
- **FR-004**: useFeedPreviewフックはAbortErrorを無視し、意図的なキャンセルとして処理しなければならない
- **FR-005**: 2件目以降のフィードURL入力時、1件目と同様にフィードタイトルのプレビューが表示されなければならない

### Key Entities *(include if feature involves data)*

- **AbortController**: リクエストのキャンセルを管理するオブジェクト。外部からのAbortSignalとタイムアウトによるAbortを区別する必要がある
- **FeedAPIError**: API関連のエラーを表すカスタムエラークラス。タイムアウトエラーをラップする

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 2件目以降のフィードURL入力時、フィードタイトルのプレビューが1件目と同じ動作（入力停止から500ms後に表示）で正しく表示される
- **SC-002**: URL入力を短時間（500ms以内）に3回変更した場合、API呼び出しは1回のみ実行される
- **SC-003**: プレビュー取得がタイムアウト（10秒）した場合、適切なエラーメッセージが100%の確率で表示される
- **SC-004**: 既存のプレビュー取得機能（1件目のフィード追加時）が引き続き正常に動作する

## Assumptions

- フィードプレビュー取得のデバウンス遅延は500msで固定
- API呼び出しのタイムアウトは10秒で固定
- AbortControllerはブラウザでサポートされている（モダンブラウザ前提）
- 外部からのAbortSignalによるキャンセルは、ユーザーのURL入力変更時のデバウンス処理でのみ発生する

## Dependencies

- 既存のuseFeedPreviewフックの実装（frontend/src/hooks/useFeedPreview.ts）
- 既存のfeedAPI.tsの実装（frontend/src/services/feedAPI.ts）
- FeedManagerコンポーネントのURL入力処理（frontend/src/components/FeedManager/FeedManager.tsx）

## Out of Scope

- デバウンス遅延時間の変更または設定可能化
- タイムアウト時間の変更または設定可能化
- プレビュー取得以外のAPI呼び出しへの影響
- 新しいエラーハンドリング機能の追加（既存のエラー表示UIを使用）
