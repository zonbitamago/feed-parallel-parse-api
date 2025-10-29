import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { useFeedPreview } from './useFeedPreview'

/**
 * useFeedPreview カスタムフックのテスト
 *
 * フィードタイトルプレビュー機能のユニットテスト:
 * - プレビュー取得成功
 * - プレビュー取得失敗（無効URL、ネットワークエラー）
 * - デバウンス処理（500ms遅延）
 * - AbortControllerによるリクエストキャンセル
 */

const server = setupServer(
  http.post('*/api/parse', () => {
    return HttpResponse.json({
      feeds: [
        {
          title: 'Preview Blog Title',
          link: 'https://example.com/feed',
          articles: [],
        },
      ],
      errors: [],
    })
  })
)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  vi.clearAllTimers()
})
afterAll(() => server.close())

describe('useFeedPreview', () => {
  it('有効なURLを入力するとフィードタイトルのプレビューを取得する', async () => {
    // 準備
    const { result } = renderHook(() => useFeedPreview())

    // 初期状態の検証
    expect(result.current.previewTitle).toBeNull()
    expect(result.current.isLoadingPreview).toBe(false)
    expect(result.current.previewError).toBeNull()

    // 実行: 有効なURLを設定
    result.current.fetchPreview('https://example.com/feed')

    // 検証: プレビューが取得される（デバウンス + API呼び出しを待つ）
    await waitFor(() => {
      expect(result.current.previewTitle).toBe('Preview Blog Title')
    }, { timeout: 3000 })

    // 検証: ローディングが終了する
    expect(result.current.isLoadingPreview).toBe(false)
    expect(result.current.previewError).toBeNull()
  })

  it('URL入力をデバウンスして不要なAPI呼び出しを削減する', async () => {
    // モックサーバーの呼び出し回数をカウント
    let callCount = 0
    server.use(
      http.post('*/api/parse', () => {
        callCount++
        return HttpResponse.json({
          feeds: [
            {
              title: 'Debounced Title',
              link: 'https://example.com/feed',
              articles: [],
            },
          ],
          errors: [],
        })
      })
    )

    const { result } = renderHook(() => useFeedPreview())

    // 実行: 短時間に複数回URLを設定（デバウンスされるべき）
    result.current.fetchPreview('https://example.com/feed1')
    result.current.fetchPreview('https://example.com/feed2')
    result.current.fetchPreview('https://example.com/feed3')

    // 検証: デバウンス期間中はAPI呼び出しが行われない
    expect(callCount).toBe(0)

    // 検証: デバウンス後に1回だけAPI呼び出しが行われる
    await waitFor(() => {
      expect(result.current.previewTitle).toBe('Debounced Title')
    }, { timeout: 3000 })

    // 検証: 最後のURLのみが使用された（API呼び出しは1回のみ）
    expect(callCount).toBe(1)
  })

  it('無効なURLや存在しないフィードの場合はエラーを返す', async () => {
    // 準備: エラーレスポンスをモック
    server.use(
      http.post('*/api/parse', () => {
        return HttpResponse.json({
          feeds: [],
          errors: [
            {
              url: 'https://invalid.com/feed',
              message: 'フィードの取得に失敗しました',
            },
          ],
        })
      })
    )

    const { result } = renderHook(() => useFeedPreview())

    // 実行: 無効なURLを設定
    result.current.fetchPreview('https://invalid.com/feed')

    // 検証: エラーが設定される
    await waitFor(() => {
      expect(result.current.previewError).toBe('フィードの取得に失敗しました')
    }, { timeout: 3000 })

    // 検証: タイトルはnullのまま
    expect(result.current.previewTitle).toBeNull()
    expect(result.current.isLoadingPreview).toBe(false)
  })

  it('ネットワークエラーが発生した場合はエラーを返す', async () => {
    // 準備: ネットワークエラーをモック
    server.use(
      http.post('*/api/parse', () => {
        return HttpResponse.error()
      })
    )

    const { result } = renderHook(() => useFeedPreview())

    // 実行: URLを設定
    result.current.fetchPreview('https://example.com/feed')

    // 検証: エラーが設定される
    await waitFor(() => {
      expect(result.current.previewError).not.toBeNull()
    }, { timeout: 3000 })

    expect(result.current.previewTitle).toBeNull()
    expect(result.current.isLoadingPreview).toBe(false)
  })

  it('clearPreview()を呼ぶとプレビュー状態がクリアされる', async () => {
    // 準備: プレビューを取得
    const { result } = renderHook(() => useFeedPreview())

    result.current.fetchPreview('https://example.com/feed')

    await waitFor(() => {
      expect(result.current.previewTitle).toBe('Preview Blog Title')
    }, { timeout: 3000 })

    // 実行: プレビューをクリア
    act(() => {
      result.current.clearPreview()
    })

    // 検証: 状態がリセットされる
    expect(result.current.previewTitle).toBeNull()
    expect(result.current.previewError).toBeNull()
    expect(result.current.isLoadingPreview).toBe(false)
  })

  it('空文字を渡すとプレビュー取得を行わない', () => {
    const { result } = renderHook(() => useFeedPreview())

    // 実行: 空文字を設定
    result.current.fetchPreview('')

    // 検証: ローディングにならない
    expect(result.current.isLoadingPreview).toBe(false)
    expect(result.current.previewTitle).toBeNull()
    expect(result.current.previewError).toBeNull()
  })
})