/**
 * アプリケーション全体で使用するエラーメッセージ定数
 *
 * エラーメッセージの一貫性を保つため、すべてのエラーメッセージをここで管理
 */

/**
 * フィード関連のエラーメッセージ
 */
export const FEED_ERROR_MESSAGES = {
  /** フィード取得失敗時の汎用エラー */
  FETCH_FAILED: 'フィードの取得に失敗しました',
  /** フィード取得失敗時の表示用メッセージ */
  FETCH_FAILED_DISPLAY: 'エラー: 取得に失敗しました',
  /** 重複フィード登録エラー */
  DUPLICATE_FEED: 'このフィードは既に登録されています',
  /** フィードタイトル取得失敗エラー */
  TITLE_FETCH_FAILED: 'フィードのタイトルを取得できませんでした。URLをタイトルとして使用します。',
} as const

/**
 * URL検証関連のエラーメッセージ
 */
export const URL_ERROR_MESSAGES = {
  /** 無効なURL形式 */
  INVALID_URL: '無効なURLです',
  /** 無効なURL形式（詳細版） */
  INVALID_URL_DETAILED: '無効なURLです。http://またはhttps://で始まるURLを入力してください',
} as const

/**
 * カスタムタイトル関連のエラーメッセージ
 */
export const TITLE_ERROR_MESSAGES = {
  /** タイトルが空の場合 */
  EMPTY_TITLE: 'フィード名を入力してください',
  /** タイトルが長すぎる場合 */
  TITLE_TOO_LONG: 'フィード名は200文字以内で入力してください',
} as const

/**
 * 購読数制限関連のエラーメッセージ
 */
export const SUBSCRIPTION_ERROR_MESSAGES = {
  /** 購読数上限に達した場合 */
  LIMIT_REACHED: (limit: number) => `購読数が上限（${limit}件）に達しています`,
} as const