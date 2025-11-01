# Research: コードベース全体のリファクタリング

**Feature**: 015-codebase-refactoring
**Created**: 2025-11-02
**Purpose**: リファクタリングの技術的決定事項とベストプラクティスの調査結果

## Overview

このリファクタリングは既存のコードベースの品質向上を目的としており、新しい技術の導入は最小限に抑えます。既存のTypeScript/React/Goの環境内でベストプラクティスに基づいた改善を実施します。

---

## Decision 1: API層のエラーハンドリング戦略

### Context
- 現状: parseFeeds() と fetchFeedTitle() で約70行の重複コード
- 問題: エラー種別（timeout、network、parse）が明確でない
- 目標: コードの重複排除と型安全なエラーハンドリング

### Decision: 共通ユーティリティ関数 + ErrorType enum

#### Rationale
1. **共通ユーティリティ関数（createFeedAPIRequest()）を作成**:
   - タイムアウト処理、AbortController、エラーハンドリングを一箇所に集約
   - ジェネリック型を使用し、API応答の型安全性を保証
   - テスタビリティ向上（モック化が容易）

2. **ErrorType enum でエラー種別を明確化**:
   ```typescript
   enum FeedAPIErrorType {
     TIMEOUT = 'timeout',
     NETWORK = 'network',
     PARSE = 'parse',
     ABORT = 'abort'
   }
   ```
   - エラー種別を文字列リテラル型で定義し、TypeScriptの型推論を活用
   - switch文でexhaustiveness checkを有効化

3. **FeedAPIError クラスの拡張**:
   - エラー種別をプロパティとして保持
   - AbortError 専用のサブクラスを作成せず、type プロパティで区別
   - 既存のエラーハンドリングコードとの互換性を維持

#### Alternatives Considered
- **A. AbortError 専用クラスを作成**: より厳密な型安全性だが、既存コードの変更範囲が大きい
- **B. エラーコードを数値で定義**: 可読性が低く、TypeScriptの型推論が効かない
- **C. エラーハンドリングをミドルウェア化**: 過剰設計（現時点ではAPI呼び出しが2箇所のみ）

#### Implementation Notes
- `frontend/src/services/feedAPIUtils.ts` に共通ユーティリティを作成
- 既存の `feedAPI.ts` から段階的に移行
- テストケースは既存のまま維持（リファクタリング後も動作を保証）

---

## Decision 2: 状態管理の一元化パターン

### Context
- 現状: useFeedPreview.ts で複数の状態変数を個別管理（isLoadingPreview, previewTitle, previewError）
- 問題: 状態の不整合が発生しやすい
- 目標: 状態を単一オブジェクトで管理し、不整合を防止

### Decision: 状態マシンパターン（Discriminated Union）

#### Rationale
1. **Discriminated Union 型を使用**:
   ```typescript
   type PreviewState =
     | { state: 'idle' }
     | { state: 'loading' }
     | { state: 'success'; data: string }
     | { state: 'error'; error: string }
   ```
   - TypeScript の型推論により、各状態で利用可能なプロパティが自動的に決定
   - 不正な状態遷移をコンパイル時に検出

2. **useState で単一オブジェクトを管理**:
   - 状態遷移が明確になる（idle → loading → success/error）
   - Reactの再レンダリング最適化が効きやすい

3. **状態遷移関数を作成**:
   - setPreviewLoading(), setPreviewSuccess(data), setPreviewError(error) などのヘルパー関数
   - コンポーネント側のコード簡潔化

#### Alternatives Considered
- **A. useReducer を使用**: より厳密な状態管理だが、小規模な状態には過剰
- **B. 外部状態管理ライブラリ（Zustand, Jotai）**: 新しい依存関係の追加は避ける
- **C. 現状維持（複数のuseState）**: 状態の不整合リスクが高い

#### Implementation Notes
- `frontend/src/hooks/useFeedPreview.ts` を変更
- 既存のコンポーネント（FeedManager.tsx）は最小限の変更で済むようにインターフェースを維持
- テストケースは状態遷移を網羅的にカバー

---

## Decision 3: useEffect の集約戦略（カスタムフック化）

### Context
- 現状: FeedContainer.tsx に8個のuseEffect が存在
- 問題: 複雑な依存配列管理、eslint-disableコメント多数
- 目標: コードの可読性向上と依存配列管理の簡素化

### Decision: useFeedSync() カスタムフックの作成

#### Rationale
1. **カスタムフックで関心事を分離**:
   ```typescript
   function useFeedSync(subscriptions: Subscription[], articles: Article[]) {
     // フィード同期ロジックを集約
     return { syncedFeeds, isSync ing, error }
   }
   ```
   - フィード同期に関連するuseEffectを1つのカスタムフックに集約
   - FeedContainer.tsx の責務を「表示」のみに限定

2. **依存配列の管理を簡潔化**:
   - カスタムフック内でuseCallbackとuseMemoを適切に使用
   - eslint-disableコメントを削除し、Reactのルールに準拠

3. **テスタビリティの向上**:
   - カスタムフックは独立してテスト可能（@testing-library/react-hooks を使用）
   - FeedContainer.tsxのテストがシンプルになる

#### Alternatives Considered
- **A. useReducer で状態管理**: 状態遷移は複雑ではないため過剰
- **B. 複数の小さいカスタムフックに分割**: かえって複雑になる可能性
- **C. そのまま8個のuseEffectを残す**: 可読性とメンテナンス性が低い

#### Implementation Notes
- `frontend/src/hooks/useFeedSync.ts` を新規作成
- FeedContainer.tsx から段階的に移行
- 既存のテストケースは引き続きパスすることを保証

---

## Decision 4: debounce 実装パターン

### Context
- 現状: SearchBar.tsx で useEffect内でタイマーを管理
- 問題: onSearchが毎回新規作成されるとdebounceが機能しない
- 目標: 確実にdebounceが動作するパターンに変更

### Decision: カスタムフック useDebounce() の作成

#### Rationale
1. **useDebounce() カスタムフックを作成**:
   ```typescript
   function useDebounce<T>(value: T, delay: number): T {
     const [debouncedValue, setDebouncedValue] = useState(value)
     useEffect(() => {
       const timer = setTimeout(() => setDebouncedValue(value), delay)
       return () => clearTimeout(timer)
     }, [value, delay])
     return debouncedValue
   }
   ```
   - 汎用的で再利用可能
   - テストしやすい

2. **SearchBar.tsx での使用**:
   ```typescript
   const debouncedQuery = useDebounce(searchQuery, 300)
   useEffect(() => {
     onSearch(debouncedQuery)
   }, [debouncedQuery, onSearch])
   ```
   - onSearch が新規作成されても影響を受けない
   - 依存配列が明確

3. **useCallback で onSearch をメモ化**:
   - 親コンポーネント側でonSearchをuseCallbackで包む
   - 不要な再レンダリングを防止

#### Alternatives Considered
- **A. lodash.debounce を使用**: 新しい依存関係の追加は避ける
- **B. useCallback のみで対処**: onSearchが変更されるとdebounceがリセットされる
- **C. useRef でタイマーを管理**: コードが複雑になる

#### Implementation Notes
- `frontend/src/hooks/useDebounce.ts` を新規作成（小規模な汎用フック）
- SearchBar.tsx を変更
- 親コンポーネントでonSearchをuseCallbackで包む

---

## Decision 5: Go バックエンドのlogger設計改善

### Context
- 現状: グローバル変数 logger を main.go で定義
- 問題: テスト時に初期化チェックが必要
- 目標: テスタビリティの向上と設計の明確化

### Decision: init() 関数での統一初期化

#### Rationale
1. **init() 関数で logger を初期化**:
   ```go
   var logger *log.Logger

   func init() {
       logger = log.New(os.Stdout, "INFO: ", log.Ldate|log.Ltime)
   }
   ```
   - プログラム起動時に自動的に初期化
   - テストでも確実に初期化される

2. **Dependency Injection は過剰**:
   - 現状のコードベースでは logger はシンプルな標準ライブラリのみ使用
   - DI フレームワークの導入は YAGNI 原則に反する

3. **テスト時の柔軟性**:
   - テストで logger を上書きできるようにする（オプション）
   - テスト専用の logger を注入可能にする

#### Alternatives Considered
- **A. Dependency Injection を導入**: 過剰設計（現時点でloggerのみ）
- **B. グローバル変数のまま**: テスト時の初期化チェックが残る
- **C. context.Context で logger を渡す**: Go の慣例に反する（logger は通常グローバル）

#### Implementation Notes
- `cmd/server/main.go` の logger 定義を init() 関数に移動
- テストファイルでの初期化チェックを削除

---

## Decision 6: CORS設定の環境変数化

### Context
- 現状: CORS Origin が "*" にハードコード化
- 問題: セキュリティリスク、環境ごとの設定変更が困難
- 目標: 環境変数で CORS を制御し、柔軟性とセキュリティを向上

### Decision: CORS_ALLOWED_ORIGINS 環境変数の導入

#### Rationale
1. **環境変数からORIGIN_LISTを読み込み**:
   ```go
   allowedOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
   if allowedOrigins == "" {
       allowedOrigins = "*" // デフォルト値
   }
   ```
   - 開発環境: `CORS_ALLOWED_ORIGINS=*`
   - 本番環境: `CORS_ALLOWED_ORIGINS=https://example.com,https://www.example.com`

2. **カンマ区切りで複数ORIGIN指定**:
   - 柔軟な設定が可能
   - デプロイ時に環境変数で簡単に変更

3. **Vercel環境変数との統合**:
   - VercelのダッシュボードでCORS_ALLOWED_ORIGINSを設定
   - デプロイ時に自動適用

#### Alternatives Considered
- **A. 設定ファイル（config.json）**: 環境ごとにファイルを管理する必要があり煩雑
- **B. ハードコードのまま**: セキュリティリスクが高い
- **C. ミドルウェアライブラリ（rs/cors）**: 標準ライブラリで十分対応可能

#### Implementation Notes
- `cmd/server/main.go` のCORS設定部分を変更
- 環境変数のドキュメントをREADME.mdに追加
- Vercel環境変数を設定（別タスク）

---

## Decision 7: useMemo依存配列の最適化

### Context
- 現状: FeedManager.tsx の subscriptionListItems が12個の依存配列を持つ
- 問題: 過剰なメモ化により、キャッシュ効果が薄い
- 目標: 依存配列を最小限に絞り込み、パフォーマンス向上

### Decision: 依存配列の精査と関数のメモ化改善

#### Rationale
1. **依存配列の精査**:
   - 本当に必要な依存のみを残す
   - 不要な依存を削除し、useMemoの再計算頻度を減らす

2. **useCallback の適切な使用**:
   - useFeedTitleEdit から返される関数をしっかりメモ化
   - メモ化された関数は依存配列から外す

3. **計算コストの評価**:
   - subscriptionListItems の計算コストを測定
   - 計算コストが低い場合はuseMemoを削除することも検討

#### Alternatives Considered
- **A. useMemoを完全に削除**: 計算コストが高い場合はパフォーマンス低下
- **B. React.memo でコンポーネント全体をメモ化**: 依存配列の問題は解決しない
- **C. そのまま12個の依存配列を残す**: メモ化の効果が薄い

#### Implementation Notes
- FeedManager.tsx の subscriptionListItems useMemoを精査
- useFeedTitleEdit フックの返り値をメモ化
- パフォーマンス測定（React DevTools Profiler）

---

## Decision 8: エラーメッセージの一元管理

### Context
- 現状: エラーメッセージが定数ファイルとコンポーネント内に分散
- 問題: 一貫性がなく、将来の多言語対応が困難
- 目標: 全エラーメッセージをerrorMessages.tsで一元管理

### Decision: errorMessages.ts の拡充とコンポーネントからの移行

#### Rationale
1. **既存の errorMessages.ts を拡充**:
   - 全てのエラーメッセージを定数として定義
   - カテゴリ別に整理（API, Validation, UI, etc.）

2. **i18n 対応の準備**:
   - 将来の多言語対応時に翻訳ファイルへの移行が容易
   - 現時点では日本語のみサポート

3. **コンポーネントからの段階的移行**:
   - FeedManager.tsx などのコンポーネント内のエラーメッセージ文字列を errorMessages から参照
   - 検索置換で一括変更可能

#### Alternatives Considered
- **A. i18n ライブラリ（react-i18next）を今すぐ導入**: 現時点では過剰（多言語対応は範囲外）
- **B. コンポーネント内にそのまま残す**: 保守性が低い
- **C. JSON ファイルで管理**: TypeScript の型推論が効かない

#### Implementation Notes
- `frontend/src/constants/errorMessages.ts` を拡充
- コンポーネント内のエラーメッセージ文字列を errorMessages から参照するように変更
- テストケースは既存のまま維持

---

## Summary

全ての技術的決定は以下の原則に基づいています：

1. **YAGNI（You Aren't Gonna Need It）**: 過剰設計を避け、現在の要求を満たす最小限の変更
2. **既存のテストを維持**: リファクタリング後も既存のテストケースが全てパス
3. **新しい依存関係の最小化**: 既存のTypeScript/React/Go環境内で完結
4. **段階的な実装**: 各ユーザーストーリー（P1, P2, P3）ごとに独立して実装・テスト可能

次のステップ: `/speckit.tasks` で実装タスクを生成
