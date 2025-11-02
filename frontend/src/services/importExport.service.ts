/**
 * フィード購読のインポート/エクスポート機能
 */

import { loadSubscriptions } from './storage'
import type { ExportData } from '../types/models'
import { IMPORT_EXPORT_ERROR_MESSAGES } from '../constants/errorMessages'

/**
 * 購読フィードをJSONファイルとしてエクスポート（ダウンロード）
 *
 * @throws Error エクスポート処理に失敗した場合
 */
export function exportSubscriptions(): void {
  try {
    const subscriptions = loadSubscriptions()

    const exportData: ExportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      subscriptions,
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const downloadUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = generateFilename()
    link.click()

    URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('Export failed:', error)
    throw new Error(IMPORT_EXPORT_ERROR_MESSAGES.EXPORT_FAILED)
  }
}

/**
 * エクスポートファイル名を生成
 * 形式: subscriptions_YYYY-MM-DD.json
 */
function generateFilename(): string {
  const date = new Date().toISOString().split('T')[0]
  return `subscriptions_${date}.json`
}
