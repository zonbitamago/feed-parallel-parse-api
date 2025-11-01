# Quick Start: feedUrl フィールド追加実装ガイド

**Feature**: 001-fix-feedurl-api-mismatch
**対象**: 開発者（Backend + Frontend）
**所要時間**: 約2-3時間（TDDサイクル込み）

## 概要

この機能は、API応答に`feedUrl`フィールドを追加し、フロントエンドのフィードマッチングロジックを修正します。

**問題**: API応答の`link`（ホームページURL）でマッチングしているため、実際のRSSフィードURL（`https://feeds.rebuild.fm/rebuildfm`）と一致しない
**解決**: API応答に`feedUrl`（実際のRSSフィードURL）を追加し、フロントエンドで`f.feedUrl`を使用してマッチング

---

## 前提条件

### 開発環境

- **Backend**: Go 1.25.1+
- **Frontend**: Node.js 25.0.0+, npm 11.6.2+
- **エディタ**: VSCode推奨（`.vscode/settings.json`に設定済み）

### 依存関係

```bash
# Backend
cd /Users/k-takiuchi/Documents/feed-parallel-parse-api
# Goモジュールは既にインストール済み（github.com/mmcdole/gofeed）

# Frontend
cd frontend
npm install
```

---

## 実装手順（TDDサイクル）

### Phase 0: 環境準備

1. **ブランチ確認**:
```bash
git branch
# 現在のブランチ: 001-fix-feedurl-api-mismatch
```

2. **既存テストの実行**:
```bash
# Backend
go test ./tests/unit/... -v

# Frontend
cd frontend
npm test
```

**期待結果**: 全テスト合格

---

### Phase 1: Backend実装（Go）

#### Step 1.1: モデル定義のテスト（Red）

**ファイル**: `tests/unit/rss_model_test.go`

```go
// 🔴 Red: このテストは失敗する（FeedURL フィールドがまだ存在しない）
func TestRSSFeedModel_FeedURLフィールド存在確認(t *testing.T) {
	feed := models.RSSFeed{
		Title:    "テストフィード",
		Link:     "https://example.com",
		FeedURL:  "https://example.com/rss",  // ← まだ存在しないフィールド
		Articles: []models.Article{},
	}

	assert.Equal(t, "https://example.com/rss", feed.FeedURL)
}
```

**実行**:
```bash
go test ./tests/unit/rss_model_test.go -v
```

**期待結果**: ❌ コンパイルエラー（`unknown field 'FeedURL'`）

---

#### Step 1.2: モデル定義の実装（Green）

**ファイル**: `pkg/models/rss.go`

```go
// ✅ Green: 最小限の変更でテストを通す
type RSSFeed struct {
	Title    string    `json:"title"`
	Link     string    `json:"link"`
	FeedURL  string    `json:"feedUrl"`  // 追加
	Articles []Article `json:"articles"`
}
```

**実行**:
```bash
go test ./tests/unit/rss_model_test.go -v
```

**期待結果**: ✅ テスト合格

**コミット**:
```bash
git add pkg/models/rss.go tests/unit/rss_model_test.go
git commit -m "feat(backend): RSSFeedモデルにFeedURLフィールド追加（Green）"
```

---

#### Step 1.3: サービス層のテスト（Red）

**ファイル**: `tests/unit/rss_service_test.go`

```go
// 🔴 Red: このテストは失敗する（feedToRSSFeedがFeedURLを設定していない）
func TestRSSService_FeedLinkからFeedURL設定(t *testing.T) {
	// gofeedのFeed構造をモック
	mockFeed := &gofeed.Feed{
		Title:    "Test Feed",
		Link:     "https://example.com",
		FeedLink: "https://example.com/rss",  // feed.FeedLink
		Items:    []*gofeed.Item{},
	}

	result := feedToRSSFeed(mockFeed, "https://example.com/rss")

	assert.Equal(t, "https://example.com/rss", result.FeedURL)
}

func TestRSSService_FeedLinkが空の場合のフォールバック(t *testing.T) {
	mockFeed := &gofeed.Feed{
		Title:    "Test Feed",
		Link:     "https://example.com",
		FeedLink: "",  // 空
		Items:    []*gofeed.Item{},
	}

	requestedURL := "https://example.com/feed.xml"
	result := feedToRSSFeed(mockFeed, requestedURL)

	assert.Equal(t, requestedURL, result.FeedURL)  // フォールバック
}
```

**実行**:
```bash
go test ./tests/unit/rss_service_test.go -v
```

**期待結果**: ❌ テスト失敗（`FeedURL`が空）

---

#### Step 1.4: サービス層の実装（Green）

**ファイル**: `pkg/services/rss_service.go`

```go
// ✅ Green: FeedLinkからFeedURLを設定
func feedToRSSFeed(feed *gofeed.Feed, requestedURL string) *models.RSSFeed {
	// FeedURLの設定（優先順位: feed.FeedLink → requestedURL）
	feedURL := feed.FeedLink
	if feedURL == "" {
		feedURL = requestedURL
	}

	// 既存のコード...
	articles := make([]models.Article, len(feed.Items))
	// ...

	return &models.RSSFeed{
		Title:    feed.Title,
		Link:     feed.Link,
		FeedURL:  feedURL,  // 追加
		Articles: articles,
	}
}
```

**実行**:
```bash
go test ./tests/unit/... -v
```

**期待結果**: ✅ 全テスト合格

**コミット**:
```bash
git add pkg/services/rss_service.go tests/unit/rss_service_test.go
git commit -m "feat(backend): RSSServiceでfeed.FeedLinkからFeedURLを設定（Green）"
```

---

#### Step 1.5: Refactor（リファクタリング）

**確認項目**:
- [ ] コードの重複がないか？
- [ ] 変数名が意図を明確に表現しているか？
- [ ] エラーハンドリングが適切か？

**今回の場合**: シンプルな変更のため、リファクタリング不要

---

### Phase 2: Frontend実装（TypeScript）

#### Step 2.1: 型定義のテスト（Red）

**ファイル**: `frontend/src/types/api.test.ts`（新規作成）

```typescript
import { describe, it, expect } from 'vitest'
import type { RSSFeed } from './api'

// 🔴 Red: このテストは失敗する（feedUrlフィールドがまだ存在しない）
describe('RSSFeed型定義', () => {
  it('feedUrlフィールドが存在する', () => {
    const feed: RSSFeed = {
      title: 'Test Feed',
      link: 'https://example.com',
      feedUrl: 'https://example.com/rss',  // ← まだ存在しないフィールド
      articles: [],
    }

    expect(feed.feedUrl).toBeDefined()
    expect(feed.feedUrl).toBe('https://example.com/rss')
  })
})
```

**実行**:
```bash
cd frontend
npm test api.test.ts
```

**期待結果**: ❌ TypeScriptコンパイルエラー（`Property 'feedUrl' does not exist`）

---

#### Step 2.2: 型定義の実装（Green）

**ファイル**: `frontend/src/types/api.ts`

```typescript
// ✅ Green: feedUrlフィールドを追加
export interface RSSFeed {
  title: string;
  link: string;
  feedUrl: string;  // 追加
  articles: APIArticle[];
}
```

**実行**:
```bash
npm test api.test.ts
```

**期待結果**: ✅ テスト合格

**コミット**:
```bash
git add frontend/src/types/api.ts frontend/src/types/api.test.ts
git commit -m "feat(frontend): RSSFeed型にfeedUrlフィールド追加（Green）"
```

---

#### Step 2.3: マッチングロジックのテスト（Red）

**ファイル**: `frontend/src/hooks/useFeedAPI.test.ts`

```typescript
// 🔴 Red: このテストは失敗する（まだf.linkを使用している）
it('feedUrlを使用してマッチングする', async () => {
  const mockFeeds = [
    {
      title: 'Tech Blog',
      link: 'https://example.com',  // ホームページURL
      feedUrl: 'https://example.com/rss',  // 実際のRSSフィードURL
      articles: [{ title: 'Article 1', link: 'https://example.com/1', pubDate: '2025-01-01', summary: 'test' }],
    },
  ]

  const subscriptions = [
    {
      id: '1',
      url: 'https://example.com/rss',  // ユーザーが登録したURL
      title: '',
      subscribedAt: new Date().toISOString(),
      lastFetchedAt: null,
      status: 'active' as const,
    },
  ]

  // モックサーバーを設定
  server.use(
    http.post('*/api/parse', () => {
      return HttpResponse.json({ feeds: mockFeeds, errors: [] })
    })
  )

  const { result } = renderHook(() => useFeedAPI())

  await act(async () => {
    await result.current.fetchFeeds(subscriptions)
  })

  // 期待: feedUrl（https://example.com/rss）でマッチング成功
  expect(result.current.articles.length).toBe(1)
  expect(result.current.articles[0].title).toBe('Article 1')
})
```

**実行**:
```bash
npm test useFeedAPI.test.ts
```

**期待結果**: ❌ テスト失敗（`articles.length`が0、マッチング失敗）

---

#### Step 2.4: マッチングロジックの実装（Green）

**ファイル**: `frontend/src/hooks/useFeedAPI.ts`

```typescript
// ✅ Green: f.link → f.feedUrl に変更
function findMatchingFeed(
  subscription: Subscription,
  feeds: RSSFeed[]
): RSSFeed | undefined {
  const normalizedSubscriptionUrl = normalizeUrl(subscription.url)
  const matchedFeed = feeds.find(f => normalizeUrl(f.feedUrl) === normalizedSubscriptionUrl)  // 変更

  if (!matchedFeed) {
    console.warn(
      `フィードマッチング失敗: subscription.url="${subscription.url}" (正規化後: "${normalizedSubscriptionUrl}")`,
      `利用可能なフィードURL:`,
      feeds.map(f => f.feedUrl)  // 変更
    )
  }

  return matchedFeed
}
```

**実行**:
```bash
npm test useFeedAPI.test.ts
```

**期待結果**: ✅ テスト合格

**コミット**:
```bash
git add frontend/src/hooks/useFeedAPI.ts frontend/src/hooks/useFeedAPI.test.ts
git commit -m "feat(frontend): フィードマッチングでfeedUrlを使用（Green）"
```

---

#### Step 2.5: モックデータの更新

**ファイル**: `frontend/tests/integration/searchFlow.test.tsx`

```typescript
// 全てのMSWモックにfeedUrlフィールドを追加
http.post('*/api/parse', async () => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return HttpResponse.json({
    feeds: [
      {
        title: 'Tech Blog',
        link: 'https://example.com/rss',
        feedUrl: 'https://example.com/rss',  // 追加
        articles: [
          // ...
        ],
      },
    ],
    errors: [],
  })
})
```

**実行**:
```bash
npm test searchFlow.test.tsx
```

**期待結果**: ✅ テスト合格

**コミット**:
```bash
git add frontend/tests/integration/searchFlow.test.tsx
git commit -m "test(frontend): 統合テストのモックにfeedUrl追加"
```

---

### Phase 3: 統合テスト

#### Step 3.1: Backend統合テスト

**ファイル**: `tests/contract/parse_api_test.go`

```go
func TestParseAPI_FeedURLフィールド存在確認(t *testing.T) {
	// 実際のAPIエンドポイントを叩いて、feedUrlフィールドの存在を確認
	// （契約テスト）
}
```

#### Step 3.2: 全テスト実行

```bash
# Backend
go test ./tests/... -v

# Frontend
cd frontend
npm test
```

**期待結果**: ✅ 全テスト合格

---

## デプロイ手順

### 1. プレデプロイチェック

```bash
# Backend型チェック
go build ./...

# Frontendビルド
cd frontend
npm run build

# Lint
npm run lint
```

### 2. デプロイ順序

1. **Backend**: Vercelに自動デプロイ（プッシュ時）
2. **検証**: `/api/parse`を叩いて`feedUrl`フィールドを確認
3. **Frontend**: Vercelに自動デプロイ
4. **検証**: Rebuild.fmで記事が表示されることを確認

---

## トラブルシューティング

### 問題1: `feedUrl`が空文字列

**原因**: `feed.FeedLink`が空 & フォールバックロジックが動作していない

**解決**:
```go
// pkg/services/rss_service.go
feedURL := feed.FeedLink
if feedURL == "" {
    feedURL = requestedURL  // ← これが実行されているか確認
}
```

### 問題2: フロントエンドでマッチング失敗

**原因**: `f.link`を使用している（`f.feedUrl`に変更し忘れ）

**解決**:
```typescript
// frontend/src/hooks/useFeedAPI.ts
const matchedFeed = feeds.find(f => normalizeUrl(f.feedUrl) === normalizedSubscriptionUrl)
// ↑ f.feedUrl になっているか確認
```

### 問題3: テストが失敗

**原因**: モックデータに`feedUrl`フィールドがない

**解決**:
```typescript
// 全てのMSWモックに追加
{
  title: '...',
  link: '...',
  feedUrl: '...',  // ← これを追加
  articles: [...]
}
```

---

## 参考リソース

- **仕様書**: [spec.md](./spec.md)
- **実装計画**: [plan.md](./plan.md)
- **データモデル**: [data-model.md](./data-model.md)
- **API契約**: [contracts/api-schema.json](./contracts/api-schema.json)
- **TDD原則**: [.specify/memory/constitution.md](../../.specify/memory/constitution.md)

---

## 所要時間の目安

| フェーズ | 所要時間 |
|---------|---------|
| Backend実装（TDDサイクル5回） | 60分 |
| Frontend実装（TDDサイクル5回） | 60分 |
| 統合テスト | 20分 |
| デプロイ・検証 | 20分 |
| **合計** | **約2-3時間** |

---

## チェックリスト

実装完了前に以下を確認:

- [ ] Backend: `pkg/models/rss.go`に`FeedURL`フィールド追加
- [ ] Backend: `pkg/services/rss_service.go`で`feed.FeedLink`から`FeedURL`を設定
- [ ] Backend: フォールバックロジック実装（`feed.FeedLink`が空の場合）
- [ ] Frontend: `types/api.ts`に`feedUrl`フィールド追加
- [ ] Frontend: `hooks/useFeedAPI.ts`で`f.feedUrl`を使用
- [ ] Frontend: 全モックデータに`feedUrl`フィールド追加
- [ ] Backend全テスト合格
- [ ] Frontend全テスト合格
- [ ] Lint警告ゼロ
- [ ] ビルド成功
