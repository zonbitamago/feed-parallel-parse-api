/**
 * インポートデータのバリデーション関数群
 */

import type { ExportData, ImportValidationError } from '../types/models'

/**
 * ExportDataの形式をバリデーション
 */
export function validateExportData(data: ExportData): {
  valid: boolean
  error?: ImportValidationError
} {
  // Step 1: 必須フィールドの存在チェック
  if (!data.version) {
    return {
      valid: false,
      error: {
        code: 'MISSING_REQUIRED_FIELD',
        message: '必須フィールドが不足しています',
        details: 'version field is missing',
      },
    }
  }

  if (!data.exportedAt) {
    return {
      valid: false,
      error: {
        code: 'MISSING_REQUIRED_FIELD',
        message: '必須フィールドが不足しています',
        details: 'exportedAt field is missing',
      },
    }
  }

  if (data.subscriptions === undefined) {
    return {
      valid: false,
      error: {
        code: 'MISSING_REQUIRED_FIELD',
        message: '必須フィールドが不足しています',
        details: 'subscriptions field is missing',
      },
    }
  }

  // Step 2: subscriptionsが配列かチェック
  if (!Array.isArray(data.subscriptions)) {
    return {
      valid: false,
      error: {
        code: 'INVALID_SCHEMA',
        message: 'データ形式が正しくありません',
        details: 'subscriptions must be an array',
      },
    }
  }

  // Step 3: バージョンチェック
  if (data.version !== '1.0.0') {
    return {
      valid: false,
      error: {
        code: 'INVALID_VERSION',
        message: 'サポートされていないバージョンです',
        details: `Unsupported version: ${data.version}`,
      },
    }
  }

  // Step 4: すべてのチェックをパス
  return {
    valid: true,
  }
}
