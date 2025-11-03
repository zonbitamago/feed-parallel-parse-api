# feed-parallel-parse-api Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-27

## Active Technologies
- TypeScript 5.9.3, React 19.1.1 + React 19.1.1, date-fns 4.1.0, react-window 2.2.2, TailwindCSS 4.1.16 (016-feed-auto-polling)
- localStorage（ポーリング設定、最終ポーリング時刻） (016-feed-auto-polling)
- TypeScript 5.9.3 + React 19.1.1, TailwindCSS 4.1.16 (001-enable-import-zero-feeds)
- localStorage（フィード購読データ） (001-enable-import-zero-feeds)

技術スタックの詳細は [SPECIFICATION.md](SPECIFICATION.md) のセクション2を参照してください。

### 主要技術
- **フロントエンド**: React 19.1.1, TypeScript 5.9.3, Vite 7.1.7, TailwindCSS 4.1.16
- **バックエンド**: Go 1.25.1, github.com/mmcdole/gofeed
- **PWA**: vite-plugin-pwa 1.1.0, workbox-window
- **テスト**: Vitest 4.0.3, @testing-library/react 16.3.0
- **ストレージ**: localStorage, Cache Storage API
- **開発環境**: Docker Compose

## Project Structure

```text
src/
tests/
```

## Commands

# Add commands for Go 1.2x

## Code Style

Go 1.2x: Follow standard conventions

## Recent Changes
- 001-enable-import-zero-feeds: Added TypeScript 5.9.3 + React 19.1.1, TailwindCSS 4.1.16
- 016-feed-auto-polling: Added TypeScript 5.9.3, React 19.1.1 + React 19.1.1, date-fns 4.1.0, react-window 2.2.2, TailwindCSS 4.1.16
- 2025-11-03: ドキュメントを最新の実装状態に同期（SPECIFICATION.md v1.5）


<!-- MANUAL ADDITIONS START -->

## 言語設定

**必ず日本語で応答してください。**

- 全ての説明、コメント、ドキュメントは日本語で記述
- コード内のコメントも日本語で記述
- 技術用語は英語のままでも可（例：React, TypeScript, API）
- エラーメッセージの説明は日本語で

## テストコード品質ルール

**すべてのテストコードは3A（Arrange-Act-Assert）パターンに従ってください。**

### 3Aパターン（必須）

テストコードは以下の3つのセクションに明確に分けて記述します：

```typescript
it('テストケースの説明', () => {
  // Arrange: 準備
  // テストに必要なデータやモックをセットアップ
  const input = createTestData()
  const expected = expectedResult()

  // Act: 実行
  // テスト対象の関数やメソッドを実行
  const result = functionUnderTest(input)

  // Assert: 検証
  // 期待する結果と実際の結果を検証
  expect(result).toBe(expected)
})
```

### 3Aパターンの利点

- **可読性**: テストの意図が一目で分かる
- **保守性**: 変更箇所が明確になる
- **デバッグ性**: 失敗時にどのセクションで問題が起きたか分かりやすい

### 必須事項

- ✅ すべてのテストケースに `// Arrange: 準備`、`// Act: 実行`、`// Assert: 検証` のコメントを追加
- ✅ 各セクションの間に空行を1行入れる
- ✅ 複雑なテストでは各セクション内にさらに詳細なコメントを追加

### 悪い例 ❌

```typescript
it('should merge articles', () => {
  const current = [article1, article2]
  const newArticles = [article3]
  const result = mergeArticles(current, newArticles)
  expect(result).toHaveLength(3)
})
```

### 良い例 ✅

```typescript
it('should merge articles and sort by date descending', () => {
  // Arrange: 準備
  const current = [article1, article2]
  const newArticles = [article3]

  // Act: 実行
  const result = mergeArticles(current, newArticles)

  // Assert: 検証
  expect(result).toHaveLength(3)
  expect(result[0].id).toBe('article3')
})
```

## テスト実行ルール（CPU負荷対策）

**実装時のテスト実行では必ずwatchモードを無効化してください。**

### watchモード禁止

このプロジェクトのpackage.jsonは既にCPU負荷対策済みです：

```json
"scripts": {
  "test": "vitest run",        // デフォルトで1回限りの実行
  "test:watch": "vitest"       // watchモードは明示的に分離
}
```

- ✅ **推奨**: `npm test` (1回限りの実行、CPU負荷低)
- ⚠️ **注意**: `npm run test:watch` (watchモード、CPU負荷高)
- **理由**: watchモードはファイル監視によりCPU負荷が高くなり、開発マシンのパフォーマンスを低下させる

### その他のCPU負荷対策

- **並列実行の制御**: 大規模なテストスイートでは`--maxWorkers`オプションで並列数を制限
  - 例: `npm test -- --maxWorkers=2`
- **選択的テスト実行**: 開発中は変更したファイルのテストのみを実行
  - 例: `npm test FeedManager.test.tsx`
  - 全テストはコミット前またはCI/CDで実行

### テストプロセスのクリーンアップ（必須）

**各フェーズの完了時に、必ずテストプロセスが残っていないか確認してください。**

#### 確認タイミング
- ✅ **必須**: 各フェーズ（T001-T010、T011-T020など）の完了時
- ✅ **必須**: コミット前
- ✅ **推奨**: 大規模なテスト実行後

#### 確認コマンド
```bash
ps aux | grep -E "vitest" | grep -v grep
```

**期待される結果**: VSCode拡張のworkerのみ（1プロセス）

#### プロセスが残っている場合
```bash
# workerプロセスのPIDを確認
ps aux | grep -E "vitest/dist/workers" | grep -v grep

# プロセスをkill
pkill -f "vitest/dist/workers"

# または個別にkill
kill <PID1> <PID2> ...
```

#### 理由
- vitestのworkerプロセスが残るとCPU負荷が継続
- 開発マシンのパフォーマンス低下を防止
- メモリリークの防止

## ドキュメント維持ルール（重要）

**PR作成時は必ず以下のドキュメント更新を検討してください。**

### 1. SPECIFICATION.md（必須）

**必ず更新が必要です。**

#### 必須更新タイミング
- 新機能追加時
- 既存機能の変更時
- API仕様の変更時
- データモデルの変更時
- エラーハンドリングの追加・変更時
- パフォーマンス最適化時

#### 更新方法
1. 該当するセクションを特定（機能別に整理されています）
2. 変更内容を反映（spec番号ではなく、現在の機能として記述）
3. 最終更新日を更新
4. PR作成時にチェックリストで確認

#### SPECIFICATION.mdの構成
- セクション1-2: システム概要と技術スタック
- セクション3: フィード購読管理機能
- セクション4: 記事表示機能
- セクション5: 検索・フィルタリング機能
- セクション6: データ永続化
- セクション7: エラーハンドリング
- セクション8: API仕様
- セクション9: UI/UX設計
- セクション10: テスト・品質保証
- セクション11-12: 制約・セキュリティ
- セクション13: 今後の拡張案
- 付録: データフロー図、状態管理

#### 注意事項
- spec番号（001, 002など）ではなく、機能別に記述する
- 実装履歴ではなく、現在の動作を記述する
- 技術的な詳細（データ構造、API仕様など）を含める
- ユーザー視点とシステム視点の両方を含める

### 2. README.md（条件付き）

**以下のチェックリストで更新の必要性を判断してください。**

#### README更新が必要なケース ✅
- 新機能の追加（ユーザーが使える機能）
- 使い方の変更（コマンド、セットアップ手順）
- 技術スタックの変更（主要ライブラリのバージョンアップ）
- APIの変更（エンドポイント、リクエスト/レスポンス形式）
- 環境要件の変更（Node.js、Goバージョン、環境変数）
- デプロイ手順の変更（Vercel設定、ビルドコマンド）

#### README更新が不要なケース ❌
- 内部実装の最適化（パフォーマンス改善、リファクタリング）
- バグ修正（ユーザー向け機能に影響なし）
- テストの追加・修正
- SPECIFICATION.mdのみの更新
- コメントの改善
- CI/CD設定の微調整（動作に変更なし）

#### 判断フロー
```
PR作成前
    ↓
【質問1】ユーザーの使い方に影響するか？
    ├─ YES → README更新が必要
    └─ NO  → 【質問2】へ
         ↓
【質問2】セットアップ手順やコマンドが変わるか？
    ├─ YES → README更新が必要
    └─ NO  → 【質問3】へ
         ↓
【質問3】技術スタックやバージョンが変わるか？
    ├─ YES → README更新が必要
    └─ NO  → README更新は不要
```

### 3. コードレビュー（必須）

**自動実装完了後、PR作成前に必ず自己レビューを実施してください。**

#### コードレビュー実施タイミング

以下のタイミングで自己レビューを実施します：

- ✅ **必須**: 自動実装が完了したタイミング（手動テスト前）
- ✅ **必須**: PR作成前（最終確認）
- ⚠️ **推奨**: 大きな実装の節目（Phase完了時など）

#### レビュー観点

以下の6つの観点で包括的にレビューします：

1. **アーキテクチャと設計**
   - レイヤー分離（UI / Presentation Logic / Business Logic / Validation）
   - 責務の明確さ（単一責任原則）
   - 再利用性とモジュール性
   - 型安全性（`any`の不使用、厳格な型定義）

2. **コード品質**
   - 命名規則の一貫性（変数、関数、型）
   - エッジケースの処理（空配列、null、undefined）
   - エラーハンドリングの適切さ
   - コメントの質（なぜ、を説明）
   - マジックナンバーの排除（定数化）

3. **セキュリティ**
   - XSS対策（ユーザー入力のサニタイズ）
   - ファイルアップロード検証（サイズ、拡張子、MIME type）
   - メモリリーク防止（イベントリスナー解放、URL revocation）
   - 入力バリデーションの多層化

4. **テスト**
   - TDDサイクル遵守（Red-Green-Refactor）
   - AAA（Arrange-Act-Assert）パターン
   - テストカバレッジ（境界値、エラーケース）
   - テスト名の明確さ（日本語推奨）

5. **UI/UX**
   - アクセシビリティ（ARIA属性、キーボード操作）
   - ローディング状態の表示
   - エラーメッセージの具体性
   - レスポンシブデザイン

6. **ドキュメント**
   - SPECIFICATION.md更新（必須）
   - README.md更新（条件付き）
   - コード内コメント（複雑なロジック）
   - JSDoc（公開API、型定義）

#### レビュー実施方法

以下のプロンプトで自己レビューを実行します：

```
以下の観点で包括的なコードレビューを実施してください：

1. アーキテクチャと設計
2. コード品質
3. セキュリティ
4. テスト
5. UI/UX
6. ドキュメント

今回の実装で追加・変更されたファイル：
[ファイルリストを列挙]

各観点で問題があれば、以下の形式で報告してください：
- 問題の重要度（High/Medium/Low）
- 具体的な問題点
- 修正案
- 該当ファイルと行数

問題がない場合は「問題なし」と記載してください。
```

#### レビュー結果の処理

レビューで発見された問題の処理方針：

- **High**: 即座に修正（PR作成前に必須）
- **Medium**: 即座に修正（PR作成前に推奨）
- **Low**: 判断に応じて修正 or issueとして記録

#### レビューチェックリスト

- [ ] **6つの観点すべてでレビューを実施した**
- [ ] **High/Medium問題はすべて修正した**
- [ ] **Low問題の対応方針を決定した**
- [ ] **修正後に関連テストを再実行した**

### PR作成前チェックリスト

**重要**: これらは必須確認項目です。全てチェックしてください。

- [ ] **コードレビューを実施した**（必須）
  - 6つの観点すべてでレビュー実施
  - High/Medium問題はすべて修正済み
  - Low問題の対応方針を決定済み
- [ ] **SPECIFICATION.mdを更新した**（必須）
- [ ] **README.md更新の必要性を判断フローで確認した**（必須）
- [ ] **必要に応じてREADME.mdを更新した**
  - 新機能追加時は**ほぼ確実に必要**
  - 技術スタック変更時は**必須**
  - テストカバレッジ変更時も数値を更新
- [ ] **最終更新日を更新した**
- [ ] **README更新時は別コミットで作成した**（推奨）

#### README更新の重要性

README.mdはプロジェクトの顔です。以下の理由で常に最新に保つ必要があります：

1. **新規ユーザーの第一印象**: 機能一覧が古いと誤解を招く
2. **技術スタックの正確性**: 依存関係が不明確だと環境構築でエラーが発生
3. **テスト統計の信頼性**: カバレッジが古いと品質が不明瞭
4. **CI/CDとの整合性**: GitHub Actionsの設定と一致させる

**実装例**（今回のPWA機能追加）:
- ✅ 特徴セクションにPWA機能を追加（4項目）
- ✅ 技術スタックにvite-plugin-pwa、workbox-window追加
- ✅ テストカバレッジを153→188に更新
- ✅ 別コミット `docs(readme):` で作成

<!-- MANUAL ADDITIONS END -->
