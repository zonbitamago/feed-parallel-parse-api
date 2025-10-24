# Feature Specification: Redoc HTML Doc

**Feature Branch**: `005-redoc-html-doc`  
**Created**: 2025-10-25  
**Status**: Draft  
**Input**: User description: "openapi から html を作成する際に openapi-generator を利用しているが、redoc-cli を利用するように変更したい"

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Redoc で API 定義書生成 (Priority: P1)

API 利用者・開発者として、OpenAPI 定義から HTML API 定義書を Redoc CLI で自動生成したい。

**Why this priority**: API 仕様変更時に常に最新の API 定義書を参照できることは、開発・運用の品質維持に直結するため。

**Independent Test**: OpenAPI ファイルを更新し、CI/CD で Redoc CLI により HTML が自動生成・格納されることを確認できる。

**Acceptance Scenarios**:

1. **Given** OpenAPI 定義ファイルが更新されたとき、**When** CI/CD が実行されると、**Then** Redoc CLI で HTML API 定義書が自動生成される
2. **Given** 生成された HTML API 定義書、**When** ブラウザで開くと、**Then** API 仕様が正しく可視化されている

---

### User Story 2 - 参照性の向上 (Priority: P2)

チームメンバーが常に最新の API 定義書を簡単に参照できるようにしたい。

**Why this priority**: ドキュメントの参照性が高いほど、認識齟齬や手戻りが減り、開発効率が向上するため。

**Independent Test**: 生成された HTML ファイルのパス・参照手順が README 等に明記されている。

**Acceptance Scenarios**:

1. **Given** API 定義書が自動生成されている、**When** チームメンバーが README の手順に従う、**Then** 最新の API 定義書をブラウザで閲覧できる

---

## Functional Requirements

- OpenAPI 定義ファイル（openapi.yaml）から Redoc CLI で HTML API 定義書を生成できること
- 生成された HTML ファイルがリポジトリ内の所定ディレクトリ（例: contracts/api-docs/）に格納されること
- CI/CD パイプラインで自動的に Redoc CLI による API 定義書生成が実行されること
- 参照手順が README 等に明記されていること

## Non-Functional Requirements

- 生成された API 定義書は主要ブラウザで正しく表示できること
- 生成・参照手順は自動化され、手作業を極力排除すること
- ドキュメント生成に失敗した場合は CI でエラー通知されること

## Success Criteria

- OpenAPI 定義ファイルを更新後、Redoc CLI で HTML API 定義書が自動生成・格納される
- チームメンバーが README 等の手順で最新 API 定義書を参照できる
- 主要ブラウザで API 定義書が正しく表示される
- CI/CD でエラー時は通知される

## Key Entities

- OpenAPI 定義ファイル（openapi.yaml）
- Redoc CLI
- HTML API 定義書
- contracts/api-docs ディレクトリ

## Assumptions

- Redoc CLI は npm 等でインストール可能であり、CI/CD 環境でも利用できる
- 既存の openapi-generator による HTML 生成は不要となる
- 参照手順は README に記載済み、または今後追加される
