# feed-parallel-parse-api Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-27

## Active Technologies
- React 18.x + TypeScript 5.x + Vite 5.x（ビルドツール）, react-window 1.8.x（仮想スクロール）, date-fns 3.x（日付処理）, TailwindCSS 3.x（スタイリング） (001-rss-reader)
- ブラウザのlocalStorage（フィード購読の永続化） (001-rss-reader)
- Go 1.25.1 (007-real-http-fetch)
- N/A（この機能はストレージを使用しない） (007-real-http-fetch)
- TypeScript 5.9.3 (Frontend), GitHub Actions YAML (CI設定) + React 19.1.1, Vite 7.1.7, Vitest 4.0.3, @testing-library/react 16.3.0 (001-frontend-ci-tests)
- TypeScript 5.9.3, React 19.1.1 + Vite 7.1.7, TailwindCSS 4.x, date-fns 4.x (008-feed-url-display)
- localStorage（ブラウザのクライアントサイドストレージ） (008-feed-url-display)
- TypeScript 5.9.3 + React 19.1.1 + Vite 7.1.7（ビルド）, date-fns 4.x（日付処理）, TailwindCSS 4.x（スタイリング） (009-fix-excessive-requests)
- TypeScript 5.9.3 + React 19.1.1, Vite 7.1.7 (010-fix-useeffect-deps)
- TypeScript 5.9.3, React 19.1.1 + Vite 7.1.7（ビルドツール）, vite-plugin-pwa（PWAプラグイン）, Workbox（Service Workerライブラリ） (011-pwa)
- localStorage（既存のフィード購読データ）, Cache Storage API（Service Workerによるキャッシュ管理） (011-pwa)
- TypeScript 5.9.3 + React 19.1.1, TailwindCSS 4.x, localStorage (ブラウザAPI) (010-improve-feed-article-access)
- localStorage（折りたたみ状態の永続化） (010-improve-feed-article-access)

- Go 1.2x + github.com/mmcdole/gofeed, 標準ライブラリ encoding/xml (006-rss-format-support)

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
- 010-improve-feed-article-access: Added TypeScript 5.9.3 + React 19.1.1, TailwindCSS 4.x, localStorage (ブラウザAPI)
- 011-pwa: Added TypeScript 5.9.3, React 19.1.1 + Vite 7.1.7（ビルドツール）, vite-plugin-pwa（PWAプラグイン）, Workbox（Service Workerライブラリ）
- 010-fix-useeffect-deps: Added TypeScript 5.9.3 + React 19.1.1, Vite 7.1.7


<!-- MANUAL ADDITIONS START -->

## 言語設定

**必ず日本語で応答してください。**

- 全ての説明、コメント、ドキュメントは日本語で記述
- コード内のコメントも日本語で記述
- 技術用語は英語のままでも可（例：React, TypeScript, API）
- エラーメッセージの説明は日本語で

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

### PR作成前チェックリスト

**重要**: これらは必須確認項目です。全てチェックしてください。

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
