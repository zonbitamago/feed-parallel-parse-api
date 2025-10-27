# Research: FrontendテストのCI統合

**Feature**: 001-frontend-ci-tests
**Date**: 2025-10-28
**Status**: Complete

## Overview

この調査では、GitHub ActionsでReact + Vite + VitestのFrontendテストスイートをCI環境で実行するためのベストプラクティスと実装パターンを調査しました。

## Research Areas

### 1. GitHub ActionsでのNode.js + Vitestテスト実行パターン

**Decision**: actions/setup-node@v4を使用し、依存関係キャッシュを有効化

**Rationale**:
- GitHub公式のsetup-nodeアクションは、Node.jsのバージョン管理とnpm/yarn/pnpmキャッシュを統合的にサポート
- キャッシュの有効化により、依存関係インストール時間を大幅に短縮（初回: ~2分 → 2回目以降: ~10秒）
- package-lock.jsonをキャッシュキーにすることで、依存関係変更時のみキャッシュを更新

**Alternatives considered**:
- **手動キャッシュ設定（actions/cache）**: setup-nodeの統合キャッシュ機能の方がシンプルで保守性が高い
- **Docker コンテナでのテスト実行**: オーバーヘッドが大きく、5分以内の実行制約を満たせない可能性

**Implementation**:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'  # LTS version
    cache: 'npm'
    cache-dependency-path: frontend/package-lock.json
```

---

### 2. Vitestのカバレッジレポート生成とCI統合

**Decision**: Phase 1（P1: 自動テスト実行）ではカバレッジレポートは生成せず、将来の拡張として残す

**Rationale**:
- 仕様のFR-001〜FR-008にカバレッジレポートの要件が含まれていない
- SC-002（5分以内の実行）を満たすため、最小限の実装に留める
- カバレッジレポート生成は追加で~10-20秒のオーバーヘッド

**Alternatives considered**:
- **初期実装でカバレッジ生成**: Vitestの@vitest/coverage-v8は既にdevDependenciesに含まれているが、仕様要件外のため不要
- **GitHub PRへのコメント**: 便利だが、仕様のP3（履歴追跡）にも含まれない

**Future Enhancement**:
カバレッジが必要になった場合は、以下を追加：
```yaml
- name: Generate coverage
  run: npm run test -- --coverage
  working-directory: frontend
```

---

### 3. Frontendテスト失敗時のマージブロック設定

**Decision**: GitHub Branch Protection Rulesでステータスチェックを必須化

**Rationale**:
- GitHub標準機能で、追加のツールやサービス不要
- CIジョブが失敗すると自動的にマージボタンがブロックされる
- リポジトリ設定で簡単に有効化可能（Settings → Branches → Branch protection rules）

**Alternatives considered**:
- **GitHub Actionsのworkflow_runトリガー**: 複雑で保守性が低い
- **外部サービス（codecov, coveralls）**: 仕様要件外で、無料枠の制約あり

**Implementation**:
1. `.github/workflows/ci.yml`にFrontendテストジョブを追加（ジョブ名: `frontend-test`）
2. GitHub リポジトリ設定で`frontend-test`を必須ステータスチェックに追加

---

### 4. 並列実行とCI実行時間の最適化

**Decision**: Backendテスト（Go）とFrontendテスト（Vitest）を並列ジョブとして実行

**Rationale**:
- GitHub Actionsのジョブは独立したランナーで並列実行される
- Backendテスト（~1分）とFrontendテスト（~2分）を並列化することで、合計CI実行時間を短縮
- SC-002（5分以内）の制約を余裕を持って満たせる

**Alternatives considered**:
- **単一ジョブで順次実行**: 実行時間が3分以上になり、将来のテスト追加でSC-002を超える可能性
- **マトリックス戦略（複数Node.jsバージョン）**: 仕様要件外で、実行時間が増加

**Implementation**:
```yaml
jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      # Go テスト実行

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      # Frontendテスト実行
```

---

### 5. タイムアウト設定とリソース制限

**Decision**: Frontendテストジョブにtimeout-minutes: 10を設定

**Rationale**:
- FR-007（タイムアウト設定）の要件を満たす
- SC-002（5分以内）より余裕を持った設定で、環境のゆらぎに対応
- GitHub Actionsのデフォルト（360分）では、ハングアップ時にリソースを浪費

**Alternatives considered**:
- **5分タイムアウト**: 環境のゆらぎ（ネットワーク遅延、npm registry遅延）で誤検知の可能性
- **15分以上**: 不要に長く、フィードバックが遅れる

**Implementation**:
```yaml
frontend-test:
  runs-on: ubuntu-latest
  timeout-minutes: 10
  steps:
    # ...
```

---

### 6. エラーメッセージとログの可視性

**Decision**: Vitestのデフォルトレポーター（`default`）を使用し、GitHub ActionsのログにFrontendテスト結果を出力

**Rationale**:
- Vitestの`default`レポーターは、ターミナル向けに最適化され、失敗したテストケース名、エラーメッセージ、スタックトレースを表示
- GitHub ActionsのログUIで、失敗したステップを簡単に特定可能
- FR-003（失敗テストケースの詳細）、FR-008（適切なエラーメッセージ）の要件を満たす

**Alternatives considered**:
- **JUnit XMLレポーター**: GitHub ActionsがXMLをパースしてPRにアノテーションを追加できるが、設定が複雑
- **HTMLレポーター**: CI環境では閲覧に追加ステップが必要

**Implementation**:
```yaml
- name: Run frontend tests
  run: npm test
  working-directory: frontend
```

package.jsonの`test`スクリプト（`vitest run`）がそのまま使用可能。

---

## Technology Stack Summary

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| CI Platform | GitHub Actions | N/A | リポジトリに統合済み、無料枠で十分 |
| Node.js | Node.js LTS | 20.x | 安定版、Vite/Vitestと互換性 |
| Test Framework | Vitest | 4.0.3 | 既存のFrontendテストで使用中 |
| CI Runner | ubuntu-latest | N/A | GitHub Actions標準、安定性高い |

---

## Open Questions

なし - すべての技術選択が決定し、既存のツールスタックで実装可能。

---

## Next Steps

1. ✅ Phase 0完了: すべての技術選択が決定
2. ⏭️ Phase 1: quickstart.mdの作成（開発者向けCI設定ガイド）
3. ⏭️ Phase 2: tasks.mdの生成（`/speckit.tasks`コマンド）