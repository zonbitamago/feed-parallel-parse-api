# Implementation Plan: アプリ内インタラクティブチュートリアル

**Branch**: `017-in-app-tutorial` | **Date**: 2025-11-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/017-in-app-tutorial/spec.md`

## Summary

新規ユーザーのオンボーディング体験向上のため、アプリ内でインタラクティブなチュートリアル機能を実装します。driver.js（5kb、MIT License、React 19互換）を使用して、7ステップのステップバイステップガイドを提供。初回訪問時（フィード0件）に自動表示し、ヘッダーの「ヘルプ」ボタンからいつでも再表示可能。localStorageで表示状態を管理し、TailwindCSSでカスタムスタイリング、レスポンシブ対応、アクセシビリティ対応（ARIA属性、キーボード操作）を含みます。

**技術的アプローチ**:
- driver.jsライブラリの導入（バンドルサイズ+5kb）
- カスタムReactフック `useTutorial` の作成
- 既存の `useLocalStorage` フックの活用
- App.tsxにヘルプボタン追加
- TailwindCSSによるスタイルカスタマイズ

## Technical Context

**Language/Version**: TypeScript 5.9.3, React 19.1.1
**Primary Dependencies**:
  - driver.js: ~2.1.1 (新規追加、5kb gzip後、MIT License)
  - 既存: react 19.1.1, react-dom 19.1.1, tailwindcss 4.1.16
**Storage**: localStorage（チュートリアル表示状態管理）
**Testing**: Vitest 4.0.3, @testing-library/react 16.3.0
**Target Platform**: Web（デスクトップ、タブレット、モバイル）
**Project Type**: Web（frontend + backend構成、今回はfrontendのみ変更）
**Performance Goals**:
  - チュートリアル表示からステップ遷移まで500ms以内
  - アプリ初回読み込み時間への影響200ms以内
**Constraints**:
  - React 19互換性必須
  - バンドルサイズ増加を最小限に（+5-7kb許容）
  - 既存機能への影響ゼロ
  - アクセシビリティ対応（WCAG 2.1 AA準拠）
**Scale/Scope**:
  - 7ステップの固定チュートリアル
  - localStorage 1キーの使用（`rss_reader_tutorial_seen`）
  - 新規コンポーネント: 0（driver.jsがUI提供）
  - 新規フック: 1（`useTutorial`）
  - 既存ファイル変更: 2（App.tsx、package.json）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Test-Driven Development (t-wada Style)

- [x] **Red-Green-Refactor サイクル**: 全機能をTDDで実装
  - `useTutorial` フックのユニットテスト
  - App.tsx変更の統合テスト
  - driver.js統合のE2Eテスト（手動またはPlaywright）
- [x] **テストファースト**: driver.js統合前にモックでテスト作成
- [x] **カバレッジ100%**: 新規コード（useTutorialフック）は100%カバー

### TypeScript + React 品質基準

- [x] **any禁止**: driver.jsの型定義を使用、anyは使わない
- [x] **strict mode**: 既存のtsconfig.jsonの`"strict": true`を維持
- [x] **Props型定義**: ヘルプボタンコンポーネント（必要な場合）のProps型定義
- [x] **カスタムフックのテスト**: `useTutorial` フックを独立してテスト

### テスト実行ルール（CPU負荷対策）

- [x] **watchモード禁止**: `npm test`（1回限りの実行）を使用
- [x] **選択的テスト実行**: 開発中は`npm test useTutorial.test.ts`で対象ファイルのみ実行
- [x] **テストプロセスのクリーンアップ**: 各Phase完了時に`ps aux | grep vitest`で確認

### 新規依存関係の追加

- [x] **既存ツールで解決できないか**: driver.js以外の選択肢を検討済み（自作は複雑性高、他のライブラリはReact 19非互換）
- [x] **バンドルサイズへの影響**: +5kb（gzip後）、許容範囲内
- [x] **メンテナンス状況**: driver.js - 24,678 GitHub stars、2025年も更新継続中、アクティブ
- [x] **テスト可能性への影響**: driver.jsはDOMベースで、@testing-library/reactと互換性あり

### Quality Gates（マージ前必須条件）

- [ ] すべてのテストがパス
- [ ] カバレッジが80%以上（新規コードは100%）
- [ ] TypeScript の型チェックがパス
- [ ] ESLint の警告ゼロ
- [ ] コードレビュー承認
- [ ] CI/CDパイプラインがグリーン

**Constitution Check Result**: ✅ すべてのゲートをパス。違反なし。

## Project Structure

### Documentation (this feature)

```text
specs/017-in-app-tutorial/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - driver.jsの技術調査、React 19互換性確認
├── data-model.md        # Phase 1 output - TutorialState, TutorialStepの定義
├── quickstart.md        # Phase 1 output - ローカル環境でのチュートリアル実装・テスト手順
├── contracts/           # Phase 1 output - N/A（APIなし、フロントエンドのみ）
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── hooks/
│   │   ├── useTutorial.ts          # 新規: チュートリアル管理フック
│   │   ├── useTutorial.test.ts      # 新規: useTutorialのユニットテスト
│   │   └── useLocalStorage.ts       # 既存: localStorage管理フック（再利用）
│   ├── constants/
│   │   └── tutorialSteps.ts         # 新規: 7ステップの定義
│   ├── App.tsx                      # 変更: ヘルプボタン追加、useTutorial統合
│   ├── App.test.tsx                 # 変更: ヘルプボタンの統合テスト追加
│   └── components/                  # 既存構造維持（変更なし）
├── package.json                     # 変更: driver.js依存関係追加
├── package-lock.json                # 変更: 自動更新
└── tests/                           # 既存: Vitest設定（変更なし）

backend/
└── （変更なし）
```

**Structure Decision**:
- フロントエンドのみの変更で、既存の `frontend/src/` 構造を維持
- 新規フック `useTutorial` は `hooks/` ディレクトリに配置（既存パターンに従う）
- チュートリアルステップ定義は `constants/` に配置（設定データとして扱う）
- driver.jsのCSSは `App.tsx` でインポート（グローバルスタイル）

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations.** すべてのConstitution Checkをパス。

## Phase 0: Research & Technology Choices

### Research Tasks

1. **driver.jsの技術調査**
   - React 19互換性の確認（VanillaJS実装のため問題なし）
   - TypeScript型定義の確認
   - TailwindCSSとの統合方法
   - カスタマイズ可能なオプション（スタイル、位置、ARIA属性）

2. **既存コードとの統合調査**
   - `useLocalStorage` フックの再利用方法
   - App.tsxのヘッダー構造確認
   - 既存のコンポーネントCSSセレクターの特定（7ステップ）

3. **アクセシビリティベストプラクティス**
   - ARIA属性の適用方法（driver.jsのデフォルト対応確認）
   - キーボードナビゲーションのカスタマイズ
   - スクリーンリーダーテスト手法

**Output**: [research.md](research.md)

### Key Decisions

| Decision | Rationale | Alternative Rejected |
|----------|-----------|---------------------|
| driver.js採用 | React 19互換、軽量（5kb）、アクティブメンテナンス、MIT License | react-joyride（React 19非互換）、自作実装（複雑性高） |
| useTutorialフック化 | テスト可能性向上、再利用性、ロジックとUIの分離 | App.tsx内に直接実装（テスト困難） |
| localStorage使用 | シンプル、既存パターン踏襲、同期的アクセス | IndexedDB（過剰）、Cookie（容量制限） |
| 7ステップ固定 | YAGNI原則、現在の要求を満たす最小実装 | 動的ステップ管理（将来必要になったら実装） |

## Phase 1: Design & Contracts

### Data Model

**See**: [data-model.md](data-model.md)

#### TutorialState（チュートリアル状態）

```typescript
interface TutorialState {
  hasSeenTutorial: boolean  // チュートリアル完了フラグ
  isActive: boolean          // 現在表示中か
}
```

#### TutorialStep（ステップ定義）

```typescript
interface TutorialStep {
  element: string             // CSSセレクター（例: 'input[aria-label="フィードURL"]'）
  popover: {
    title: string             // ステップタイトル
    description: string       // 説明文
    side: 'top' | 'bottom' | 'left' | 'right'  // ポップアップ位置
    align: 'start' | 'center' | 'end'          // 位置揃え
  }
}
```

#### Constants（tutorialSteps.ts）

```typescript
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    element: 'input[aria-label="フィードURL"]',
    popover: {
      title: 'ステップ1: RSSフィードを追加',
      description: 'RSSフィードのURLをここに入力して、記事を購読しましょう。',
      side: 'bottom',
      align: 'start'
    }
  },
  // ... 残り6ステップ
]
```

### API Contracts

**N/A** - This feature is frontend-only. No API endpoints required.

### Component Architecture

#### useTutorial Hook

```typescript
/**
 * チュートリアル管理カスタムフック
 *
 * @returns {object} チュートリアル制御オブジェクト
 * @returns {boolean} shouldShowTutorial - 初回表示すべきか
 * @returns {function} startTutorial - チュートリアル開始
 * @returns {function} resetTutorial - 状態リセット（デバッグ用）
 */
export function useTutorial(): {
  shouldShowTutorial: boolean
  startTutorial: () => void
  resetTutorial: () => void
}
```

#### Integration Points

1. **App.tsx**
   - `useTutorial` フックを使用
   - useEffect で初回訪問時の自動表示
   - ヘッダーにヘルプボタン追加
   - driver.js CSSのインポート

2. **localStorage**
   - Key: `rss_reader_tutorial_seen`
   - Value: `boolean`
   - 既存の `useLocalStorage` フック活用

### Quickstart Guide

**See**: [quickstart.md](quickstart.md)

Summary:
1. driver.jsをインストール
2. `useTutorial` フックを実装（TDD）
3. `tutorialSteps.ts` でステップ定義
4. App.tsxに統合
5. ローカルでテスト（localStorage削除で初回表示確認）
6. アクセシビリティテスト（キーボード、スクリーンリーダー）

## Phase 2: Implementation Phases

### Phase 2.1: Foundation (P1 - 自動表示)

**Goal**: 初回訪問時にチュートリアルが自動表示される

#### Tasks (T001-T010)

**T001**: driver.jsのインストールと型定義確認
- `npm install driver.js`
- TypeScript型定義の確認
- package.jsonへの記録

**T002**: tutorialSteps.tsの作成（TDD）
- `frontend/src/constants/tutorialSteps.ts` 作成
- 7ステップの定義（CSSセレクターは仮値）
- TypeScript型チェックパス

**T003**: useTutorialフックのテスト作成（Red）
- `frontend/src/hooks/useTutorial.test.ts` 作成
- テストケース:
  1. 初回訪問時に`shouldShowTutorial`がtrue
  2. `startTutorial`呼び出し後、localStorageに保存
  3. 2回目訪問時に`shouldShowTutorial`がfalse
  4. `resetTutorial`でlocalStorageがクリア
- 全テスト失敗を確認（Red）

**T004**: useTutorialフックの実装（Green）
- `frontend/src/hooks/useTutorial.ts` 作成
- `useLocalStorage`フック活用
- driver.jsの`driver()`関数呼び出し
- TUTORIAL_STEPSを渡す
- 全テスト成功を確認（Green）

**T005**: useTutorialフックのリファクタリング（Refactor）
- コードの重複排除
- 意図を明確にするための命名改善
- コメント追加
- テスト維持を確認

**T006**: App.tsxへの統合テスト作成（Red）
- `frontend/src/App.test.tsx` 更新
- テストケース:
  1. フィード0件時、チュートリアルが自動表示
  2. フィード1件以上時、チュートリアル非表示
  3. localStorage既存時、チュートリアル非表示
- モックで`driver.js`をモック化
- 全テスト失敗を確認（Red）

**T007**: App.tsxにuseTutorial統合（Green）
- driver.js CSSのインポート: `import 'driver.js/dist/driver.css'`
- `useTutorial` フック呼び出し
- useEffectで初回表示ロジック実装
- 全テスト成功を確認（Green）

**T008**: CSSセレクターの実装確認と修正
- 実際のDOM要素に対応するセレクターを特定
- `tutorialSteps.ts` のセレクター更新
- 手動テスト: ローカル環境でチュートリアル表示確認

**T009**: レスポンシブ対応の確認
- デスクトップ（1920px）でテスト
- タブレット（768px）でテスト
- モバイル（375px）でテスト
- ポップアップ位置調整（必要に応じて`side`, `align`変更）

**T010**: Phase 2.1の統合テスト
- フィード0件で新規ブラウザ起動
- チュートリアル自動表示を確認
- 7ステップすべてを進行
- localStorage確認
- ページリロードで再表示されないことを確認

**Phase 2.1 Definition of Done**:
- [ ] すべてのテストがパス
- [ ] useTutorialフックのカバレッジ100%
- [ ] 初回訪問時にチュートリアル自動表示
- [ ] 7ステップすべて表示可能
- [ ] localStorageに状態保存
- [ ] TypeScript型チェックパス
- [ ] ESLint警告ゼロ

### Phase 2.2: Help Button (P2 - 手動再表示)

**Goal**: ヘッダーのヘルプボタンからチュートリアルを再表示

#### Tasks (T011-T015)

**T011**: ヘルプボタンのテスト作成（Red）
- `App.test.tsx` 更新
- テストケース:
  1. ヘッダーにヘルプボタンが表示
  2. クリックで`startTutorial`が呼ばれる
  3. ツールチップ「ヘルプ」が表示
- 全テスト失敗を確認（Red）

**T012**: ヘルプボタンの実装（Green）
- App.tsxのヘッダーにボタン追加
- アイコン: HelpCircleIcon（既存のアイコンライブラリまたはSVG）
- onClick: `startTutorial`
- aria-label: "チュートリアルを表示"
- 全テスト成功を確認（Green）

**T013**: ヘルプボタンのスタイリング（Refactor）
- TailwindCSSクラス適用
- ホバー効果
- フォーカス表示
- レスポンシブ配置

**T014**: ツールチップの実装
- title属性または TailwindCSS tooltip
- "ヘルプ"または"チュートリアルを表示"

**T015**: Phase 2.2の統合テスト
- ヘルプボタンクリック
- チュートリアル表示確認
- 既にチュートリアル完了済みでも表示可能
- 全ステップ進行可能

**Phase 2.2 Definition of Done**:
- [ ] ヘルプボタンがヘッダーに表示
- [ ] クリックでチュートリアル開始
- [ ] ツールチップ表示
- [ ] すべてのテストがパス

### Phase 2.3: Accessibility (P3 - アクセシビリティ)

**Goal**: キーボード操作とスクリーンリーダー対応

#### Tasks (T016-T020)

**T016**: driver.jsのARIA属性確認
- driver.jsデフォルトのARIA属性を調査
- 不足している属性の特定
- カスタマイズ方法の確認

**T017**: ARIA属性のカスタマイズ（必要な場合）
- `role="dialog"`, `aria-labelledby`, `aria-describedby`
- driver.jsの設定オプションで追加
- 手動検証: Chromeの Accessibility Tree確認

**T018**: キーボード操作のテスト
- Tabキーでフォーカス移動
- Enterキーで次へ
- Escapeキーで終了
- 手動テスト実施

**T019**: スクリーンリーダーテスト
- NVDA（Windows）またはVoiceOver（Mac）で読み上げ確認
- 各ステップのタイトル・説明が読み上げられるか
- ボタンの役割が明確か

**T020**: Phase 2.3の統合テスト
- キーボードのみで全ステップ完了
- スクリーンリーダーで音声確認
- アクセシビリティ監査ツール（axe DevTools）で検証

**Phase 2.3 Definition of Done**:
- [ ] ARIA属性が適切に設定
- [ ] キーボードのみで操作可能
- [ ] スクリーンリーダーで読み上げ可能
- [ ] axe DevTools で警告ゼロ

### Phase 2.4: Responsive & Polish (P3 - レスポンシブ)

**Goal**: 全デバイスで適切に表示

#### Tasks (T021-T025)

**T021**: モバイル（320px-767px）での表示確認
- ポップアップが画面内に収まるか
- テキストが読みやすいか
- ボタンがタッチ操作可能か
- 必要に応じて`side`, `align`調整

**T022**: タブレット（768px-1023px）での表示確認
- 横向き・縦向き両方
- ポップアップ位置調整

**T023**: デスクトップ（1024px以上）での表示確認
- 大画面でのポップアップ配置
- ハイライトが見やすいか

**T024**: driver.jsのカスタムスタイリング
- TailwindCSSクラスの適用方法確認
- `popoverClass`, `activeElement`スタイル
- テーマカラーの適用

**T025**: Phase 2.4の統合テスト
- 4つの画面サイズ（320px, 768px, 1024px, 1920px）でテスト
- すべてのステップで画面内表示
- レスポンシブ動作確認

**Phase 2.4 Definition of Done**:
- [ ] 全画面サイズで適切に表示
- [ ] カスタムスタイルが適用
- [ ] TailwindCSSのテーマカラー統一

### Phase 2.5: Edge Cases & Final Tests

**Goal**: エッジケースの処理と最終検証

#### Tasks (T026-T030)

**T026**: エッジケースのテスト追加
- ウィンドウリサイズ中の動作
- 対象要素が存在しない場合
- localStorage無効時の動作
- 複数タブでの動作

**T027**: エラーハンドリングの実装
- driver.js初期化失敗時のフォールバック
- console.errorでログ出力
- ユーザーにエラーを表示しない（サイレント失敗）

**T028**: パフォーマンステスト
- Lighthouseでパフォーマンス測定
- 初回読み込み時間の影響確認（+200ms以内）
- バンドルサイズ確認（+5-7kb）

**T029**: ドキュメント更新
- SPECIFICATION.mdにチュートリアル機能を追加
- README.mdに使い方セクション追加（必要な場合）
- CLAUDE.mdは更新不要（開発ガイドラインに影響なし）

**T030**: 最終統合テスト
- 新規ブラウザで全フロー実行
- ヘルプボタンから再表示
- キーボード操作
- スクリーンリーダー
- モバイル・デスクトップ両方

**Phase 2.5 Definition of Done**:
- [ ] すべてのエッジケースをカバー
- [ ] エラーハンドリング実装
- [ ] パフォーマンス基準クリア
- [ ] ドキュメント更新完了
- [ ] 最終統合テスト完了

## Testing Strategy

### Unit Tests

**Target**: useTutorialフック

- `hooks/useTutorial.test.ts`
- カバレッジ: 100%
- テストケース:
  1. localStorage初期値がfalseの場合、shouldShowTutorialがtrue
  2. startTutorial()呼び出しでlocalStorageがtrueに変更
  3. localStorage既存値がtrueの場合、shouldShowTutorialがfalse
  4. resetTutorial()でlocalStorageがfalseに変更
  5. driver()関数が正しいパラメータで呼ばれる（モック検証）

### Integration Tests

**Target**: App.tsx統合

- `App.test.tsx`
- テストケース:
  1. フィード0件時、useEffect でstartTutorialが呼ばれる
  2. フィード1件以上時、startTutorialが呼ばれない
  3. ヘルプボタンクリックでstartTutorialが呼ばれる
  4. ヘルプボタンにaria-labelが設定されている

### E2E Tests

**Manual Testing** (Playwrightは将来的に追加可能)

- シナリオ1: 初回訪問（フィード0件）
  1. localStorage削除
  2. ページリロード
  3. チュートリアル自動表示確認
  4. 7ステップすべてクリック
  5. localStorageに保存確認

- シナリオ2: ヘルプボタンからの再表示
  1. 既存ユーザー（localStorage既存）
  2. ヘルプボタンクリック
  3. チュートリアル表示確認

- シナリオ3: アクセシビリティ
  1. キーボードのみで全ステップ
  2. スクリーンリーダーで読み上げ確認

### Performance Tests

- Lighthouse CI
- メトリクス:
  - First Contentful Paint: +200ms以内の増加
  - Total Blocking Time: 影響なし
  - Bundle Size: +5-7kb

## Deployment Considerations

### Build Process

- driver.jsは自動的にバンドル対象
- CSS (`driver.js/dist/driver.css`) もバンドル
- Tree-shakingにより未使用コード削除

### Environment Configuration

- 環境変数不要
- localStorage のみ使用（設定不要）

### Rollback Plan

- フィーチャーフラグ不要（ユーザー影響最小）
- 問題発生時:
  1. ヘルプボタンを非表示
  2. useEffect の自動表示ロジックをコメントアウト
  3. driver.jsのインポートを削除
  4. 再デプロイ

### Monitoring

- ユーザーサポート問い合わせ数の追跡（Success Criteria SC-010）
- フィード追加成功率の追跡（Success Criteria SC-003）
- エラーログ監視（driver.js初期化失敗）

## Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| driver.jsのReact 19非互換 | Low | High | 事前調査完了（VanillaJS実装で互換性あり）、Proof of Concept実施 |
| バンドルサイズ増加 | Low | Medium | 5kb（gzip後）は許容範囲、Lighthouse CI でモニタリング |
| 既存機能への影響 | Low | High | driver.jsは非侵入的、既存テストでリグレッションチェック |
| CSSセレクターの変更 | Medium | Low | 将来のUI変更でセレクター無効化→ステップスキップ実装 |

### User Experience Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| チュートリアルがうざい | Medium | Medium | 「スキップ」ボタンを目立たせる、Escapeキーでも終了可能 |
| モバイルで見づらい | Low | Medium | レスポンシブテスト徹底、実機テスト実施 |
| localStorageブロック | Low | Low | フォールバック動作（毎回表示）実装済み |

## Success Metrics

### Implementation Success

- [ ] すべてのテストがパス
- [ ] カバレッジ80%以上（新規コード100%）
- [ ] TypeScript型チェックパス
- [ ] ESLint警告ゼロ
- [ ] Lighthouse Performance スコア低下なし

### User Success (Post-Deployment)

- **SC-001**: 新規ユーザーの90%以上がチュートリアル表示成功
- **SC-002**: チュートリアル完了率70%以上
- **SC-003**: フィード追加成功率50%向上
- **SC-010**: サポート問い合わせ30%減少

## Timeline Estimate

| Phase | Estimated Time | Tasks |
|-------|---------------|-------|
| Phase 0: Research | 0.5日 | driver.js調査、既存コード確認 |
| Phase 1: Design | 0.5日 | data-model.md、quickstart.md作成 |
| Phase 2.1: Foundation (P1) | 1-1.5日 | T001-T010 |
| Phase 2.2: Help Button (P2) | 0.5日 | T011-T015 |
| Phase 2.3: Accessibility (P3) | 0.5-1日 | T016-T020 |
| Phase 2.4: Responsive (P3) | 0.5日 | T021-T025 |
| Phase 2.5: Edge Cases & Final | 0.5-1日 | T026-T030 |
| **Total** | **4-5.5日** | 30タスク |

## Dependencies

### Internal Dependencies

- 既存の`useLocalStorage`フック
- 既存のApp.tsxヘッダー構造
- 既存のTailwindCSS設定

### External Dependencies

- driver.js ~2.1.1（新規追加）
- Node.js, npm（既存）
- TypeScript, React（既存）

### Blocking Issues

**None** - すべての依存関係は解決済み

## Appendix

### References

- [driver.js公式ドキュメント](https://driverjs.com/)
- [driver.js GitHub](https://github.com/kamranahmedse/driver.js)
- [WCAG 2.1 AA基準](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Related Specs

- 016-feed-auto-polling: ポーリング状態表示エリア（ステップ6）
- 014-feed-import-export: インポート/エクスポートボタン（ステップ4）
- 001-parallel-rss-parse-api: 基本的なフィード購読機能（ステップ1-3）

### Glossary

- **driver.js**: 軽量なステップバイステップガイドライブラリ（5kb、VanillaJS）
- **TDD**: Test-Driven Development（テスト駆動開発）
- **ARIA**: Accessible Rich Internet Applications（アクセシビリティ標準）
- **WCAG**: Web Content Accessibility Guidelines（ウェブアクセシビリティガイドライン）
- **localStorage**: ブラウザのローカルストレージAPI
