# Quickstart: Vercel CORS設定追加

**目的**: Vercelプレビュー環境でのCORSエラーを解消し、開発フローを改善する

## 問題の背景

### 現状

```
プレビュー環境:
  Frontend: https://feed-parallel-parse-api-git-XXX-*.vercel.app/
  Backend:  https://feed-parallel-parse-api.vercel.app/api/parse
  → 異なるドメイン（Cross-Origin） → CORSエラー ❌
```

### エラーメッセージ

```
Access to fetch at 'https://feed-parallel-parse-api.vercel.app/api/parse'
from origin 'https://feed-parallel-parse-api-git-013-do-5c4ce1-zonbitamagos-projects.vercel.app'
has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 解決策

### 実装内容

[api/parse.go](../../api/parse.go) にCORSヘッダーを追加：

```go
func Handler(w http.ResponseWriter, r *http.Request) {
	// CORS ヘッダー設定
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// プリフライト OPTIONS リクエストの処理
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// 既存のコード...
}
```

### 期待される結果

```
プレビュー環境（修正後）:
  Frontend: https://feed-parallel-parse-api-git-014-*.vercel.app/
  Backend:  https://feed-parallel-parse-api.vercel.app/api/parse
  → CORSヘッダーあり → 正常動作 ✅
```

## 開発者向けガイド

### 1. ブランチのチェックアウト

```bash
git checkout 014-vercel-cors-support
```

### 2. コード変更の確認

```bash
# 変更内容を確認
git diff main api/parse.go
```

### 3. ローカル環境での確認（オプション）

ローカル環境は既にCORS設定済み（[cmd/server/main.go:47-68](../../cmd/server/main.go#L47-L68)）のため、この変更による影響はありません。

```bash
# Dockerローカル環境を起動
docker-compose up

# ブラウザで http://localhost:3000 にアクセス
# フィード解析が正常に動作することを確認
```

### 4. Vercelプレビュー環境での動作確認

#### 4.1 PRの作成

```bash
git add api/parse.go
git commit -m "fix(api): Vercel CORS設定を追加してプレビュー環境のCORSエラーを解消"
git push origin 014-vercel-cors-support
```

GitHub上でPRを作成すると、Vercelが自動でプレビュー環境をデプロイします。

#### 4.2 プレビュー環境のURLを取得

PRのコメントにVercel Botが投稿するプレビューURLをコピー：

```
Preview: https://feed-parallel-parse-api-git-014-vercel-cors-support-*.vercel.app
```

#### 4.3 CORSエラーの解消を確認

1. プレビューURLにアクセス
2. フィードURLを入力（例: `https://zenn.dev/feed`）
3. **ブラウザ開発者ツールを開く**（F12 or Cmd+Opt+I）
4. **Networkタブ**で以下を確認：

**プリフライトリクエスト**:
```http
Request Method: OPTIONS
Status: 200 OK

Response Headers:
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

**実際のリクエスト**:
```http
Request Method: POST
Status: 200 OK

Response Headers:
Access-Control-Allow-Origin: *
Content-Type: application/json
```

5. **Consoleタブ**でCORSエラーが発生していないことを確認

### 5. 本番環境での確認

PRをmainブランチにマージすると、本番環境に自動デプロイされます。

```bash
# 本番環境のURL
https://feed-parallel-parse-api.vercel.app
```

既存の本番環境（Same-Origin構成）では、CORSヘッダーは無視されるため、動作に影響はありません。

## トラブルシューティング

### プレビュー環境でCORSエラーが解消されない

#### 症状
プレビュー環境でフィード解析リクエストを送信しても、引き続きCORSエラーが表示される。

#### 確認手順

1. **ブラウザ開発者ツール > Networkタブ**で`parse`リクエストを確認
2. **Response Headers**に`Access-Control-Allow-Origin`が含まれているか確認

**含まれていない場合**:
- Vercelのデプロイが完了していない可能性
- ブラウザのキャッシュをクリア（Cmd+Shift+R or Ctrl+Shift+R）

**含まれている場合**:
- 別のCORSエラー（例: 認証情報の問題）の可能性
- Consoleタブでエラーメッセージの詳細を確認

#### 解決策

```bash
# Vercelログを確認
gh api repos/zonbitamago/feed-parallel-parse-api/deployments \
  | jq '.[] | select(.environment=="Preview") | .url'

# デプロイログでエラーがないか確認
```

### 本番環境のパフォーマンス低下

#### 症状
本番環境でのAPI応答時間が遅くなった。

#### 確認手順

1. **ブラウザ開発者ツール > Networkタブ**でAPI応答時間を確認
2. 変更前後での比較（±5%以内が正常）

**5%以上遅い場合**:
- CORSヘッダー以外の問題の可能性
- Vercelのステータスページを確認（https://www.vercel-status.com/）

#### 解決策

```bash
# 問題が解消しない場合、PRをリバート
git revert HEAD
git push origin main
```

## 参考資料

- [CORS仕様（MDN）](https://developer.mozilla.org/ja/docs/Web/HTTP/CORS)
- [Vercel サーバーレス関数](https://vercel.com/docs/functions/serverless-functions)
- [ローカル環境のCORS実装](../../cmd/server/main.go#L47-L68)

## 次のステップ

- [ ] プレビュー環境で動作確認完了
- [ ] PRレビュー依頼
- [ ] mainブランチへマージ
- [ ] 本番環境で動作確認
- [ ] [SPECIFICATION.md](../../SPECIFICATION.md) に変更内容を反映（CORS設定の追加）
