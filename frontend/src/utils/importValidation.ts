/**
 * インポートデータのバリデーション関数群
 */

import type { ExportData, ImportValidationError, ImportErrorCode } from '../types/models'

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
