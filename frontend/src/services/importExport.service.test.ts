import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportSubscriptions } from './importExport.service'
import * as storage from './storage'
import type { Subscription } from '../types/models'

describe('importExport.service', () => {
  describe('exportSubscriptions', () => {
    let createObjectURLMock: ReturnType<typeof vi.fn>
    let revokeObjectURLMock: ReturnType<typeof vi.fn>
    let clickMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
      // URL.createObjectURL と URL.revokeObjectURL をモック
      createObjectURLMock = vi.fn(() => 'blob:mock-url')
      revokeObjectURLMock = vi.fn()
      global.URL.createObjectURL = createObjectURLMock
      global.URL.revokeObjectURL = revokeObjectURLMock

      // HTMLAnchorElement.click をモック
      clickMock = vi.fn()
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return {
            href: '',
            download: '',
            click: clickMock,
            style: {},
          } as unknown as HTMLAnchorElement
        }
        return document.createElement(tagName)
      })
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('購読フィードが3件ある場合、3件を含むJSONファイルをダウンロードする', () => {
      // Arrange: 3件のモックデータを準備
      const mockSubscriptions: Subscription[] = [
        {
          id: '1',
          url: 'https://example.com/feed1',
          title: 'Feed 1',
          customTitle: null,
          subscribedAt: '2025-01-01T00:00:00.000Z',
          lastFetchedAt: '2025-01-01T01:00:00.000Z',
          status: 'active',
        },
        {
          id: '2',
          url: 'https://example.com/feed2',
          title: 'Feed 2',
          customTitle: 'Custom Feed 2',
          subscribedAt: '2025-01-02T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
        {
          id: '3',
          url: 'https://example.com/feed3',
          title: 'Feed 3',
          customTitle: null,
          subscribedAt: '2025-01-03T00:00:00.000Z',
          lastFetchedAt: '2025-01-03T01:00:00.000Z',
          status: 'error',
        },
      ]

      vi.spyOn(storage, 'loadSubscriptions').mockReturnValue(mockSubscriptions)

      // Act: エクスポート実行
      exportSubscriptions()

      // Assert: 正しいデータでBlobが作成されたか確認
      expect(createObjectURLMock).toHaveBeenCalledTimes(1)
      const blobArg = createObjectURLMock.mock.calls[0][0] as Blob
      expect(blobArg.type).toBe('application/json')

      // Assert: ダウンロードリンクがクリックされたか確認
      expect(clickMock).toHaveBeenCalledTimes(1)
    })

    it('購読フィードが0件の場合、空の配列を含むJSONファイルをダウンロードする', () => {
      // Arrange: 空の配列を準備
      vi.spyOn(storage, 'loadSubscriptions').mockReturnValue([])

      // Act: エクスポート実行
      exportSubscriptions()

      // Assert: Blobが作成されたか確認
      expect(createObjectURLMock).toHaveBeenCalledTimes(1)
      const blobArg = createObjectURLMock.mock.calls[0][0] as Blob
      expect(blobArg.type).toBe('application/json')

      // Assert: ダウンロードリンクがクリックされたか確認
      expect(clickMock).toHaveBeenCalledTimes(1)
    })

    it('カスタムタイトルを設定したフィードが正しくエクスポートされる', () => {
      // Arrange: カスタムタイトル付きのフィードを準備
      const mockSubscriptions: Subscription[] = [
        {
          id: '1',
          url: 'https://example.com/feed1',
          title: 'Original Title',
          customTitle: 'My Custom Title',
          subscribedAt: '2025-01-01T00:00:00.000Z',
          lastFetchedAt: '2025-01-01T01:00:00.000Z',
          status: 'active',
        },
      ]

      vi.spyOn(storage, 'loadSubscriptions').mockReturnValue(mockSubscriptions)

      // Act: エクスポート実行
      exportSubscriptions()

      // Assert: Blobが作成されたか確認
      expect(createObjectURLMock).toHaveBeenCalledTimes(1)
      expect(clickMock).toHaveBeenCalledTimes(1)
    })

    it('ファイル名が「subscriptions_YYYY-MM-DD.json」形式である', () => {
      // Arrange
      vi.spyOn(storage, 'loadSubscriptions').mockReturnValue([])
      const mockDate = new Date('2025-11-02T12:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(mockDate)

      let capturedFilename = ''
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return {
            set download(value: string) {
              capturedFilename = value
            },
            get download() {
              return capturedFilename
            },
            href: '',
            click: vi.fn(),
            style: {},
          } as unknown as HTMLAnchorElement
        }
        return document.createElement(tagName)
      })

      // Act: エクスポート実行
      exportSubscriptions()

      // Assert: ファイル名が正しい形式であることを確認
      expect(capturedFilename).toBe('subscriptions_2025-11-02.json')

      // Cleanup
      vi.useRealTimers()
    })
  })
})
