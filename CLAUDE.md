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
- 008-feed-url-display: Added TypeScript 5.9.3, React 19.1.1 + Vite 7.1.7, TailwindCSS 4.x, date-fns 4.x
- 001-frontend-ci-tests: Added TypeScript 5.9.3 (Frontend), GitHub Actions YAML (CI設定) + React 19.1.1, Vite 7.1.7, Vitest 4.0.3, @testing-library/react 16.3.0
- 007-real-http-fetch: Added Go 1.25.1


<!-- MANUAL ADDITIONS START -->

## 言語設定

**必ず日本語で応答してください。**

- 全ての説明、コメント、ドキュメントは日本語で記述
- コード内のコメントも日本語で記述
- 技術用語は英語のままでも可（例：React, TypeScript, API）
- エラーメッセージの説明は日本語で

<!-- MANUAL ADDITIONS END -->
