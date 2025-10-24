# Feature Specification: OpenAPI API Doc CI

**Feature Branch**: `004-openapi-api-doc-ci`
**Created**: 2025-10-24
**Status**: Draft
**Input**: User description: "api の IF を openapi で定義して、それを下に CI で API 定義書を作成したい。"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - API 定義書自動生成 (Priority: P1)

開発者が OpenAPI で API のインターフェースを定義すると、CI パイプラインで自動的に API 定義書が生成される。

**Why this priority**: API 仕様の変更が即座にドキュメントへ反映され、開発・運用の効率と品質が向上するため。

**Independent Test**: OpenAPI ファイルを更新し、CI 実行後に最新の API 定義書が自動生成されていることを確認する。

**Acceptance Scenarios**:

1. **Given** OpenAPI ファイルが更新された状態、**When** CI が実行される、**Then** 最新の API 定義書が生成される
2. **Given** OpenAPI ファイルに誤りがある状態、**When** CI が実行される、**Then** エラーが通知される

---

### User Story 2 - ドキュメントの参照性向上 (Priority: P2)

チームメンバーが常に最新の API 定義書を参照できる。

**Why this priority**: API 利用者や開発者が仕様の齟齬なく開発できるため。

**Independent Test**: CI 後に生成された API 定義書がリポジトリや Web 上で参照可能であることを確認する。

**Acceptance Scenarios**:

1. **Given** API 定義書が生成された状態、**When** メンバーが参照する、**Then** 最新の内容が確認できる

---

### Edge Cases

- OpenAPI ファイルが不正な場合、CI は失敗しエラー内容を明示する
  複数バージョンの API 定義が存在する場合、最新バージョンのみ定義書を生成する（過去バージョンは生成・管理しない）

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: OpenAPI 形式で API インターフェースを定義できること
- **FR-002**: CI パイプラインで API 定義書を自動生成できること
- **FR-003**: 定義書生成時に OpenAPI ファイルの妥当性を検証すること
- **FR-004**: 生成された API 定義書を参照可能な場所に配置すること
- **FR-005**: エラー発生時は CI で通知すること
  **FR-006**: 複数バージョンの API 定義がある場合は、最新コミットのバージョンのみ定義書生成対象とする

### Key Entities

- **OpenAPI ファイル**: API のインターフェース定義を記述するファイル。主要属性はエンドポイント、リクエスト/レスポンス、スキーマ等。
- **API 定義書**: OpenAPI ファイルから生成される人間が参照可能なドキュメント。

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: OpenAPI ファイル更新後、24 時間以内に最新の API 定義書が自動生成されている
- **SC-002**: API 定義書の参照率が 80%以上（チーム内アンケート等で測定）
- **SC-003**: OpenAPI ファイルの妥当性検証でエラーがあれば CI で即時通知される
- **SC-004**: 複数バージョンの API 定義がある場合、運用方針に従い正しいバージョンの定義書が生成される

## Assumptions

- OpenAPI ファイルはリポジトリ内で一元管理される
- CI は GitHub Actions 等の一般的な CI ツールを利用する
- API 定義書は HTML 等の人間が参照しやすい形式で生成される
