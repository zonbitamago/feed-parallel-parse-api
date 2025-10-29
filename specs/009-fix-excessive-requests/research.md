# Research: フィード登録時のタイトル保存による過剰リクエスト削減

**Date**: 2025-10-29
**Feature**: 009-fix-excessive-requests

## Overview

この文書は、フィード登録時のタイトル保存機能の実装に関する技術調査結果をまとめたものです。Technical Contextには"NEEDS CLARIFICATION"項目はありませんでしたが、実装のベストプラクティスと技術選択について調査しました。

## 調査項目

### 1. localStorage使用のベストプラクティス

**Decision**: localStorage APIを使用してSubscriptionデータを永続化

**Rationale**:
- **シンプル**: 同期的なAPI、追加ライブラリ不要
- **十分な容量**: 5-10MBの容量は、50個のフィード購読データ（JSON形式）には十分
- **ブラウザサポート**: すべてのモダンブラウザでサポート済み
- **既存実装**: プロジェクトですでにlocalStorageを使用している

**Alternatives considered**:
- **IndexedDB**: より大きな容量と非同期API
  - **却下理由**: 今回のデータ量（数KB〜数十KB）では過剰。非同期APIは複雑性を増す
- **SessionStorage**: ブラウザセッション中のみ保持
  - **却下理由**: データの永続性が必要
- **Cookies**: サーバーとの通信で使用
  - **却下理由**: 4KBの容量制限、すべてのリクエストで送信される

**Implementation notes**:
- JSON.stringify/parseを使用
- エラーハンドリング（QuotaExceededError）を実装
- データマイグレーション関数を追加

### 2. データマイグレーション戦略

**Decision**: アプリケーション起動時に自動マイグレーション

**Rationale**:
- **透過的**: ユーザーに影響なし
- **後方互換性**: 既存データを破壊しない
- **シンプル**: 複雑なバージョン管理不要

**Migration algorithm**:
```typescript
function migrateSubscriptions(subscriptions: Subscription[]): Subscription[] {
  return subscriptions.map(sub => {
    if (!sub.title) {
      return { ...sub, title: sub.feedUrl }
    }
    return sub
  })
}
```

**Alternatives considered**:
- **バージョン番号による段階的移行**:
  - **却下理由**: 今回は1回限りの単純な移行。バージョン管理は過剰
- **バックグラウンド移行（Web Worker）**:
  - **却下理由**: データ量が小さいため不要
- **手動移行プロンプト**:
  - **却下理由**: ユーザーエクスペリエンスが低下

### 3. APIタイムアウト設定

**Decision**: フェッチAPI with AbortControllerを使用、10秒タイムアウト

**Rationale**:
- **標準API**: 追加ライブラリ不要
- **適切なタイムアウト**: RSSフィードパースには通常1-3秒、10秒は余裕を持った設定
- **キャンセル可能**: AbortControllerでリクエストをキャンセル可能

**Implementation example**:
```typescript
async function fetchWithTimeout(url: string, timeout: number = 10000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw error
  }
}
```

**Alternatives considered**:
- **Axios with timeout**:
  - **却下理由**: 追加の依存関係。フェッチAPIで十分
- **Promise.race**:
  - **却下理由**: リクエストをキャンセルできない（メモリリーク）
- **より長いタイムアウト（30秒など）**:
  - **却下理由**: ユーザー体験が低下。10秒で十分

### 4. React状態管理とuseEffectの依存配列

**Decision**: useEffectの依存配列からsubscriptionsオブジェクトを削除、lengthのみ保持

**Rationale**:
- **根本原因の解決**: タイトル更新によるuseEffectの再実行を防ぐ
- **意図の明確化**: "購読リストの追加・削除"のみでエフェクトを実行
- **パフォーマンス**: 不要な再レンダリングを防ぐ

**Current (problematic)**:
```typescript
useEffect(() => {
  if (subState.subscriptions.length > 0) {
    fetchFeeds(subState.subscriptions)
  }
}, [subState.subscriptions.length, subState.subscriptions, fetchFeeds])
```

**Improved**:
```typescript
useEffect(() => {
  if (subState.subscriptions.length > 0) {
    fetchFeeds(subState.subscriptions)
  }
}, [subState.subscriptions.length, fetchFeeds])
```

**Alternatives considered**:
- **useMemoでsubscriptionsをメモ化**:
  - **却下理由**: 根本原因を解決しない。複雑性が増す
- **useRefで以前の値を保持**:
  - **却下理由**: 依存配列から削除する方がシンプル
- **subscriptions.map(s => s.id).join()で比較**:
  - **却下理由**: lengthのみで十分

### 5. 重複登録チェック

**Decision**: フィード登録時にfeedUrlで重複チェック

**Rationale**:
- **ユーザーエクスペリエンス**: 同じフィードの重複登録を防ぐ
- **データ整合性**: 一意性を保証
- **シンプル**: URLの完全一致比較

**Implementation**:
```typescript
function isDuplicateFeed(subscriptions: Subscription[], feedUrl: string): boolean {
  return subscriptions.some(sub => sub.feedUrl === feedUrl)
}
```

**Alternatives considered**:
- **正規化されたURLで比較（trailing slashなど）**:
  - **却下理由**: 複雑性が増す。完全一致で十分
- **ドメインレベルで重複チェック**:
  - **却下理由**: 同じドメインでも複数のフィードが存在する可能性
- **重複を許可**:
  - **却下理由**: ユーザーエクスペリエンスが低下

### 6. ローディングインジケーター実装

**Decision**: isLoadingフラグとReactのloading stateを使用

**Rationale**:
- **標準パターン**: React の一般的な実装パターン
- **シンプル**: useState で管理
- **UIフィードバック**: ユーザーに処理中であることを通知

**Implementation approach**:
```typescript
const [isRegistering, setIsRegistering] = useState(false)

async function handleRegisterFeed(url: string) {
  setIsRegistering(true)
  try {
    // API call
  } finally {
    setIsRegistering(false)
  }
}
```

**Alternatives considered**:
- **Suspense境界**:
  - **却下理由**: データフェッチングライブラリ（React Query など）が必要
- **グローバルローディング状態**:
  - **却下理由**: ローカルな操作にはローカル状態で十分
- **プログレスバー（%表示）**:
  - **却下理由**: 進捗を計算できない。スピナーで十分

### 7. テスト戦略

**Decision**: Vitest + @testing-library/react + MSW（Mock Service Worker）

**Rationale**:
- **既存の選択**: プロジェクトですでに使用中
- **高速**: Vitestは高速な実行速度
- **ユーザー中心**: @testing-library/reactはユーザー視点のテスト
- **APIモック**: MSWでネットワークリクエストをモック

**Test structure**:
- **Unit tests** (70%):
  - storage.ts の各関数（loadSubscriptions, saveSubscriptions, migrateSubscriptions）
  - useFeedAPI hook
  - 重複チェック関数
  - タイムアウト処理

- **Integration tests** (20%):
  - FeedContainer コンポーネント
  - Context と Hooks の連携
  - localStorage との統合

- **E2E tests** (10%):
  - フィード登録からタイトル表示までの完全なフロー
  - リロード後のデータ永続性確認

**Alternatives considered**:
- **Jest**:
  - **却下理由**: Vitestの方が高速でViteとの統合が良い
- **Cypress**:
  - **却下理由**: 既存のテストインフラがVitest
- **手動テスト**:
  - **却下理由**: 憲法で自動テストが必須

## Summary

すべての技術選択は以下の原則に従っています：

1. **シンプルさ優先**: 追加ライブラリを避け、標準APIを使用
2. **既存パターンの踏襲**: プロジェクトの既存実装と一貫性を保つ
3. **テスト可能性**: すべての決定はテスト容易性を考慮
4. **ユーザーエクスペリエンス**: パフォーマンスとフィードバックを重視
5. **YAGNI**: 現在の要求のみに焦点を当て、過剰設計を避ける

これらの調査結果は、Phase 1のdata-model.mdとcontracts生成の基礎となります。