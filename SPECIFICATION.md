# feed-parallel-parse-api システム仕様書

**最終更新日**: 2025-11-03
**バージョン**: v1.6

> **重要**: この仕様書は、PR 作成時に必ず更新してください。機能追加・変更があった場合は、該当セクションを修正し、最新の実装状態を反映させることがプロジェクトルールとして定められています。

---

## 1. システム概要

feed-parallel-parse-api は、複数の RSS フィードを並列に取得・解析し、統合されたタイムラインとして表示する Web アプリケーションです。フロントエンドは React + TypeScript、バックエンドは Go で構築されており、ブラウザの localStorage を使用してクライアントサイドでデータを永続化します。

### 主要機能

- 複数 RSS フィードの購読管理（追加・削除・編集）
- フィードタイトルの自動取得とカスタマイズ
- 購読一覧の折りたたみ機能（記事へのアクセス最適化）
- **購読フィードのインポート/エクスポート機能**（JSON形式、URL重複チェック）
- **自動更新機能（ポーリング）**（10分間隔、新着記事通知）
- 並列フィード取得による高速な記事取得
- 統合タイムラインでの記事表示
- 仮想スクロールによる高速レンダリング
- キーワード検索とソート機能
- エラーハンドリングとユーザーフィードバック
- PWA 対応（アプリインストール、オフライン動作、自動更新）

---

## 2. 技術スタック

### フロントエンド

- **フレームワーク**: React 19.1.1 + TypeScript 5.9.3
- **ビルドツール**: Vite 7.1.7
- **スタイリング**: TailwindCSS 4.x
- **状態管理**: React Context API（UIContext, SubscriptionContext）
- **仮想スクロール**: react-window 1.8.x
- **日付処理**: date-fns 4.x
- **PWA 対応**: vite-plugin-pwa 1.1, workbox-window
- **テスト**: Vitest 4.0.3, @testing-library/react 16.3.0
- **CI/CD**: GitHub Actions

### バックエンド

- **言語**: Go 1.25.1
- **RSS パーサー**: github.com/mmcdole/gofeed
- **フォーマット対応**: RSS 1.0, RSS 2.0, Atom
- **HTTP サーバー**: 標準ライブラリ net/http

### データストレージ

- **永続化**: ブラウザ localStorage
- **キャッシュ**: フィードタイトルのインメモリキャッシュ（10 分 TTL）
- **オフラインキャッシュ**: Cache Storage API（Service Worker による管理）

### 開発環境

- **Docker Compose**: ローカル開発環境（バックエンド + フロントエンド）
  - バックエンド: ポート8080、ホットリロード対応
  - フロントエンド: ポート3000、ホットリロード対応
  - `docker-compose up` で一括起動可能

---

## 3. フィード購読管理機能

### 3.1 フィード追加

#### 基本フロー

1. ユーザーが RSS フィードの URL を入力
2. URL バリデーション（http/https スキームチェック）
3. 重複チェック（既に登録済みか確認）
4. バックエンド API にタイトル取得リクエスト（`POST /api/parse`）
5. フィードタイトルを自動取得して表示
6. localStorage に購読情報を保存

#### URL 入力プレビュー機能

- URL を入力するとリアルタイムでフィードタイトルをプレビュー表示
- 取得失敗時は「エラー: 取得に失敗しました」と表示
- デバウンス処理（300ms）により不要な API 呼び出しを削減

#### エラーハンドリング

- **無効な URL**: 「無効な URL です。http://または https://で始まる URL を入力してください」
- **重複フィード**: 「このフィードは既に登録されています」（入力フィールドはクリアされない）
- **タイトル取得失敗**: 「フィードのタイトルを取得できませんでした。URL をタイトルとして使用します。」（フィード自体は登録され、入力フィールドはクリアされる）
- **購読数上限**: 「購読数が上限（100 件）に達しています」

#### データ構造

```typescript
interface Subscription {
  id: string; // UUID
  url: string; // フィードURL
  title: string | null; // 自動取得されたタイトル
  customTitle: string | null; // ユーザーが設定したカスタムタイトル
  subscribedAt: string; // ISO 8601形式
  lastFetchedAt: string | null;
  status: "active" | "error";
}
```

### 3.2 フィードタイトル表示

#### 表示優先順位

1. **customTitle**: ユーザーが手動で設定したタイトル（最優先）
2. **title**: API から自動取得されたフィードタイトル
3. **url**: タイトル取得に失敗した場合のフォールバック

#### 表示形式

```text
[表示名]
URL: https://example.com/feed.xml
```

表示名が元の URL と異なる場合、「URL:」プレフィックスを付けて元 URL を明示的に表示します。

### 3.3 フィードタイトル編集

#### 編集フロー

1. 購読リストの各アイテムに「編集」ボタンを表示
2. クリックすると編集モードに切り替わり、インラインで編集可能
3. Enter キーで保存、Esc キーでキャンセル
4. カスタムタイトルとして保存され、localStorage に永続化

#### バリデーション

- **空文字**: 「フィード名を入力してください」
- **長すぎるタイトル**: 「フィード名は 200 文字以内で入力してください」
- 前後の空白は自動トリミング

#### UI/UX の工夫

- 編集開始時に自動フォーカス
- 編集中は「保存」「キャンセル」ボタンを表示
- 編集中は「編集」「削除」ボタンを非表示
- エラーメッセージは赤文字でインライン表示

### 3.4 フィード削除

- 購読リストの各アイテムに「削除」ボタンを表示
- クリックで即座にフィードを削除（確認ダイアログなし）
- localStorage から削除され、UI から即座に消える

### 3.5 購読一覧の折りたたみ機能

#### 概要

購読フィード数が増加すると画面上部の購読一覧が縦に長くなり、記事一覧がファーストビューから押し出される問題を解決するための機能です。ユーザーは購読管理が不要な通常時には、購読一覧を折りたたんで記事一覧を最優先で表示できます。

#### 基本動作

- **デフォルト状態**: ページ読み込み時、購読一覧は折りたたまれた状態
- **トグルボタン**: 「表示」/「隠す」ボタンで展開・折りたたみを切り替え
- **購読件数表示**: 折りたたみ状態でも「購読中: N/100件」と表示
- **状態永続化**: ユーザーの選択した状態を localStorage に保存し、次回訪問時も維持

#### UI 構成

```text
┌─────────────────────────────────────┐
│ 購読管理エリア                       │
│ ┌─────────────────────────────────┐ │
│ │ [URL入力フォーム] [追加]         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 購読中: 20/100件          [表示]    │ ← 折りたたみ時
│                                     │
│ （購読一覧は非表示）                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 記事一覧                            │
│ ┌─────────────────────────────────┐ │
│ │ 記事1                           │ │
│ │ 記事2                           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### データ構造

**localStorage キー**: `rss_reader_subscriptions_collapsed`

**保存値**:
- `true`: 折りたたみ状態（デフォルト）
- `false`: 展開状態

#### 技術実装

- **カスタムフック**: `useSubscriptionListCollapse`
  - `isCollapsed`: 現在の折りたたみ状態（boolean）
  - `toggle()`: 状態を切り替え
  - `expand()`: 展開状態にする
  - `collapse()`: 折りたたみ状態にする
- **状態管理**: `useLocalStorage` フックで localStorage と同期
- **アクセシビリティ**:
  - `aria-expanded`: 折りたたみ状態を明示
  - `aria-controls`: 制御対象の購読一覧を指定
  - `aria-label`: スクリーンリーダー対応のボタンラベル

#### UX の工夫

- **スムーズなアニメーション**: `transition-all duration-300` でスムーズに展開・折りたたみ
- **直感的なボタンテキスト**: 現在の状態ではなく、次に行うアクションを表示（「表示」/「隠す」）
- **情報の維持**: 折りたたみ時も購読件数を表示し、ユーザーが状況を把握できる

#### エラーハンドリング

- **localStorage 読み込みエラー**: JSON パースエラー時はデフォルト値（折りたたみ）を使用
- **購読数 0 件の場合**: 折りたたみボタン自体を非表示

### 3.6 購読フィードのインポート/エクスポート機能

#### 概要

購読しているフィードリストを JSON 形式でエクスポート・インポートできる機能。デバイス間でのフィード購読の移行や、バックアップ・リストアに使用する。

#### エクスポート機能

**UI 要素**:
- **ボタン配置**: 購読フィードリスト内（折りたたみ可能領域の上部、購読件数表示の下）
- **表示条件**: 購読フィードが1件以上存在し、かつリストが展開されている場合のみ表示
- **ボタンラベル**: 「エクスポート」
- **スタイル**: `bg-blue-600 text-white` の青色ボタン

**動作仕様**:
1. ボタンクリック時、現在の購読フィードを JSON 形式でエクスポート
2. ファイル名: `subscriptions_YYYY-MM-DD.json` (例: `subscriptions_2025-11-02.json`)
3. ブラウザのダウンロード機能で自動保存

**エクスポートデータ形式**:
```json
{
  "version": "1.0.0",
  "exportedAt": "2025-11-02T12:34:56.789Z",
  "subscriptions": [
    {
      "id": "uuid-1234",
      "url": "https://example.com/feed",
      "title": "Example Feed",
      "customTitle": null,
      "subscribedAt": "2025-11-01T10:00:00.000Z",
      "lastFetchedAt": "2025-11-02T11:00:00.000Z",
      "status": "active"
    }
  ]
}
```

**フィールド説明**:
- `version`: データ形式のバージョン（将来の互換性のため）
- `exportedAt`: エクスポート実行日時（ISO 8601形式）
- `subscriptions`: 購読フィードの配列（全フィールドを含む）

#### インポート機能

**UI 要素**:
- **ボタン配置**: 購読フィードリスト内（エクスポートボタンの右隣）
- **表示条件**: エクスポートボタンと同じ（購読フィードが1件以上存在し、リストが展開されている場合）
- **ボタンラベル**: 「インポート」
- **スタイル**: `bg-green-600 text-white` の緑色ボタン

**動作仕様**:
1. ボタンクリック時、ファイル選択ダイアログを表示
2. JSON ファイル選択後、バリデーション実行
3. 既存購読フィードとマージ（URL 重複チェック）
4. 成功時: ページリロードで反映
5. 失敗時: エラーメッセージ表示

**バリデーション仕様**:

| チェック項目 | エラーコード | エラーメッセージ |
|-------------|-------------|-----------------|
| ファイルサイズ（1MB以下） | `FILE_TOO_LARGE` | ファイルサイズが大きすぎます（最大1MB） |
| ファイル形式（.json） | `INVALID_FILE_TYPE` | JSONファイルを選択してください |
| JSON 解析 | `INVALID_JSON` | ファイル形式が正しくありません。有効なJSONファイルを選択してください。 |
| スキーマ検証（version, exportedAt, subscriptions） | `INVALID_SCHEMA` | データ形式が正しくありません。エクスポートされたフィードファイルを選択してください。 |
| バージョン（1.0.0のみ） | `INVALID_VERSION` | サポートされていないバージョンです |
| 個別フィールド（url, status必須） | `MISSING_REQUIRED_FIELD` | 必須フィールドが不足しています |

**マージ戦略**:
- **重複判定**: `url` フィールドで一致をチェック
- **重複時**: スキップ（既存データを優先）
- **新規時**: 以下のフィールドを初期化して追加
  - `id`: 新しいUUID（`crypto.randomUUID()`）
  - `subscribedAt`: インポート実行日時
  - `lastFetchedAt`: `null`（次回フェッチで更新）
  - `status`: `active`（強制的にアクティブ化）

**結果通知**:
```
成功: "2件のフィードを追加しました（1件はスキップ）"
失敗: "ファイル形式が正しくありません"
```

#### 技術実装

**コンポーネント**:
- `ImportExportButtons.tsx`: ボタンUI（プレゼンテーション層）
- `useImportExport.ts`: インポート/エクスポートロジック（カスタムフック）

**サービス**:
- `importExport.service.ts`: ビジネスロジック
  - `exportSubscriptions()`: エクスポート処理
  - `importSubscriptions(file: File)`: インポート処理
  - `mergeSubscriptions()`: マージロジック

**バリデーション**:
- `importValidation.ts`: バリデーション関数
  - `validateExportData()`: スキーマ検証
  - `validateSubscription()`: 個別フィード検証
  - `readFileAsText()`: ファイル読み込み

**型定義**:
```typescript
interface ExportData {
  version: string
  exportedAt: string
  subscriptions: Subscription[]
}

interface ImportResult {
  success: boolean
  addedCount: number
  skippedCount: number
  message: string
  error?: string
}

type ImportErrorCode =
  | 'INVALID_JSON'
  | 'INVALID_SCHEMA'
  | 'FILE_TOO_LARGE'
  | 'FILE_READ_ERROR'
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_VERSION'
```

#### エラーハンドリング

- **ファイル読み込みエラー**: FileReader API のエラーを適切にキャッチ
- **JSON パースエラー**: `try-catch` で処理し、ユーザーに明示的なエラーメッセージ
- **バリデーションエラー**: 各バリデーション段階でエラーを返却
- **既存データ保護**: インポート失敗時は既存データを一切変更しない

#### テスト

**ユニットテスト**（Vitest）:
- エクスポート機能: 7 テストケース
- インポート機能（バリデーション）: 18 テストケース
- インポート機能（統合）: 6 テストケース
- マージ機能: 4 テストケース
- UI コンポーネント: 9 テストケース

**カバレッジ**: 100%（全関数・分岐）

---

## 4. 記事表示機能

### 4.1 並列フィード取得

#### 取得アルゴリズム

1. 全購読フィードの URL をバックエンドに送信（`POST /api/parse-multiple`）
2. バックエンドが並列にフィードを取得（Go の goroutine を使用）
3. 各フィードの記事を統合して返却
4. エラーが発生したフィードは個別に記録

#### タイムアウト設定

- フィード取得タイムアウト: 10 秒
- AbortController を使用したリクエストキャンセル対応

#### URL 正規化によるフィードマッチング

**概要**: 購読リストの URL と API 応答のフィード URL を照合する際、URL 正規化を適用してマッチング精度を向上させます。これにより、末尾スラッシュやプロトコルの違いなどの軽微な差異を吸収し、正しいフィードとタイトルの紐付けを保証します。

**正規化ルール**:

1. **プロトコル統一**: `http://` を `https://` に変換
2. **ドメイン小文字化**: ドメイン部分を小文字に統一
3. **www prefix 除去**: `www.` プレフィックスを除去
4. **末尾スラッシュ除去**: パスの末尾 `/` を削除（ルートパス `/` は除く）
5. **クエリパラメータ保持**: URL のクエリ文字列は保持

**マッチングアルゴリズム**:

```typescript
// URL正規化関数（frontend/src/utils/urlNormalizer.ts）
function normalizeUrl(url: string): string {
  const urlObj = new URL(url);
  urlObj.protocol = 'https:';
  urlObj.hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase();
  if (urlObj.pathname.endsWith('/') && urlObj.pathname !== '/') {
    urlObj.pathname = urlObj.pathname.slice(0, -1);
  }
  return urlObj.toString();
}

// フィードマッチング関数（frontend/src/hooks/useFeedAPI.ts）
function findMatchingFeed(subscription: Subscription, feeds: RSSFeed[]): RSSFeed | undefined {
  const normalizedSubscriptionUrl = normalizeUrl(subscription.url);
  const matchedFeed = feeds.find(f => normalizeUrl(f.link) === normalizedSubscriptionUrl);

  if (!matchedFeed) {
    console.warn(`フィードマッチング失敗: ${subscription.url}`);
  }

  return matchedFeed;
}
```

**重要な設計決定**:

- **インデックスフォールバック削除**: 以前のバグの原因となっていたインデックスベースのフォールバック（`|| feeds[subscriptionIndex]`）を完全に削除
- **マッチング失敗時の動作**: URL 正規化後も一致しない場合は `undefined` を返し、タイトル更新を行わない
- **ログ出力**: マッチング失敗時には警告ログを出力し、デバッグを支援

**正規化例**:

| 購読 URL                              | API 応答 URL                          | 正規化後               | マッチング結果 |
| ------------------------------------- | ------------------------------------- | ---------------------- | -------------- |
| `http://example.com/feed`             | `https://example.com/feed/`           | `https://example.com/feed` | ✅ 一致       |
| `https://www.EXAMPLE.COM/feed/`       | `https://example.com/feed`            | `https://example.com/feed` | ✅ 一致       |
| `http://example.com/feed?page=1`      | `https://example.com/feed/?page=1`    | `https://example.com/feed?page=1` | ✅ 一致 |
| `https://blog.example.com/rss`        | `https://news.example.com/rss`        | 異なる                 | ❌ 不一致     |

**バグ修正の詳細**:

- **修正前の問題**: 3 件目以降のフィード登録時、API 応答の順序と購読リストの順序が異なる場合、インデックスフォールバックにより誤ったタイトルが表示されていた
- **修正後の動作**: URL 正規化による厳密なマッチングにより、API 応答の順序に依存せず、常に正しいタイトルが表示される

### 4.2 統合タイムライン表示

#### 記事データ構造

```typescript
interface Article {
  id: string;
  title: string;
  link: string;
  pubDate: string | null;
  summary: string;
  feedId: string;
  feedTitle: string; // 表示用のフィードタイトル
  feedOrder: number; // 購読リスト内での順序
}
```

#### デフォルトソート

- **降順（新着順）**: 最新の記事が上に表示
- `pubDate`が存在しない記事は最古として扱われる

#### 仮想スクロール

- react-window を使用して大量の記事を高速レンダリング
- 各記事の高さ: 120px（固定）
- 表示領域外の記事は DOM から除外され、パフォーマンスを維持

### 4.3 記事カード

#### 表示情報

- **記事タイトル**: クリック可能なリンク
- **要約**: 記事の概要（HTML タグは除去済み）
- **公開日時**: 「2025 年 10 月 29 日 14:30」形式（date-fns でフォーマット）
- **フィード名**: 記事の出典フィード
- **購読順**: フィード購読リスト内での順序番号（「#1」形式）

#### スタイリング

- TailwindCSS によるレスポンシブデザイン
- ホバー時のハイライト効果
- グレー背景のカード形式

---

## 5. 検索・フィルタリング機能

### 5.1 キーワード検索

#### 検索対象

- 記事タイトル
- 記事の要約（summary）
- フィード名

#### 検索アルゴリズム

- 部分一致検索（大文字小文字を区別しない）
- スペース区切りで AND 検索に対応
- 日本語・英語両方に対応

#### UI

- 検索ボックスはヘッダーに配置
- リアルタイム検索（入力と同時に結果が更新される）
- 検索結果件数を表示

### 5.2 ソート機能

#### ソートオプション

- **日付（新しい順）**: デフォルト
- **日付（古い順）**: 時系列順に表示
- **フィード順**: 購読リスト内での順序で表示

#### ソート優先順位

1. 選択されたソート条件
2. pubDate が null の記事は最後に配置（日付ソートの場合）

---

## 6. データ永続化

### 6.1 localStorage 管理

#### 保存データ

```typescript
// キー: 'feed-subscriptions'
[
  {
    id: "uuid-1234",
    url: "https://example.com/feed.xml",
    title: "Example Blog",
    customTitle: "My Custom Title",
    subscribedAt: "2025-10-29T05:30:00Z",
    lastFetchedAt: "2025-10-29T06:00:00Z",
    status: "active",
  },
];

// キー: 'rss_reader_subscriptions_collapsed'
// 値: true（折りたたみ） / false（展開）
true;
```

#### 永続化タイミング

**購読データ（feed-subscriptions）**:
- フィード追加時
- フィード削除時
- カスタムタイトル編集時

**折りたたみ状態（rss_reader_subscriptions_collapsed）**:
- 折りたたみボタンクリック時

#### データ読み込み

- アプリ起動時に localStorage から購読情報と折りたたみ状態を復元
- パースエラー時は空配列（購読データ）またはデフォルト値（折りたたみ状態）として扱う

### 6.2 タイトルキャッシュ

#### キャッシュ戦略

- インメモリキャッシュ（Map 構造）
- TTL: 10 分
- キャッシュキー: フィード URL

#### キャッシュヒット時の動作

- API 呼び出しをスキップし、キャッシュされたタイトルを即座に返却
- プレビュー表示が高速化

---

## 7. エラーハンドリング

### 7.1 フロントエンドエラー

#### バリデーションエラー

- URL フォーマットエラー
- 空文字エラー
- 購読数上限エラー
- タイトル長エラー

#### 表示方法

- 入力フィールド下に赤文字でインライン表示
- `role="alert"`を付与してアクセシビリティ対応
- `aria-invalid`属性で無効状態を明示

### 7.2 バックエンドエラー

#### API 通信エラー

- ネットワークエラー
- タイムアウト（10 秒）
- HTTP ステータスエラー（4xx, 5xx）

#### フィードパースエラー

- 無効な RSS フォーマット
- 空のフィード
- HTTP ステータス 404/500

#### エラーレスポンス形式

```json
{
  "error": "エラーメッセージ"
}
```

### 7.3 エラーメッセージ一覧

#### フィード取得エラー

- `FETCH_FAILED`: 「フィードの取得に失敗しました」
- `FETCH_FAILED_DISPLAY`: 「エラー: 取得に失敗しました」
- `DUPLICATE_FEED`: 「このフィードは既に登録されています」
- `TITLE_FETCH_FAILED`: 「フィードのタイトルを取得できませんでした。URL をタイトルとして使用します。」

#### URL バリデーションエラー

- `INVALID_URL`: 「無効な URL です」
- `INVALID_URL_DETAILED`: 「無効な URL です。http://または https://で始まる URL を入力してください」

#### タイトルバリデーションエラー

- `EMPTY_TITLE`: 「フィード名を入力してください」
- `TITLE_TOO_LONG`: 「フィード名は 200 文字以内で入力してください」

#### 購読数制限エラー

- `LIMIT_REACHED`: 「購読数が上限（100 件）に達しています」

---

## 8. API 仕様

### 8.1 エンドポイント一覧

#### `POST /api/parse`

単一の RSS フィードを取得してタイトルを返却します。

**リクエスト**:

```json
{
  "url": "https://example.com/feed.xml"
}
```

**レスポンス（成功）**:

```json
{
  "title": "Example Blog"
}
```

**レスポンス（エラー）**:

```json
{
  "error": "failed to fetch feed: 404 Not Found"
}
```

#### `POST /api/parse-multiple`

複数の RSS フィードを並列に取得して統合記事リストを返却します。

**リクエスト**:

```json
{
  "feeds": [
    {
      "id": "uuid-1",
      "url": "https://example.com/feed.xml",
      "feedOrder": 0
    },
    {
      "id": "uuid-2",
      "url": "https://another.com/rss",
      "feedOrder": 1
    }
  ]
}
```

**レスポンス（成功）**:

```json
{
  "articles": [
    {
      "id": "article-1",
      "title": "記事タイトル",
      "link": "https://example.com/article-1",
      "pubDate": "2025-10-29T05:30:00Z",
      "summary": "記事の要約",
      "feedId": "uuid-1",
      "feedTitle": "Example Blog",
      "feedOrder": 0
    }
  ],
  "errors": [
    {
      "url": "https://another.com/rss",
      "message": "failed to parse feed",
      "timestamp": "2025-10-29T06:00:00Z"
    }
  ]
}
```

### 8.2 対応フォーマット

- **RSS 1.0** (RDF/RSS)
- **RSS 2.0**
- **Atom**

### 8.3 パフォーマンス仕様

- 並列フィード取得により、N 個のフィードを O(1)時間で取得
- 各フィードのタイムアウト: 10 秒
- タイトルキャッシュ TTL: 10 分

#### フィード再フェッチの最適化

**問題**: フィードタイトル更新時に不要な API リクエストが発生していた

**解決**: `FeedContainer`の`useEffect`依存配列を最適化

- **変更前**: `[subState.subscriptions.length, subState.subscriptions, fetchFeeds]`
- **変更後**: `[subState.subscriptions.length, fetchFeeds]`
- **効果**: タイトル更新時（customTitle 編集、自動取得された title 更新）に再フェッチが発生しない
- **動作保証**: フィード追加・削除時のみ API リクエストを実行（`subscriptions.length`の変化を監視）

この最適化により、以下のシナリオで不要な API リクエストが削減されます：

- カスタムタイトルの編集・保存
- フィード追加時の自動タイトル取得後の更新
- ページリロード時のタイトル反映

### 8.4 CORS設定

**背景**: Vercelプレビュー環境では、フロントエンドとバックエンドが異なるドメイン（Cross-Origin）となるため、CORS設定が必要です。

**設定内容**:

- **Vercelサーバーレス関数** (`api/parse.go`): すべてのHTTPレスポンスに以下のCORSヘッダーを含む
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: POST, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type`

- **ローカル開発環境** (`cmd/server/main.go`): 同じCORSヘッダー設定を使用（実装一貫性）

**プリフライトリクエスト対応**:

- `OPTIONS /api/parse` リクエストに対して200 OKで応答し、CORSヘッダーを返す
- ブラウザのプリフライトチェックが成功した後、実際のPOSTリクエストが送信される

**環境ごとの動作**:

| 環境 | Origin構成 | CORS動作 |
|------|-----------|---------|
| 本番環境（Vercel） | Same-Origin（同じドメイン） | ヘッダーは無視される（CORS不要） |
| プレビュー環境（Vercel） | Cross-Origin（異なるドメイン） | CORSヘッダーにより正常動作 |
| ローカル環境（Docker） | Same-Origin（localhost） | ヘッダーは設定されているが不要 |

**セキュリティ**: RSSフィード解析APIは公開APIとして設計されており、すべてのオリジンからのアクセスを許可することに問題はありません。将来的にオリジン制限が必要になった場合は、環境変数での制御に移行できます。

---

## 9. UI/UX 設計

### 9.1 レスポンシブデザイン

- TailwindCSS のユーティリティクラスを使用
- モバイル・タブレット・デスクトップに対応
- フレキシブルレイアウト

### 9.2 アクセシビリティ

#### ARIA 属性

- `role="alert"`: エラーメッセージ
- `aria-invalid`: 無効な入力フィールド
- `aria-describedby`: エラーメッセージとの関連付け
- `aria-label`: ボタンのラベル

#### キーボード操作

- Enter キー: フォーム送信、編集保存
- Escape キー: 編集キャンセル
- Tab キー: フォーカス移動

### 9.3 ウェルカム画面

- フィードが 0 件の場合、ウェルカムメッセージを表示
- 使い方ガイドとサンプル URL を提示
- フィード追加後は自動で非表示

---

## 10. Progressive Web App（PWA）機能

### 10.1 概要

アプリケーションをデスクトップ・モバイルアプリとしてインストール可能にし、オフライン環境でも動作する PWA 機能を実装しています。

### 10.2 インストール機能

#### マニフェスト設定

- **アプリ名**: Feed Reader
- **短縮名**: Feed Reader
- **説明**: 複数の RSS フィードを統合表示できる Web アプリケーション
- **表示モード**: standalone（独立したアプリウィンドウで表示）
- **配色**: light（ライトテーマ）
- **背景色**: #ffffff
- **テーマカラー**: #4f46e5（インディゴ）

#### アイコン

- 192x192px: ホーム画面用
- 512x512px: スプラッシュ画面用
- maskable 512x512px: アダプティブアイコン対応

#### インストール可能なプラットフォーム

- Chrome/Edge（デスクトップ・Android）
- Safari（iOS/iPadOS）
- Firefox（Android）

### 10.3 オフライン対応

#### Service Worker 戦略

- **キャッシュファースト**: 静的アセット（HTML, CSS, JS, 画像）は優先的にキャッシュから読み込み
- **ネットワークファースト**: API リクエストは常にネットワークを優先し、失敗時のみキャッシュを使用
- **自動更新検知**: 新しい Service Worker が利用可能になると自動的に検出

#### キャッシュ対象

- アプリケーションシェル（HTML, CSS, JS）
- フォント、画像などの静的リソース
- 過去に取得した API レスポンス（フォールバック用）

#### オフライン時の動作

1. **購読データ**: localStorage から読み込み可能（完全動作）
2. **記事データ**: 最後に取得した API レスポンスをキャッシュから表示
3. **フィード追加**: オフラインでは無効化（ネットワーク必須）
4. **UI 通知**: 接続状態の変化を自動検出してユーザーに通知

### 10.4 更新管理

#### 自動更新フロー

1. バックグラウンドで新しい Service Worker をチェック
2. 新バージョン検出時、ユーザーに通知バナーを表示
3. ユーザーが「更新」ボタンをクリックすると新バージョンを適用
4. ページをリロードして最新版を表示

#### 更新通知 UI

- 画面上部に固定バナーで表示
- 「新しいバージョンが利用可能です」メッセージ
- 「更新」ボタンでワンクリック更新
- 更新中はローディング表示

### 10.5 ネットワーク状態監視

#### オンライン/オフライン検出

- ブラウザの`navigator.onLine` API を使用
- `online`/`offline`イベントをリッスン
- 接続状態が変化した際に自動的に UI を更新

#### 通知機能

- **オフライン時**: 「オフラインです」バナーを表示（警告カラー）
- **オンライン復帰時**: 「オンラインに戻りました」バナーを表示（成功カラー）
- 3 秒後に自動的に消える

### 10.6 技術実装

#### 使用ライブラリ

- **vite-plugin-pwa**: Vite プラグインとして統合
- **workbox-window**: Service Worker 管理・通信
- **Workbox**: キャッシング戦略の実装

#### ビルド設定

```typescript
// vite.config.ts
VitePWA({
  registerType: "autoUpdate",
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
    runtimeCaching: [
      /* API caching strategy */
    ],
  },
});
```

#### Service Worker ライフサイクル

1. **インストール**: 静的アセットをプリキャッシュ
2. **アクティベーション**: 古いキャッシュを削除
3. **フェッチ**: リクエストをインターセプトしてキャッシュ戦略を適用
4. **更新**: バックグラウンドで新バージョンをチェック

### 10.7 テスト

#### PWA 機能テスト

- Service Worker 登録のテスト
- オフライン動作の検証
- 更新通知 UI のテスト
- ネットワーク状態変化のテスト
- マニフェスト設定の確認

#### 手動テスト項目

- Chrome DevTools の Lighthouse で PWA スコア確認
- オフラインモードでのアプリ動作確認
- インストール後の独立ウィンドウ動作
- 異なるデバイス・ブラウザでの動作確認

---

## 11. 自動更新機能（ポーリング）

### 11.1 概要

購読しているRSSフィードを定期的にバックグラウンドで取得し、新着記事を自動検出してユーザーに通知する機能です。オンライン時のみ動作し、オフライン時は自動的に停止します。

### 11.2 ポーリング動作

#### ポーリング間隔

- **デフォルト間隔**: 10分（600,000ms）
- **初回ポーリング**: アプリ起動後10分経過時
- **設定保存**: localStorageに最終ポーリング時刻を保存

#### ポーリング条件

- **オンライン時のみ実行**: `navigator.onLine === true`
- **購読フィードが存在する場合のみ実行**
- **オフライン復帰時**: 自動的にポーリング再開

#### データ構造

```typescript
interface PollingConfig {
  enabled: boolean;
  lastPolledAt: number | null; // timestamp
}
```

### 11.3 新着記事検出

#### 検出アルゴリズム

```typescript
function findNewArticles(
  latestArticles: Article[],
  currentArticles: Article[]
): Article[] {
  const currentIds = new Set(currentArticles.map((a) => a.id));
  return latestArticles.filter((article) => !currentIds.has(article.id));
}
```

- **時間計算量**: O(n + m)（n: 現在の記事数、m: 最新記事数）
- **重複判定**: 記事IDをSetに格納して高速検索

#### パフォーマンス

- **1000記事での実行時間**: 10ms以内
- **メモリリーク防止**: clearIntervalによるタイマー解放

### 11.4 新着通知UI

#### NewArticlesNotification コンポーネント

- **表示位置**: 画面上部中央（固定）
- **表示内容**: 「新着記事があります (N件)」
- **アクション**: 「読み込む」ボタン
- **アニメーション**:
  - 表示時: slideDownアニメーション（300ms）
  - 非表示時: fadeOutアニメーション（200ms）
- **アクセシビリティ**:
  - `role="status"`
  - `aria-live="polite"`
  - キーボード操作対応（Tabキー、Enterキー）

#### レスポンシブデザイン

- **モバイル**: 縦並びレイアウト、テキストサイズ小（text-sm）
- **デスクトップ**: 横並びレイアウト、通常テキストサイズ（text-base）
- **最大幅**: モバイル90vw、デスクトップは自動

### 11.5 ポーリング状態表示

#### PollingStatus コンポーネント

- **表示位置**: ヘッダー右側
- **表示内容**:
  - 最終取得時刻（相対表示：「3分前」）
  - 次回取得までの残り時間（「7分」）
  - ポーリング中のローディングインジケーター
- **未取得時**: 「最終取得: 未取得」
- **date-fns**: `formatDistanceToNow()`で日本語表示

### 11.6 ArticleContext拡張

#### ポーリング状態管理

```typescript
interface ArticleState {
  // 既存フィールド
  articles: Article[];
  displayedArticles: Article[];
  // ポーリング関連フィールド
  pendingArticles: Article[];
  hasNewArticles: boolean;
  newArticlesCount: number;
  lastPolledAt: number | null;
}
```

#### アクション

- `SET_PENDING_ARTICLES`: 新着記事を一時保存
- `APPLY_PENDING_ARTICLES`: 新着記事を表示記事にマージ
- `SET_LAST_POLLED_AT`: 最終ポーリング時刻を更新

### 11.7 useFeedPolling フック

#### 責務

- ポーリングタイマー管理（setInterval/clearInterval）
- オンライン/オフライン状態監視
- 購読フィード変更時の再起動

#### パラメータ

```typescript
interface UseFeedPollingParams {
  subscriptions: Subscription[];
  onPoll: () => void;
  isOnline: boolean;
  intervalMs?: number;
}
```

#### 戻り値

```typescript
interface PollingState {
  pendingArticles: Article[];
  hasNewArticles: boolean;
  newArticlesCount: number;
  lastPolledAt: number | null;
}
```

### 11.8 統合フロー

```text
[10分経過]
  ↓
[useFeedPolling]
  ↓ onPoll()
[FeedContainer]
  ↓ fetchFeeds()
[バックエンドAPI]
  ↓ 記事取得
[findNewArticles]
  ↓ 新着検出
[ArticleContext]
  ↓ SET_PENDING_ARTICLES
[NewArticlesNotification]
  ↓ 表示
[ユーザー「読み込む」クリック]
  ↓ APPLY_PENDING_ARTICLES
[ArticleContext]
  ↓ 記事マージ
[UI更新]
```

### 11.9 テスト

#### ユニットテスト

- `findNewArticles.test.ts`: 新着記事検出ロジック（7テスト + 1パフォーマンステスト）
- `useFeedPolling.test.ts`: ポーリングフック（5テスト）
- `pollingStorage.test.ts`: localStorage管理（9テスト）
- `NewArticlesNotification.test.tsx`: 通知UI（11テスト）
- `PollingStatus.test.tsx`: 状態表示（4テスト）

#### 統合テスト

- `polling-flow.test.tsx`: エンドツーエンドフロー（5テスト、2スキップ）
- `FeedContainer.test.tsx`: useFeedPolling統合（5テスト）

#### テストカバレッジ

- 新規コード: 100%
- 全体: 既存テストと合わせて高カバレッジ維持

---

## 12. テスト・品質保証

### 12.1 テストカバレッジ

- **全体**: 93.2%（目標 80%を達成）
  - Statement: 93.2%
  - Branch: 87.17%
  - Function: 98.42%
  - Line: 93.67%

### 11.2 テスト種別

#### ユニットテスト

- コンポーネント単体テスト
- ユーティリティ関数テスト
- バリデーション関数テスト

#### 統合テスト

- フィード追加フロー
- タイトル編集フロー
- エラーハンドリング
- プレビュー機能

#### E2E テスト

- （オプション、未実装）

### 11.3 CI/CD

#### GitHub Actions

- プッシュ時に自動実行
- Lint チェック（ESLint）
- 型チェック（TypeScript）
- テスト実行（Vitest）
- カバレッジレポート生成

#### コード品質基準

- ESLint 警告: 0 件
- TypeScript ビルドエラー: 0 件
- テストカバレッジ: 80%以上

---

## 12. 制約・制限事項

### 12.1 システム制約

- **購読数上限**: 100 件
- **タイトル最大長**: 200 文字
- **フィード取得タイムアウト**: 10 秒
- **タイトルキャッシュ TTL**: 10 分

### 12.2 ブラウザ要件

- モダンブラウザ（Chrome, Firefox, Safari, Edge 最新版）
- localStorage 対応必須
- JavaScript 有効化必須
- Service Worker 対応（PWA 機能利用時）

### 12.3 既知の制限

- 認証・ユーザー管理なし（シングルユーザー）
- フィード更新の自動通知なし（手動リフレッシュ）
- オフライン時の新規フィード追加不可（ネットワーク必須）
- 記事データは最後にオンライン時に取得したものをキャッシュ表示

---

## 13. 制約・制限事項

### 13.1 購読数上限

- **最大購読数**: 100 件
- **理由**: localStorage の容量制限とパフォーマンス維持のため
- **エラーメッセージ**: 「購読数が上限（100 件）に達しています」

### 13.2 localStorage 依存

- **問題**: ブラウザの localStorage を削除するとデータが消失
- **対策**: 定期的なバックアップ推奨（将来的にエクスポート機能追加予定）

### 13.3 ブラウザサポート

- **必須 API**:
  - localStorage
  - Fetch API
  - ES2015+
- **推奨ブラウザ**:
  - Chrome 80+
  - Firefox 75+
  - Safari 13+
  - Edge 80+

---

## 14. セキュリティ

### 14.1 入力検証

- URL スキーム検証（http/https のみ許可）
- XSS 対策（React のデフォルトエスケープ）
- 入力長制限（タイトル 200 文字）

### 14.2 CORS 対策

- バックエンドで CORS 設定
- オリジン検証（本番環境では要設定）

### 14.3 レート制限

- （現状未実装、将来的に検討）

---

## 15. 今後の拡張案

- 記事の既読管理
- カテゴリ・タグ機能
- マルチユーザー対応
- プッシュ通知

---

## 付録 A: データフロー図

```text
[ユーザー]
  ↓ URL入力
[FeedManager]
  ↓ onAddFeed()
[FeedContainer]
  ↓ POST /api/parse
[バックエンドAPI]
  ↓ RSSフィード取得
[外部RSSサーバー]
  ↓ レスポンス
[バックエンドAPI]
  ↓ タイトル返却
[FeedContainer]
  ↓ localStorage保存
[SubscriptionContext]
  ↓ UI更新
[FeedManager]
```

---

## 付録 B: 状態管理

### Context 構造

#### UIContext State Structure

```typescript
{
  showWelcomeScreen: boolean;
  searchQuery: string;
  sortOrder: "newest" | "oldest" | "feed-order";
}
```

#### SubscriptionContext State Structure

```typescript
{
  subscriptions: Subscription[];
}
```

### Reducer Actions

#### UIContext

- `SET_WELCOME_SCREEN`
- `SET_SEARCH_QUERY`
- `SET_SORT_ORDER`

#### SubscriptionContext

- `ADD_SUBSCRIPTION`
- `REMOVE_SUBSCRIPTION`
- `UPDATE_CUSTOM_TITLE`

---

以上が現在の feed-parallel-parse-api システムの全体仕様です。
