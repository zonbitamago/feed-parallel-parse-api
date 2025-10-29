# Feature Specification: フィード登録時のタイトル保存による過剰リクエスト削減

**Feature Branch**: `009-fix-excessive-requests`
**Created**: 2025-10-29
**Status**: Draft
**Input**: User description: "RSSフィードを複数件購読すると必要以上のリクエストが投げられ、RSSフィードのタイトル表示がおかしくなるのを修正したい"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - フィード登録時の即座のタイトル表示 (Priority: P1)

ユーザーが新しいRSSフィードURLを入力して登録すると、その場でフィードタイトルが取得され（最大10秒のタイムアウト）、localStorageに保存される。以降のアプリケーションロード時には、保存されたタイトルが100ミリ秒以内に表示され、APIリクエストは発生しない。

**Why this priority**: これが最も重要な改善です。現状では毎回のロード時に全フィードに対してタイトル取得APIリクエストが発生していますが、登録時に一度だけ取得して保存すれば、以降のロード時にはAPIリクエストが不要になります。これによりパフォーマンスが劇的に改善され、過剰リクエストの根本原因が解決されます。

**Independent Test**: 新規フィードを登録後、開発者ツールのApplicationタブでlocalStorageを確認し、タイトルが保存されていることを確認。その後アプリをリロードし、NetworkタブでAPIリクエストが発生せず、タイトルが即座に表示されることで独立してテスト可能。

**Acceptance Scenarios**:

1. **Given** アプリケーションが起動している状態、**When** 新しいRSSフィードURL（例：https://example.com/feed.xml）を入力して登録、**Then** APIリクエストが1回だけ実行され、取得されたタイトルがlocalStorageに保存され、画面に表示される
2. **Given** 5個のフィードが登録済みでlocalStorageに保存されている状態、**When** アプリケーションをリロード、**Then** APIリクエストは0回実行され、5個のフィードタイトルが即座にlocalStorageから読み込まれて表示される
3. **Given** フィードが1個も登録されていない状態、**When** アプリケーションをロード、**Then** APIリクエストは0回実行され、ウェルカム画面が表示される

---

### User Story 2 - タイトル取得失敗時のフォールバック表示 (Priority: P2)

フィード登録時にタイトル取得APIが失敗した場合、フィードURLをタイトルの代わりとして保存し、ユーザーは後からカスタムタイトルを編集できる。

**Why this priority**: ネットワークエラーや無効なフィードURLなどでタイトル取得が失敗する場合があります。この場合でもフィードを登録可能にし、URLをタイトル代わりに表示することで、ユーザーが後から管理・編集できるようにします。P1の次に重要な使いやすさの改善です。

**Independent Test**: 無効なRSSフィードURLまたはネットワークが遮断された状態でフィードを登録し、URLがタイトルとして表示されることを確認。その後カスタムタイトル編集機能でタイトルを変更できることで独立してテスト可能。

**Acceptance Scenarios**:

1. **Given** アプリケーションが起動している状態、**When** タイトル取得に失敗するRSSフィードURLを登録、**Then** エラーメッセージ「フィードのタイトルを取得できませんでした。URLをタイトルとして使用します。」が表示され、フィードURLがタイトルとして保存・表示され、ユーザーは後からカスタムタイトルを編集可能
2. **Given** タイトル取得失敗でURLがタイトルとして保存されたフィードがある状態、**When** カスタムタイトル編集機能で「My Blog」と編集、**Then** 新しいタイトルがlocalStorageに保存され、画面に表示される

---

### User Story 3 - 手動タイトル更新機能（オプション） (Priority: P3)

既に登録済みのフィードについて、ユーザーが「タイトルを更新」ボタンをクリックすると、そのフィードのみに対してAPIリクエストが実行され、最新のタイトルを取得してlocalStorageに保存する。

**Why this priority**: フィードのタイトルが後から変更される場合があります。自動では更新しませんが、ユーザーが必要に応じて手動で最新タイトルを取得できる機能を提供します。これは必須ではなく、あると便利な追加機能です。

**Independent Test**: 既存フィードの「タイトルを更新」ボタンをクリックし、NetworkタブでそのフィードのみのAPIリクエストが1回実行され、localStorageとUIが更新されることで独立してテスト可能。

**Acceptance Scenarios**:

1. **Given** 5個のフィードが登録済みの状態、**When** 特定の1個のフィードの「タイトルを更新」ボタンをクリック、**Then** そのフィードのみに対して1回のAPIリクエストが実行され、取得されたタイトルがlocalStorageとUIに反映される（他の4個のフィードには影響なし）

---

### Edge Cases

- フィード登録時にネットワークエラーが発生した場合、ユーザーに適切なエラーメッセージが表示されるか？
- 同じURLのフィードを重複登録しようとした場合、適切にバリデーションされるか？
- localStorageの容量制限に達した場合、適切なエラーハンドリングがされるか？
- フィードのタイトルが非常に長い場合（例：500文字）、適切に保存・表示されるか？
- 特殊文字（絵文字、HTML エンティティなど）を含むタイトルが正しく保存・表示されるか？

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: システムは、フィード登録時に1回だけタイトル取得APIリクエストを実行し（タイムアウト: 10秒）、取得したタイトルをlocalStorageに永続化しなければならない
- **FR-002**: システムは、アプリケーションロード時にlocalStorageから購読フィードとタイトルを読み込み（100ミリ秒以内）、タイトル取得のためのAPIリクエストを実行してはならない
- **FR-003**: システムは、タイトル取得APIが失敗した場合、フィードURLをタイトルの代替値としてlocalStorageに保存し、ユーザーにエラーメッセージ「フィードのタイトルを取得できませんでした。URLをタイトルとして使用します。」を表示しなければならない
- **FR-004**: システムは、既存のカスタムタイトル編集機能を維持し、ユーザーがいつでもタイトルを編集できるようにしなければならない
- **FR-005**: システムは、フィード削除時にlocalStorageから該当フィードのデータ（URLとタイトル）を削除しなければならない
- **FR-006**: システムは、既に登録済みのフィードについて、ユーザーが手動でタイトルを更新できる機能を提供しなければならない（Priority P3、オプション実装）
- **FR-007**: システムは、既に登録されているフィードURLの重複登録を検出し、エラーメッセージ「このフィードは既に登録されています。」を表示して登録を拒否しなければならない
- **FR-008**: システムは、フィード登録中にローディングインジケーター（スピナーまたはプログレスバー）を表示し、ユーザーに処理中であることを通知しなければならない
- **FR-009**: システムは、titleフィールドを持たない既存のlocalStorageデータを読み込んだ場合、自動的にfeedUrlをtitleフィールドに設定してマイグレーションしなければならない

### Key Entities *(include if feature involves data)*

- **Subscription**: フィード購読情報（id, feedUrl, title, customTitle, addedAt）を表すエンティティ。登録時に`title`フィールドにAPIから取得したタイトルが設定され、localStorageに永続化される。`customTitle`は既存通りユーザーが編集可能。
- **localStorage保存形式**: Subscriptionオブジェクトの配列としてJSON形式で保存される。既存の保存形式を維持し、`title`フィールドが追加で設定される。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 10個のフィードが登録済みの状態でアプリケーションをリロードしたとき、タイトル取得のためのAPIリクエストが0回実行される（現状：10回以上のリクエストが発生）
- **SC-002**: 新しいフィードを1個登録したとき、タイトル取得のためのAPIリクエストが正確に1回のみ実行される
- **SC-003**: アプリケーションのロード時間が短縮される（測定方法: ページロード開始からすべてのフィードタイトル表示完了まで。10個のフィード登録時、現状5-10秒から100ミリ秒以内に改善）
- **SC-004**: 既存の購読管理機能（追加・削除・カスタムタイトル編集・永続化）がすべて正常に動作し続ける（リグレッションなし）
- **SC-005**: localStorageに保存されたタイトルデータが、アプリケーションリロード後も正しく読み込まれ表示される

## 技術的な前提と分析

### 現状の問題点

現在の実装では：
1. フィード登録時にURLのみをlocalStorageに保存
2. アプリケーションロード時に、`FeedContainer.tsx`の34行目のuseEffectが全フィードに対してタイトル取得APIを実行
3. タイトル取得後、`UPDATE_SUBSCRIPTION`アクションでタイトルを更新
4. この更新が`subState.subscriptions`オブジェクトの変更をトリガー
5. 34行目のuseEffectの依存配列に`subState.subscriptions`が含まれているため、再度fetchFeedsが実行される
6. 結果として、1フィードあたり複数回のAPIリクエストが発生し、パフォーマンスが低下

### 改善アプローチ

**登録時の一度きりのタイトル取得と永続化**:
1. フィード登録時（`ADD_SUBSCRIPTION`実行時）に、フィードタイトル取得APIを呼び出す
2. 取得したタイトルを含むSubscriptionオブジェクトをlocalStorageに保存
3. アプリケーションロード時には、localStorageから読み込むのみで、APIリクエストは不要

**useEffectの修正不要**:
- 現在の`FeedContainer.tsx`の34行目のuseEffectは、記事（articles）を取得するためのものであり、タイトル取得とは別の目的
- タイトル取得のライフサイクルを完全に分離することで、useEffectの依存配列の問題も解決される

**既存機能との互換性**:
- カスタムタイトル編集機能は既存通り維持
- localStorageの保存形式は既存のSubscription型を維持し、`title`フィールドが設定されるのみ

### API仕様

**フィードタイトル取得API**:
- **エンドポイント**: `/api/parse`（既存のフィードパースAPIを利用）
- **メソッド**: POST
- **リクエストボディ**: `{ "urls": ["https://example.com/feed.xml"] }`
- **タイムアウト**: 10秒
- **レスポンス形式**:
  ```json
  {
    "results": [
      {
        "url": "https://example.com/feed.xml",
        "title": "Example Blog",
        "items": [...]
      }
    ]
  }
  ```
- **エラーレスポンス**: タイムアウトまたはパース失敗時は、該当URLに対してエラーフラグが返される

**既存のSubscription型定義**:
```typescript
interface Subscription {
  id: string
  feedUrl: string
  title: string           // 新規追加: APIから取得したタイトル
  customTitle?: string    // 既存: ユーザーが設定したカスタムタイトル
  addedAt: string
  lastFetchedAt: string | null
  status: 'active' | 'error'
}
```

### データマイグレーション戦略

**既存データの取り扱い**:
1. アプリケーション起動時、localStorageからSubscriptionデータを読み込む
2. 各Subscriptionオブジェクトに`title`フィールドが存在しない場合：
   - `title`フィールドに`feedUrl`の値を設定（フォールバック）
   - マイグレーション済みデータをlocalStorageに保存
3. ユーザーへの影響:
   - 既存フィードはURLがタイトルとして表示される
   - ユーザーは既存のカスタムタイトル編集機能で任意のタイトルに変更可能
   - または、手動タイトル更新機能（P3）で実際のタイトルを取得可能

**後方互換性**:
- localStorageのキー名は変更しない（`rss-subscriptions`など）
- Subscriptionオブジェクトの既存フィールド（id, feedUrl, customTitle, addedAtなど）は変更しない
- `title`フィールドの追加のみで、既存の機能は影響を受けない

### 想定される実装箇所

- `frontend/src/containers/FeedContainer.tsx`: フィード登録時のタイトル取得ロジック追加、重複チェック、ローディング表示
- `frontend/src/hooks/useFeedAPI.ts`: タイトル取得用のAPI呼び出し関数（タイムアウト設定含む）
- `frontend/src/contexts/SubscriptionContext.tsx`: 既存のまま維持（変更不要の可能性）
- `frontend/src/utils/storage.ts`: データマイグレーションロジック追加（loadSubscriptions関数内）
- `frontend/src/types/models.ts`: Subscription型のtitleフィールド追加

### スコープ外

- フィード記事（articles）取得のAPIリクエスト最適化（別の課題として扱う）
- フィードの自動更新・リフレッシュ機能の追加
- localStorageからIndexedDBなどへの移行
- タイトル取得APIのバックエンド実装変更