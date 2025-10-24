# API 要件品質チェックリスト

**目的**: API 要件の網羅性・明確性・一貫性・測定可能性・シナリオ/エッジケース対応を検証する
**作成日**: 2025-10-24
**対象**: [spec.md](../spec.md)

## 要件の網羅性

- [ ] CHK001 - すべての API エンドポイントに対するリクエスト・レスポンス仕様が明記されているか？ [Completeness, Spec §Key Entities]
- [ ] CHK002 - エラー時の応答仕様（フォーマット・内容）は全 API で定義されているか？ [Completeness, Spec §Edge Cases]
- [ ] CHK003 - バージョン管理・運用方針が要件として明記されているか？ [Completeness, Spec §Assumptions]

## 要件の明確性

- [ ] CHK004 - 「自動生成」「参照可能」など曖昧な表現は具体的な条件・成果物で定義されているか？ [Clarity, Spec §Success Criteria]
- [ ] CHK005 - エラー通知の要件は通知方法・内容まで明確に記載されているか？ [Clarity, Spec §Functional Requirements]

## 要件の一貫性

- [ ] CHK006 - API 定義書生成・参照に関する要件が全体で矛盾なく記載されているか？ [Consistency, Spec §User Scenarios]
- [ ] CHK007 - バージョン管理方針が他要件と矛盾していないか？ [Consistency, Spec §Edge Cases]

## 受入基準の品質

- [ ] CHK008 - 成果指標（例：24 時間以内生成、参照率 80%以上等）は測定可能な形で記載されているか？ [Measurability, Spec §Success Criteria]
- [ ] CHK009 - 受入基準が技術依存せず、ユーザー価値・業務成果に紐付いているか？ [Acceptance Criteria, Spec §Success Criteria]

## シナリオ・カバレッジ

- [ ] CHK010 - 主要なユーザーストーリー（自動生成・参照性向上）が要件として網羅されているか？ [Coverage, Spec §User Scenarios]
- [ ] CHK011 - エラー・異常系（不正ファイル、生成失敗等）の要件が明記されているか？ [Coverage, Spec §Edge Cases]

## エッジケース対応

- [ ] CHK012 - 複数バージョン・不正ファイル・生成失敗などの境界条件が要件として記載されているか？ [Edge Case, Spec §Edge Cases]

## 非機能要件

- [ ] CHK013 - パフォーマンス（生成タイミング等）、セキュリティ（アクセス制御等）、可用性などの非機能要件が記載されているか？ [Non-Functional, Spec §Success Criteria]

## 依存関係・前提

- [ ] CHK014 - CI ツール・OpenAPI Generator 等の依存技術・運用前提が要件として明記されているか？ [Dependencies, Spec §Assumptions]

## 曖昧さ・未解決事項

- [ ] CHK015 - 曖昧な用語・未定義の成果物・未解決事項が残っていないか？ [Ambiguity, Spec §Functional Requirements]
