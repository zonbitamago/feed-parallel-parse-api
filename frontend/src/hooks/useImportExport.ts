/**
 * インポート/エクスポート機能を提供するカスタムフック
 */

import { exportSubscriptions, importSubscriptions } from '../services/importExport.service'

interface UseImportExportOptions {
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
}

export function useImportExport(options?: UseImportExportOptions) {
  const { onSuccess, onError } = options || {}

  /**
   * エクスポート処理
   */
  const handleExport = () => {
    try {
      exportSubscriptions()
    } catch (error) {
      console.error('Export failed:', error)
      if (onError) {
        onError(error instanceof Error ? error.message : 'エクスポートに失敗しました')
      }
    }
  }

  /**
   * インポート処理
   */
  const handleImport = () => {
    // ファイル選択用のinput要素を作成
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'

    // ファイル選択時の処理
    const handleChange = async (event: Event) => {
      const target = event.target as HTMLInputElement
      const file = target.files?.[0]

      if (!file) {
        return
      }

      try {
        const result = await importSubscriptions(file)

        if (result.success) {
          if (onSuccess) {
            onSuccess(result.message)
          }
        } else {
          if (onError) {
            onError(result.error || 'インポートに失敗しました')
          }
        }
      } catch (error) {
        console.error('Import failed:', error)
        if (onError) {
          onError(error instanceof Error ? error.message : 'インポートに失敗しました')
        }
      } finally {
        // メモリリーク防止: イベントリスナーを削除
        input.removeEventListener('change', handleChange)
      }
    }

    input.addEventListener('change', handleChange)

    // ファイル選択ダイアログを開く
    input.click()
  }

  return {
    handleExport,
    handleImport,
  }
}
