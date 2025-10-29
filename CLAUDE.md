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
- 009-fix-excessive-requests: Added TypeScript 5.9.3 + React 19.1.1 + Vite 7.1.7（ビルド）, date-fns 4.x（日付処理）, TailwindCSS 4.x（スタイリング）
- 008-feed-url-display: Added TypeScript 5.9.3, React 19.1.1 + Vite 7.1.7, TailwindCSS 4.x, date-fns 4.x
- 001-frontend-ci-tests: Added TypeScript 5.9.3 (Frontend), GitHub Actions YAML (CI設定) + React 19.1.1, Vite 7.1.7, Vitest 4.0.3, @testing-library/react 16.3.0


<!-- MANUAL ADDITIONS START -->

## 言語設定

**必ず日本語で応答してください。**

- 全ての説明、コメント、ドキュメントは日本語で記述
- コード内のコメントも日本語で記述
- 技術用語は英語のままでも可（例：React, TypeScript, API）
- エラーメッセージの説明は日本語で

## システム仕様書の維持（重要）

**PR作成時は必ずSPECIFICATION.mdを更新してください。**

### 必須更新タイミング
- 新機能追加時
- 既存機能の変更時
- API仕様の変更時
- データモデルの変更時
- エラーハンドリングの追加・変更時

### 更新方法
1. 該当するセクションを特定（機能別に整理されています）
2. 変更内容を反映（spec番号ではなく、現在の機能として記述）
3. 最終更新日を更新
4. PR作成時にチェックリストで確認

### SPECIFICATION.mdの構成
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

### 注意事項
- spec番号（001, 002など）ではなく、機能別に記述する
- 実装履歴ではなく、現在の動作を記述する
- 技術的な詳細（データ構造、API仕様など）を含める
- ユーザー視点とシステム視点の両方を含める

<!-- MANUAL ADDITIONS END -->
