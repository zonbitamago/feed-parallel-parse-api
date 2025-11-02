/**
 * インポートデータのバリデーション関数群
 */

import type {
  ExportData,
  ImportValidationError,
  ImportErrorCode,
  Subscription,
} from '../types/models'

/**
 * バリデーションエラーを生成するヘルパー関数
 */
function createValidationError(
  code: ImportErrorCode,
  message: string,
  details: string
): { valid: false; error: ImportValidationError } {
  return {
    valid: false,
    error: {
      code,
      message,
      details,
    },
  }
}

/**
 * ExportDataの形式をバリデーション
 */
export function validateExportData(data: ExportData): {
  valid: boolean
  error?: ImportValidationError
} {
  // 必須フィールドの存在チェック
  if (!data.version) {
    return createValidationError(
      'MISSING_REQUIRED_FIELD',
      '必須フィールドが不足しています',
      'version field is missing'
    )
  }

  if (!data.exportedAt) {
    return createValidationError(
      'MISSING_REQUIRED_FIELD',
      '必須フィールドが不足しています',
      'exportedAt field is missing'
    )
  }

  if (data.subscriptions === undefined) {
    return createValidationError(
      'MISSING_REQUIRED_FIELD',
      '必須フィールドが不足しています',
      'subscriptions field is missing'
    )
  }

  // subscriptionsが配列かチェック
  if (!Array.isArray(data.subscriptions)) {
    return createValidationError(
      'INVALID_SCHEMA',
      'データ形式が正しくありません',
      'subscriptions must be an array'
    )
  }

  // バージョンチェック
  if (data.version !== '1.0.0') {
    return createValidationError(
      'INVALID_VERSION',
      'サポートされていないバージョンです',
      `Unsupported version: ${data.version}`
    )
  }

  // すべてのチェックをパス
  return {
    valid: true,
  }
}

/**
 * 個別のSubscriptionオブジェクトをバリデーション
 */
export function validateSubscription(
  subscription: Subscription,
  index: number
): {
  valid: boolean
  error?: ImportValidationError
} {
  // Step 1: 必須フィールドの存在チェック
  if (!subscription.url) {
    return createValidationError(
      'MISSING_REQUIRED_FIELD',
      '必須フィールドが不足しています',
      `url field is missing at index ${index}`
    )
  }

  if (!subscription.status) {
    return createValidationError(
      'MISSING_REQUIRED_FIELD',
      '必須フィールドが不足しています',
      `status field is missing at index ${index}`
    )
  }

  // Step 2: 型チェック
  if (typeof subscription.url !== 'string') {
    return createValidationError(
      'INVALID_SCHEMA',
      'データ形式が正しくありません',
      `url must be a string at index ${index}`
    )
  }

  // Step 3: statusの値チェック
  if (subscription.status !== 'active' && subscription.status !== 'error') {
    return createValidationError(
      'INVALID_SCHEMA',
      'データ形式が正しくありません',
      `status must be "active" or "error" at index ${index}`
    )
  }

  // Step 4: titleとcustomTitleの型チェック（nullまたは文字列）
  if (subscription.title !== null && typeof subscription.title !== 'string') {
    return createValidationError(
      'INVALID_SCHEMA',
      'データ形式が正しくありません',
      `title must be null or string at index ${index}`
    )
  }

  if (subscription.customTitle !== null && typeof subscription.customTitle !== 'string') {
    return createValidationError(
      'INVALID_SCHEMA',
      'データ形式が正しくありません',
      `customTitle must be null or string at index ${index}`
    )
  }

  // Step 5: すべてのチェックをパス
  return {
    valid: true,
  }
}

/**
 * ファイルをテキストとして読み込む
 */
export async function readFileAsText(file: File): Promise<{
  success: boolean
  text?: string
  error?: ImportValidationError
}> {
  // 仮実装: 常に失敗を返す
  return {
    success: false,
    error: {
      code: 'FILE_READ_ERROR',
      message: '未実装',
    },
  }
}
