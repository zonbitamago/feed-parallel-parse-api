# feed-parallel-parse-api Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-24

## Active Technologies
- Go 1.2x + github.com/mmcdole/gofeed, 標準ライブラリencoding/xml (006-rss-format-support)
- N/A（メモリ上でのパース、永続化要件なし） (006-rss-format-support)
- React 18.x + TypeScript 5.x + Vite 5.x（ビルドツール）, react-window 1.8.x（仮想スクロール）, date-fns 3.x（日付処理）, TailwindCSS 3.x（スタイリング） (001-rss-reader)
- ブラウザのlocalStorage（フィード購読の永続化） (001-rss-reader)

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
- 001-rss-reader: Added React 18.x + TypeScript 5.x + Vite 5.x（ビルドツール）, react-window 1.8.x（仮想スクロール）, date-fns 3.x（日付処理）, TailwindCSS 3.x（スタイリング）
- 006-rss-format-support: Added Go 1.2x + github.com/mmcdole/gofeed, 標準ライブラリencoding/xml
- 002-upgrade-go-version: Go version upgrade to 1.2x


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
