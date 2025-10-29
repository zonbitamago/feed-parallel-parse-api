import { useState, useCallback, useEffect, useRef } from 'react'
import { parseFeeds } from '../services/feedAPI'
import { FEED_ERROR_MESSAGES } from '../constants/errorMessages'

/**
 * デバウンス遅延時間（ミリ秒）
 * ユーザーがURL入力を停止してから、プレビュー取得を開始するまでの待機時間
 */
const DEBOUNCE_DELAY = 500

/**
 * フィードプレビュー取得カスタムフック
 *
 * URL入力時にフィードタイトルのプレビューを取得する機能を提供します。
 *
 * 【主な機能】
 * - デバウンス処理: 連続入力時は最後の入力から500ms後にのみAPI呼び出し
 * - AbortController: 新しいリクエスト時に古いリクエストをキャンセル
 * - エラーハンドリング: ネットワークエラーや無効なフィードの適切な処理
 *
 * 【使用例】
 * ```tsx
 * const { previewTitle, isLoadingPreview, previewError, fetchPreview, clearPreview } = useFeedPreview()
 *
 * // URL入力時
 * <input onChange={(e) => fetchPreview(e.target.value)} />
 *
 * // プレビュー表示
 * {previewTitle && <p>プレビュー: {previewTitle}</p>}
 * ```
 */
export function useFeedPreview() {
  const [previewTitle, setPreviewTitle] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // デバウンス用タイマー（連続入力時に前のタイマーをキャンセル）
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  // AbortController（新しいリクエスト時に古いリクエストをキャンセル）
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * プレビューをクリア
   *
   * 実行中のAPI呼び出しをキャンセルし、すべての状態をリセットします。
   */
  const clearPreview = useCallback(() => {
    setPreviewTitle(null)
    setPreviewError(null)
    setIsLoadingPreview(false)

    // デバウンスタイマーをクリア
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    // 実行中のAPI呼び出しをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  /**
   * フィードプレビューを取得
   *
   * @param url - プレビューを取得するフィードのURL
   *
   * 【処理フロー】
   * 1. 空文字チェック → プレビューをクリア
   * 2. 既存のタイマーとリクエストをキャンセル
   * 3. デバウンス（500ms待機）
   * 4. API呼び出しでフィードタイトルを取得
   * 5. 結果を状態に反映（成功/エラー）
   */
  const fetchPreview = useCallback(async (url: string) => {
    // 空文字の場合はプレビューをクリア
    if (!url || url.trim().length === 0) {
      clearPreview()
      return
    }

    // 既存のデバウンスタイマーをクリア
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 実行中のAPI呼び出しをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // デバウンス処理
    debounceTimerRef.current = setTimeout(async () => {
      // 新しいAbortControllerを作成
      abortControllerRef.current = new AbortController()

      setIsLoadingPreview(true)
      setPreviewError(null)

      try {
        const response = await parseFeeds([url], { signal: abortControllerRef.current.signal })

        // エラーがある場合
        if (response.errors.length > 0) {
          setPreviewError(response.errors[0].message)
          setPreviewTitle(null)
          setIsLoadingPreview(false)
          return
        }

        // フィードが取得できた場合
        if (response.feeds.length > 0) {
          setPreviewTitle(response.feeds[0].title)
          setPreviewError(null)
        } else {
          setPreviewError(FEED_ERROR_MESSAGES.FETCH_FAILED)
          setPreviewTitle(null)
        }
      } catch (error) {
        // AbortErrorは無視（意図的なキャンセル）
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        setPreviewError(
          error instanceof Error ? error.message : FEED_ERROR_MESSAGES.FETCH_FAILED
        )
        setPreviewTitle(null)
      } finally {
        setIsLoadingPreview(false)
        abortControllerRef.current = null
      }
    }, DEBOUNCE_DELAY)
  }, [clearPreview])

  // クリーンアップ: アンマウント時にタイマーとリクエストをクリア
  useEffect(() => {
    return () => {
      // デバウンスタイマーをクリア
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      // 実行中のAPI呼び出しをキャンセル
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    previewTitle,
    isLoadingPreview,
    previewError,
    fetchPreview,
    clearPreview,
  }
}
