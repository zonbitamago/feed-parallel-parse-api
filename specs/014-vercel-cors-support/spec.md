# Feature Specification: Vercel CORS設定追加

**Feature Branch**: `014-vercel-cors-support`
**Created**: 2025-11-02
**Status**: Draft
**Input**: User description: "Vercelサーバーレス関数（api/parse.go）にCORS設定を追加する。現在、プレビュー環境でCross-Originリクエストが失敗しているため、Access-Control-Allow-Originヘッダーをワイルドカード（*）で設定し、すべてのオリジンからのリクエストを許可する。OPTIONSメソッドのプリフライトリクエストにも対応する。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - プレビュー環境でのAPI動作確認 (Priority: P1)

開発者がGitHubでPRを作成した際、Vercelが自動生成するプレビューURL（例: `https://feed-parallel-parse-api-git-XXX-*.vercel.app`）からAPIエンドポイント（`https://feed-parallel-parse-api.vercel.app/api/parse`）を呼び出して、フィード解析機能が正常に動作することを確認できる。

**Why this priority**: プレビュー環境での動作確認は開発フローの中核であり、これができないとPRレビュー時に機能検証ができない。最優先で解決すべき問題。

**Independent Test**: プレビュー環境のフロントエンドからフィードURLを入力し、APIリクエストがCORSエラーなく成功することで検証可能。

**Acceptance Scenarios**:

1. **Given** 開発者がPRを作成しVercelプレビュー環境が生成された状態で、**When** プレビューURLからフィード解析APIを呼び出す、**Then** CORSエラーが発生せず、正常にフィードデータが取得できる
2. **Given** プレビュー環境のフロントエンドで、**When** ユーザーがフィードURLを入力して送信する、**Then** プリフライトリクエスト（OPTIONS）が成功し、続くPOSTリクエストも成功する

---

### User Story 2 - 本番環境の互換性維持 (Priority: P2)

既存の本番環境（Same-Origin構成）において、CORS設定追加後も従来通り正常に動作し、パフォーマンスやセキュリティに悪影響を与えない。

**Why this priority**: 本番環境の安定性は重要だが、Same-Origin構成のため影響リスクは低い。P1の次に確認すべき項目。

**Independent Test**: 本番環境で既存のフィード解析機能をテストし、動作に変化がないことを確認。

**Acceptance Scenarios**:

1. **Given** 本番環境（`https://feed-parallel-parse-api.vercel.app`）で、**When** フロントエンドからAPIを呼び出す、**Then** 従来通り正常にフィードデータが取得できる
2. **Given** CORS設定追加後の本番環境で、**When** レスポンスヘッダーを確認する、**Then** Access-Control-Allow-Originヘッダーが含まれているが、Same-Originのため無視され動作に影響しない

---

### User Story 3 - ローカル開発環境の互換性維持 (Priority: P3)

Docker環境でのローカル開発において、既存のCORS設定（`cmd/server/main.go`）と新しいVercel用CORS設定が共存し、両方の環境で正常に動作する。

**Why this priority**: ローカル環境は既にCORS設定済みのため、新規追加の影響はほぼない。確認項目として残す。

**Independent Test**: `docker-compose up`でローカル環境を起動し、フロントエンドからAPIを呼び出して動作確認。

**Acceptance Scenarios**:

1. **Given** Dockerローカル環境が起動している状態で、**When** フロントエンドからAPIを呼び出す、**Then** 既存のCORS設定により正常にリクエストが成功する
2. **Given** ローカル環境とVercel環境で、**When** それぞれのCORS実装を比較する、**Then** 両者が同じヘッダー設定（`Access-Control-Allow-Origin: *`）を使用している

---

### Edge Cases

- プリフライトリクエスト（OPTIONS）が正しく処理されない場合、ブラウザが後続のPOSTリクエストを送信しない
- CORSヘッダーが設定されていても、Vercelのデプロイ設定やキャッシュにより反映されない場合がある
- 将来的にオリジンを制限したい場合、ワイルドカード（`*`）から特定ドメインへの変更が必要になる可能性

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Vercelサーバーレス関数（`api/parse.go`）は、すべてのHTTPレスポンスに`Access-Control-Allow-Origin: *`ヘッダーを含めなければならない
- **FR-002**: Vercelサーバーレス関数は、OPTIONSメソッドのプリフライトリクエストを受け付け、適切なCORSヘッダー（`Access-Control-Allow-Methods`、`Access-Control-Allow-Headers`）を返して200 OKで応答しなければならない
- **FR-003**: CORSヘッダー追加後も、既存のPOSTリクエスト処理ロジックに影響を与えず、正常にフィード解析結果を返さなければならない
- **FR-004**: ローカル開発環境（`cmd/server/main.go`）のCORS設定と、Vercel環境（`api/parse.go`）のCORS設定が同じポリシー（`*`許可）を使用しなければならない
- **FR-005**: プレビュー環境、本番環境、ローカル環境のすべてで同じCORS動作を保証しなければならない

### Key Entities

- **HTTPリクエスト**: ブラウザからAPIエンドポイントへのリクエスト。OPTIONSメソッド（プリフライト）とPOSTメソッド（実際のデータ送信）の2種類
- **HTTPレスポンスヘッダー**: CORSポリシーを制御する`Access-Control-*`ヘッダー群。ブラウザがCross-Originリクエストを許可するかどうかを判断する
- **Vercelデプロイ環境**: 本番環境とプレビュー環境の2つ。プレビュー環境は動的に生成されるサブドメインを使用

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: プレビュー環境からAPIリクエストを送信した際、CORSエラーが発生せず100%成功する
- **SC-002**: プリフライトリクエスト（OPTIONS）が1秒以内に200 OKで応答する
- **SC-003**: 本番環境での既存機能に影響がなく、API応答時間が変化しない（±5%以内）
- **SC-004**: ローカル、プレビュー、本番の3環境すべてで同じCORS動作を実現する

## Assumptions

- RSSフィード解析APIは公開APIとして設計されており、すべてのオリジンからのアクセスを許可することにセキュリティ上の問題はない
- Vercelのサーバーレス関数は、HTTPレスポンスヘッダーを自由に設定できる
- ブラウザはCORSの標準仕様に従い、`Access-Control-Allow-Origin: *`を正しく処理する
- 将来的にオリジン制限が必要になった場合は、環境変数での制御に移行する可能性がある

## Constraints

- Vercelのサーバーレス関数は`vercel.json`でのCORS設定に対応していない可能性があるため、コード内でヘッダー設定を行う
- プレビュー環境のURLは動的に生成されるため、ホワイトリスト方式ではなくワイルドカード方式を採用する
- 既存のローカル環境CORS実装（`cmd/server/main.go`）と一貫性を保つため、同じヘッダー設定を使用する
