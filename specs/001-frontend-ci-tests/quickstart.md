# Quickstart: FrontendテストのCI統合

**Feature**: 001-frontend-ci-tests
**Target Audience**: 開発者、DevOpsエンジニア
**Estimated Setup Time**: 15分

## 前提条件

- GitHub Actionsが有効化されたGitHubリポジトリ
- 既存の`.github/workflows/ci.yml`ファイル
- `frontend/`ディレクトリにVitestテストスイートが存在
- リポジトリへの管理者権限（Branch Protection Rulesの設定に必要）

## セットアップ手順

### ステップ1: CI設定ファイルの編集

`.github/workflows/ci.yml`を編集し、Frontendテストジョブを追加します。

#### 現在の設定（Backendテストのみ）

```yaml
name: CI
on:
  push:
    branches: [main, 001-parallel-rss-parse-api]
  pull_request:
    branches: [main, 001-parallel-rss-parse-api]
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: "1.25"
      - name: Install dependencies
        run: go mod tidy
      - name: Run tests
        run: go test ./... -v
```

#### 更新後の設定（Backend + Frontend並列テスト）

```yaml
name: CI
on:
  push:
    branches: [main, 001-parallel-rss-parse-api]
  pull_request:
    branches: [main, 001-parallel-rss-parse-api]

jobs:
  backend-test:
    name: Backend Tests (Go)
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v3

      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: "1.25"

      - name: Install dependencies
        run: go mod tidy

      - name: Run backend tests
        run: go test ./... -v

  frontend-test:
    name: Frontend Tests (Vitest)
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install frontend dependencies
        run: npm ci
        working-directory: frontend

      - name: Run frontend tests
        run: npm test
        working-directory: frontend
```

**変更点の説明**:
1. ジョブ名を`build-test` → `backend-test`に変更（明確化）
2. 新規ジョブ`frontend-test`を追加（Backendと並列実行）
3. 両ジョブに`timeout-minutes: 10`を設定（FR-007: タイムアウト設定）
4. Node.jsセットアップで依存関係キャッシュを有効化（パフォーマンス最適化）

---

### ステップ2: Branch Protection Rulesの設定

GitHub WebUIで、テストが失敗したプルリクエストのマージをブロックする設定を行います。

1. GitHubリポジトリの **Settings** → **Branches** に移動
2. **Branch protection rules** で保護したいブランチ（例: `main`, `001-parallel-rss-parse-api`）を選択または追加
3. 以下の設定を有効化：
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**（推奨）
   - ステータスチェック検索ボックスで以下を追加：
     - `Backend Tests (Go)`
     - `Frontend Tests (Vitest)`
4. **Save changes**

**重要**: ステータスチェック名は、CI設定ファイル（`.github/workflows/ci.yml`）の各ジョブの`name`フィールドと完全に一致する必要があります。

**スクリーンショット参考**:
```
□ Require a pull request before merging
☑ Require status checks to pass before merging
  ☑ Require branches to be up to date before merging
  Status checks that are required:
    • Backend Tests (Go)
    • Frontend Tests (Vitest)
```

**Branch Protectionの動作**:
- ✅ **テスト成功時**: すべてのステータスチェックが緑になり、"Merge pull request"ボタンが有効になります
- ❌ **テスト失敗時**: 失敗したステータスチェックが赤になり、マージがブロックされます（`mergeStateStatus: BLOCKED`）
- ⏳ **テスト実行中**: ステータスチェックが黄色（実行中）の間は、マージがブロックされます

この設定により、品質ゲートが強制され、すべてのテストが成功しない限りコードがメインブランチにマージされることはありません（FR-006, SC-003）。

---

### ステップ3: 動作確認

#### 3.1. テストプルリクエストの作成

```bash
# 新しいブランチを作成
git checkout -b test-ci-integration

# ダミーの変更を追加（例: READMEに改行を追加）
echo "" >> README.md
git add README.md
git commit -m "test: CI integration verification"

# GitHubにプッシュ
git push -u origin test-ci-integration
```

#### 3.2. GitHubでプルリクエストを作成

1. GitHubリポジトリページで **Pull requests** → **New pull request**
2. `test-ci-integration` → `main`（または保護対象ブランチ）
3. プルリクエストを作成

#### 3.3. CI実行を確認

プルリクエストページで以下を確認：

- ✅ **両方のジョブが並列実行される**
  - `backend-test`: Go テスト実行
  - `frontend-test`: Vitestテスト実行

- ✅ **テスト成功時**:
  - 各ジョブに緑のチェックマーク
  - "Merge pull request" ボタンが有効

- ✅ **テスト失敗時**（わざとテストを失敗させた場合）:
  - 該当ジョブに赤いXマーク
  - "Merge pull request" ボタンがブロック
  - エラーメッセージとログが表示

---

### ステップ4: テスト失敗シミュレーション（オプション）

Frontendテストの失敗がどのように表示されるかを確認するため、意図的にテストを失敗させてみます。

#### 4.1. Frontendテストファイルを編集

```bash
# 既存のテストファイルを編集（例: frontend/tests/components/FeedList.test.tsx）
# または新規テストファイルを作成
cat > frontend/tests/fail-test.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';

describe('CI Failure Test', () => {
  it('should fail intentionally', () => {
    expect(1 + 1).toBe(3); // わざと失敗させる
  });
});
EOF

git add frontend/tests/fail-test.test.ts
git commit -m "test: add intentional failing test"
git push
```

#### 4.2. CI実行結果を確認

プルリクエストページで以下を確認：

1. **`frontend-test`ジョブが失敗**
2. **"Merge pull request" ボタンがブロック**
3. **詳細ログを表示**:
   - ジョブ名をクリック → "Run frontend tests" ステップを展開
   - 失敗したテストケース名、期待値・実際値、スタックトレースが表示される

```
FAIL  tests/fail-test.test.ts > CI Failure Test > should fail intentionally
AssertionError: expected 2 to deeply equal 3
 ❯ tests/fail-test.test.ts:5:21
      3|   it('should fail intentionally', () => {
      4|     expect(1 + 1).toBe(3);
      5|   });
```

#### 4.3. テストを修正してマージ可能にする

```bash
# 失敗するテストを削除
git rm frontend/tests/fail-test.test.ts
git commit -m "test: remove failing test"
git push

# CIが自動的に再実行され、成功すればマージ可能になる
```

---

## トラブルシューティング

### 問題1: Frontendテストが "npm: not found" で失敗する

**原因**: Node.jsのセットアップステップが正しく設定されていない

**解決策**:
- `.github/workflows/ci.yml`の`frontend-test`ジョブに`actions/setup-node@v4`ステップがあることを確認
- `node-version`が正しく指定されていることを確認（例: `'20'`）

---

### 問題2: 依存関係のインストールに時間がかかる（2分以上）

**原因**: npm キャッシュが有効化されていない

**解決策**:
- `actions/setup-node@v4`に`cache: 'npm'`と`cache-dependency-path: frontend/package-lock.json`が設定されていることを確認
- 2回目以降の実行では、キャッシュが効いて~10秒に短縮されるはず

---

### 問題3: テストがローカルでは成功するがCIで失敗する

**原因**: 環境依存の問題（タイムゾーン、ファイルパス、環境変数など）

**解決策**:
1. GitHub Actionsのログで詳細なエラーメッセージを確認
2. ローカルで`npm test`を実行し、環境変数を確認（`process.env`）
3. Vitestの設定（`vitest.config.ts`）で環境をCI用に調整
   ```typescript
   export default defineConfig({
     test: {
       environment: 'happy-dom', // or 'jsdom'
       globals: true,
     },
   });
   ```

---

### 問題4: Branch Protection Rulesで "Frontend Tests (Vitest)" が選択肢に表示されない

**原因**: CI ワークフローがまだ一度も実行されていない、またはJob名が間違っている

**解決策**:
1. プルリクエストまたはブランチへのpushでCIを一度実行
2. CI実行後、GitHub Settings → Branches → Branch protection rulesに戻る
3. ステータスチェック検索ボックスで`Backend Tests (Go)`と`Frontend Tests (Vitest)`が表示されるはず
4. もし表示されない場合、`.github/workflows/ci.yml`の各ジョブの`name`フィールドを確認し、完全に一致するステータスチェック名を使用する

---

## 成功基準の確認

以下の項目をすべて満たしていれば、セットアップ成功です：

- ✅ プルリクエスト作成時に`frontend-test`ジョブが自動実行される（FR-001, SC-001）
- ✅ テスト結果がプルリクエストに表示される（FR-002）
- ✅ テスト失敗時、失敗したテストケース名・エラーメッセージ・スタックトレースが表示される（FR-003, SC-004）
- ✅ テストが5分以内に完了する（SC-002）
- ✅ テストが失敗したプルリクエストはマージがブロックされる（FR-006, SC-003）
- ✅ BackendテストとFrontendテストが並列実行される（パフォーマンス最適化）

---

## 次のステップ

1. ✅ 基本的なCI統合が完了
2. 💡 **将来の拡張案**:
   - カバレッジレポートの生成とPRへのコメント投稿
   - E2Eテスト（Playwright/Cypress）のCI統合
   - パフォーマンステスト（Lighthouse CI）の追加

3. ⏭️ `/speckit.tasks`コマンドで実装タスクリストを生成