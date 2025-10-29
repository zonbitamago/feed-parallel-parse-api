# Implementation Plan: PWA化（Progressive Web App対応）

**Branch**: `011-pwa` | **Date**: 2025-10-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-pwa/spec.md`

## Summary

既存のReact + TypeScript + ViteベースのRSSリーダーをPWA化し、デスクトップアプリとしてインストール可能にする。Web App ManifestとService Workerを追加し、オフライン対応とネイティブアプリのような体験を提供する。

## Technical Context

**Language/Version**: TypeScript 5.9.3, React 19.1.1
**Primary Dependencies**: Vite 7.1.7（ビルドツール）, vite-plugin-pwa（PWAプラグイン）, Workbox（Service Workerライブラリ）
**Storage**: localStorage（既存のフィード購読データ）, Cache Storage API（Service Workerによるキャッシュ管理）
**Testing**: Vitest 4.0.3, @testing-library/react 16.3.0, MSW 2.11.6（Service Workerのモック）
**Target Platform**: モダンブラウザ（Chrome 90+, Edge 90+, Safari 15+, Firefox 90+）
**Project Type**: Web（フロントエンドのみ）
**Performance Goals**:
- 初回起動3秒以内
- 2回目以降の起動時間50%短縮
- オフライン状態での即座の起動（200ms以内）
**Constraints**:
- HTTPS必須（PWAの要件）
- Service Worker対応ブラウザのみサポート
- キャッシュストレージ容量（ブラウザ依存、通常50MB〜）
**Scale/Scope**:
- シングルページアプリケーション
- Web App Manifest 1ファイル
- Service Worker 1ファイル
- アプリアイコン 複数サイズ（192x192, 512x512）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 初期チェック（Phase 0前）

#### I. Test-Driven Development (t-wada Style) - 絶対遵守

- [x] **テストファースト計画**: PWA機能（manifest、Service Worker登録）に対するテストを先に作成する計画
- [x] **TDDサイクル**: Red→Green→Refactorサイクルでの実装を計画
- [x] **テスト可能な設計**: Service Workerの登録ロジックを分離し、テスト可能にする

#### II. テストカバレッジと品質基準

- [x] **カバレッジ目標**: 新規コードは100%を目指す
- [x] **テストピラミッド**:
  - 単体テスト: Service Worker登録ロジック、manifest設定の検証
  - 統合テスト: キャッシュ動作、オフライン時の挙動
  - E2Eテスト: インストールフロー（手動テスト）

#### III. TypeScript + React の品質基準

- [x] **型安全性**: Service Worker APIの型定義を使用
- [x] **strict mode**: 既存の設定を維持（`"strict": true`）
- [x] **any禁止**: Service Worker関連のコードでも`any`を使用しない

#### IV. シンプルさの原則（YAGNI）

- [x] **最小限の実装**: 基本的なPWA機能のみ（プッシュ通知、バックグラウンド同期は範囲外）
- [x] **既存機能の活用**: localStorageベースの既存データ管理を継続使用

#### V. 新規依存関係の追加

追加する主要な依存関係:

| 依存関係 | 理由 | バンドルサイズへの影響 | メンテナンス状況 |
|---------|------|-------------------|----------------|
| vite-plugin-pwa | Vite環境でのPWA設定を自動化 | 開発時のみ（0KB） | 活発（週次更新） |
| workbox-window | Service Workerのライフサイクル管理 | 約4KB（gzip） | Google公式、安定 |

**判定**: ✅ 承認 - PWA実装に必須のツールであり、バンドルサイズへの影響も最小限

### 違反事項

なし。すべての憲法原則に準拠しています。

## Project Structure

### Documentation (this feature)

```text
specs/011-pwa/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output（manifest.json スキーマ）
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
frontend/
├── public/
│   ├── manifest.json          # NEW: Web App Manifest
│   ├── icons/                 # NEW: アプリアイコン
│   │   ├── icon-192x192.png
│   │   ├── icon-512x512.png
│   │   └── apple-touch-icon.png
│   └── robots.txt             # 既存
├── src/
│   ├── components/            # 既存
│   ├── hooks/                 # 既存
│   ├── types/                 # 既存
│   ├── sw.ts                  # NEW: Service Worker本体
│   ├── registerSW.ts          # NEW: Service Worker登録ロジック
│   ├── useNetworkStatus.ts    # NEW: オンライン/オフライン状態管理フック
│   ├── App.tsx                # 変更: SW登録とオフライン通知
│   └── main.tsx               # 既存
├── tests/
│   ├── unit/
│   │   ├── registerSW.test.ts # NEW: SW登録のテスト
│   │   └── useNetworkStatus.test.ts # NEW: ネットワーク状態フックのテスト
│   └── integration/
│       └── pwa.test.ts        # NEW: PWA統合テスト
├── vite.config.ts             # 変更: vite-plugin-pwa追加
└── package.json               # 変更: vite-plugin-pwa, workbox-window追加
```

**Structure Decision**: 既存のWeb application構造（frontend/）を維持。PWA関連ファイルは以下に配置:
- マニフェストとアイコン: `frontend/public/`（静的アセット）
- Service Worker: `frontend/src/sw.ts`（Viteでビルド）
- 登録ロジック: `frontend/src/registerSW.ts`（アプリから呼び出し）

## Complexity Tracking

> 憲法違反なし。この表は不要。

## Phase 0: Research & Decisions

### 0.1 PWA実装アプローチの調査

**調査内容**:
- Vite環境でのPWA実装ベストプラクティス
- Service Workerのキャッシュ戦略（Cache First vs Network First）
- オフライン時のUX設計パターン

**調査結果は** `research.md` **に記載**

### 0.2 Service Workerのキャッシュ戦略

**調査内容**:
- アプリシェル（HTML、CSS、JS）のキャッシュ戦略
- APIレスポンス（フィードデータ）のキャッシュ戦略
- キャッシュの更新タイミングと無効化戦略

**調査結果は** `research.md` **に記載**

### 0.3 オフライン検出とユーザー通知

**調査内容**:
- `navigator.onLine` APIの信頼性と制約
- オフライン状態の検出方法（API失敗時のフォールバック）
- ユーザーへの通知UI設計

**調査結果は** `research.md` **に記載**

## Phase 1: Design Artifacts

### 1.1 Data Model

**生成内容**:
- Web App Manifest の構造（JSON スキーマ）
- Cache Storage のデータ構造（キャッシュキー、エントリ形式）
- Service Worker の状態遷移図

**出力**: `data-model.md`

### 1.2 API Contracts

**生成内容**:
- Web App Manifest JSONスキーマ（`contracts/manifest-schema.json`）
- Service Worker ライフサイクルAPI仕様
- オンライン/オフライン状態管理インターフェース

**出力**: `contracts/` ディレクトリ

### 1.3 Quickstart Guide

**生成内容**:
- 開発環境でのPWA動作確認手順
- ローカルHTTPS環境のセットアップ
- Service Workerのデバッグ方法
- インストールテスト手順

**出力**: `quickstart.md`

### 1.4 Agent Context Update

**実行**:
```bash
SPECIFY_FEATURE=011-pwa ./.specify/scripts/bash/update-agent-context.sh
```

**更新内容**:
- CLAUDE.mdに以下の技術を追加:
  - vite-plugin-pwa（PWAビルドプラグイン）
  - Workbox（Service Workerライブラリ）
  - Cache Storage API
  - Web App Manifest

## Phase 2: Task Generation

**このフェーズは `/speckit.tasks` コマンドで実行します。**

Phase 1完了後、`/speckit.tasks` を実行してタスクを生成してください。

## Notes

### PWA実装の重要ポイント

1. **HTTPS必須**: 開発環境でもHTTPSが必要（vite-plugin-pwaがdev server用証明書を提供）
2. **Service Worker スコープ**: ルートからの配信が必要（`/sw.js`）
3. **キャッシュ戦略の選択**: アプリシェルは Cache First、APIは Network First with fallback
4. **更新通知**: Service Workerの更新を検出し、ユーザーに再読み込みを促す

### テスト戦略

1. **Service Worker登録**: MSW（Mock Service Worker）を使用してテスト
2. **オフライン動作**: ネットワークエラーをモックしてテスト
3. **キャッシュ動作**: Cache Storage APIをモックしてテスト
4. **インストール**: 手動テスト（自動化は困難）

### 既存機能への影響

- **最小限の変更**: 既存のコンポーネントには影響なし
- **localStorage**: 引き続き使用（PWAと共存）
- **API呼び出し**: Service Workerが透過的にインターセプト
