# feed-parallel-parse-api Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-24

## Active Technologies
- Go 1.2x + github.com/mmcdole/gofeed, 標準ライブラリencoding/xml (006-rss-format-support)
- N/A（メモリ上でのパース、永続化要件なし） (006-rss-format-support)
- React 18.x + TypeScript 5.x + Vite 5.x（ビルドツール）, react-window 1.8.x（仮想スクロール）, date-fns 3.x（日付処理）, TailwindCSS 3.x（スタイリング） (001-rss-reader)
- ブラウザのlocalStorage（フィード購読の永続化） (001-rss-reader)
- Go 1.25.1 (007-real-http-fetch)
- N/A（この機能はストレージを使用しない） (007-real-http-fetch)
- TypeScript 5.9.3 (Frontend), GitHub Actions YAML (CI設定) + React 19.1.1, Vite 7.1.7, Vitest 4.0.3, @testing-library/react 16.3.0 (001-frontend-ci-tests)
- TypeScript 5.9.3, React 19.1.1 + Vite 7.1.7, TailwindCSS 4.x, date-fns 4.x (008-feed-url-display)
- localStorage（ブラウザのクライアントサイドストレージ） (008-feed-url-display)

- (001-parallel-rss-parse-api)

## Project Structure

```text
src/
tests/
```

## Commands

# Add commands for

## Code Style

: Follow standard conventions

## Review/コメント運用指針

- Copilot によるプルリクエストのレビューコメントは必ず日本語で記載すること
- 指摘・要約・提案も日本語で統一

## Recent Changes
- 008-feed-url-display: Added TypeScript 5.9.3, React 19.1.1 + Vite 7.1.7, TailwindCSS 4.x, date-fns 4.x
- 001-frontend-ci-tests: Added TypeScript 5.9.3 (Frontend), GitHub Actions YAML (CI設定) + React 19.1.1, Vite 7.1.7, Vitest 4.0.3, @testing-library/react 16.3.0
- 007-real-http-fetch: Added Go 1.25.1


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
