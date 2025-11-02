/**
 * フィード購読のインポート/エクスポート機能
 */

import { loadSubscriptions } from './storage'
import type { ExportData } from '../types/models'

/**
 * 購読フィードをJSONファイルとしてエクスポート（ダウンロード）
 *
 * ステップ1: モックデータを返す最小実装 → ステップ2: localStorageから読み込み
 * → ステップ3: ExportData型でラップ → ステップ4: JSON文字列化
 * → ステップ5: Blob作成 → ダウンロード
 */
export function exportSubscriptions(): void {
  // ステップ2: loadSubscriptions() でlocalStorageから読み込み
  const subscriptions = loadSubscriptions()

  // ステップ3: ExportData 型でラップ（version: "1.0.0", exportedAt: 固定値）
  const exportData: ExportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    subscriptions,
  }

  // ステップ4: JSON.stringify(data, null, 2) でJSON文字列化
  const jsonString = JSON.stringify(exportData, null, 2)

  // ステップ5: Blob 作成 → URL.createObjectURL() → ダウンロード
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  // ダウンロードリンクを作成してクリック
  const link = document.createElement('a')
  link.href = url
  link.download = `subscriptions_${new Date().toISOString().split('T')[0]}.json`
  link.click()

  // メモリ解放
  URL.revokeObjectURL(url)
}
