/**
 * フィード購読のインポート/エクスポート機能
 */

import { format } from 'date-fns'
import { loadSubscriptions, saveSubscriptions } from './storage'
import type { ExportData, Subscription, ImportResult } from '../types/models'
import { IMPORT_EXPORT_ERROR_MESSAGES } from '../constants/errorMessages'
import { validateExportData, validateSubscription, readFileAsText } from '../utils/importValidation'

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
    const errorMessage = error instanceof Error
      ? `${IMPORT_EXPORT_ERROR_MESSAGES.EXPORT_FAILED}: ${error.message}`
      : IMPORT_EXPORT_ERROR_MESSAGES.EXPORT_FAILED
    throw new Error(errorMessage)
  }
}

/**
 * エクスポートファイル名を生成
 * 形式: subscriptions_YYYY-MM-DD.json
 */
function generateFilename(): string {
  const date = format(new Date(), 'yyyy-MM-dd')
  return `subscriptions_${date}.json`
}

/**
 * インポートされたSubscriptionを正規化
 * 新しいID、subscribedAt、lastFetchedAt、statusを設定
 */
function normalizeImportedSubscription(imported: Subscription): Subscription {
  return {
    ...imported,
    id: crypto.randomUUID(),
    subscribedAt: new Date().toISOString(),
    lastFetchedAt: null,
    status: 'active',
  }
}

/**
 * 既存フィードとインポートフィードをマージ
 * URLベースで重複チェックを行い、新規フィードのみを追加
 */
export function mergeSubscriptions(
  existingSubscriptions: Subscription[],
  importedSubscriptions: Subscription[]
): {
  added: Subscription[]
  skipped: number
} {
  // Step 1: 既存URLをSetに格納（O(1)検索）
  const existingUrls = new Set(existingSubscriptions.map((sub) => sub.url))

  const added: Subscription[] = []
  let skipped = 0

  // Step 2: インポートフィードをループして重複チェック
  for (const importedSub of importedSubscriptions) {
    if (existingUrls.has(importedSub.url)) {
      // 重複: スキップ
      skipped++
    } else {
      // 新規: 正規化して追加
      const normalized = normalizeImportedSubscription(importedSub)
      added.push(normalized)
      existingUrls.add(importedSub.url) // 次の重複チェックのために追加
    }
  }

  return {
    added,
    skipped,
  }
}

/**
 * JSONファイルから購読フィードをインポート
 * 既存データとマージし、結果を返す
 */
export async function importSubscriptions(file: File): Promise<ImportResult> {
  // Step 1: ファイルをテキストとして読み込み
  const readResult = await readFileAsText(file)
  if (!readResult.success) {
    return {
      success: false,
      addedCount: 0,
      skippedCount: 0,
      message: '',
      error: readResult.error?.message,
    }
  }

  // Step 2: JSONパース
  let parsedData: ExportData
  try {
    parsedData = JSON.parse(readResult.text!)
  } catch (e) {
    return {
      success: false,
      addedCount: 0,
      skippedCount: 0,
      message: '',
      error: IMPORT_EXPORT_ERROR_MESSAGES.INVALID_JSON,
    }
  }

  // Step 3: スキーマバリデーション（ExportData全体）
  const validationResult = validateExportData(parsedData)
  if (!validationResult.valid) {
    return {
      success: false,
      addedCount: 0,
      skippedCount: 0,
      message: '',
      error: validationResult.error?.message,
    }
  }

  // Step 3.5: 個別のSubscriptionバリデーション
  for (let i = 0; i < parsedData.subscriptions.length; i++) {
    const subValidation = validateSubscription(parsedData.subscriptions[i], i)
    if (!subValidation.valid) {
      return {
        success: false,
        addedCount: 0,
        skippedCount: 0,
        message: '',
        error: subValidation.error?.message,
      }
    }
  }

  // Step 4: 既存の購読フィードを読み込み
  const existingSubscriptions = loadSubscriptions()

  // Step 5: マージ処理（重複チェック）
  const { added, skipped } = mergeSubscriptions(
    existingSubscriptions,
    parsedData.subscriptions
  )

  // Step 6: マージ結果を保存
  const updatedSubscriptions = [...existingSubscriptions, ...added]
  saveSubscriptions(updatedSubscriptions)

  // Step 7: 結果を返す
  const message = `${added.length}件のフィードを追加しました（${skipped}件はスキップ）`
  return {
    success: true,
    addedCount: added.length,
    skippedCount: skipped,
    message,
  }
}
