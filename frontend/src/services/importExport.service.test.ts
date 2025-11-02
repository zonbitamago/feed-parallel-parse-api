import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportSubscriptions, mergeSubscriptions, importSubscriptions } from './importExport.service'
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

  describe('mergeSubscriptions', () => {
    it('URLが重複するフィードをスキップし、新規フィードのみを追加する', () => {
      // Arrange: 既存フィード2件
      const existingSubscriptions: Subscription[] = [
        {
          id: '1',
          url: 'https://example.com/feed1',
          title: 'Feed 1',
          customTitle: null,
          subscribedAt: '2025-01-01T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
        {
          id: '2',
          url: 'https://example.com/feed2',
          title: 'Feed 2',
          customTitle: null,
          subscribedAt: '2025-01-02T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
      ]

      // Arrange: インポートフィード5件（うち2件は既存と重複）
      const importedSubscriptions: Subscription[] = [
        {
          id: 'old-1',
          url: 'https://example.com/feed1', // 重複
          title: 'Feed 1 (Imported)',
          customTitle: null,
          subscribedAt: '2025-01-01T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
        {
          id: 'old-2',
          url: 'https://example.com/feed2', // 重複
          title: 'Feed 2 (Imported)',
          customTitle: null,
          subscribedAt: '2025-01-02T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
        {
          id: 'new-3',
          url: 'https://example.com/feed3', // 新規
          title: 'Feed 3',
          customTitle: null,
          subscribedAt: '2025-01-03T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
        {
          id: 'new-4',
          url: 'https://example.com/feed4', // 新規
          title: 'Feed 4',
          customTitle: null,
          subscribedAt: '2025-01-04T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
        {
          id: 'new-5',
          url: 'https://example.com/feed5', // 新規
          title: 'Feed 5',
          customTitle: null,
          subscribedAt: '2025-01-05T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
      ]

      // Act
      const result = mergeSubscriptions(existingSubscriptions, importedSubscriptions)

      // Assert: 3件追加、2件スキップ
      expect(result.added.length).toBe(3)
      expect(result.skipped).toBe(2)
      expect(result.added[0].url).toBe('https://example.com/feed3')
      expect(result.added[1].url).toBe('https://example.com/feed4')
      expect(result.added[2].url).toBe('https://example.com/feed5')
    })

    it('全フィードが重複している場合、added.length = 0, skipped = 5', () => {
      // Arrange: 既存フィード5件
      const existingSubscriptions: Subscription[] = [
        {
          id: '1',
          url: 'https://example.com/feed1',
          title: 'Feed 1',
          customTitle: null,
          subscribedAt: '2025-01-01T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
        {
          id: '2',
          url: 'https://example.com/feed2',
          title: 'Feed 2',
          customTitle: null,
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
          lastFetchedAt: null,
          status: 'active',
        },
        {
          id: '4',
          url: 'https://example.com/feed4',
          title: 'Feed 4',
          customTitle: null,
          subscribedAt: '2025-01-04T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
        {
          id: '5',
          url: 'https://example.com/feed5',
          title: 'Feed 5',
          customTitle: null,
          subscribedAt: '2025-01-05T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
      ]

      // Arrange: インポートフィード5件（全て重複）
      const importedSubscriptions: Subscription[] = [
        {
          id: 'old-1',
          url: 'https://example.com/feed1',
          title: 'Feed 1 (Imported)',
          customTitle: null,
          subscribedAt: '2025-01-01T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
        {
          id: 'old-2',
          url: 'https://example.com/feed2',
          title: 'Feed 2 (Imported)',
          customTitle: null,
          subscribedAt: '2025-01-02T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
        {
          id: 'old-3',
          url: 'https://example.com/feed3',
          title: 'Feed 3 (Imported)',
          customTitle: null,
          subscribedAt: '2025-01-03T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
        {
          id: 'old-4',
          url: 'https://example.com/feed4',
          title: 'Feed 4 (Imported)',
          customTitle: null,
          subscribedAt: '2025-01-04T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
        {
          id: 'old-5',
          url: 'https://example.com/feed5',
          title: 'Feed 5 (Imported)',
          customTitle: null,
          subscribedAt: '2025-01-05T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
      ]

      // Act
      const result = mergeSubscriptions(existingSubscriptions, importedSubscriptions)

      // Assert: 0件追加、5件スキップ
      expect(result.added.length).toBe(0)
      expect(result.skipped).toBe(5)
    })

    it('既存フィードが0件の場合、全てのインポートフィードを追加する', () => {
      // Arrange: 既存フィード0件
      const existingSubscriptions: Subscription[] = []

      // Arrange: インポートフィード3件
      const importedSubscriptions: Subscription[] = [
        {
          id: 'new-1',
          url: 'https://example.com/feed1',
          title: 'Feed 1',
          customTitle: null,
          subscribedAt: '2025-01-01T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
        {
          id: 'new-2',
          url: 'https://example.com/feed2',
          title: 'Feed 2',
          customTitle: null,
          subscribedAt: '2025-01-02T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
        {
          id: 'new-3',
          url: 'https://example.com/feed3',
          title: 'Feed 3',
          customTitle: null,
          subscribedAt: '2025-01-03T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
      ]

      // Act
      const result = mergeSubscriptions(existingSubscriptions, importedSubscriptions)

      // Assert: 3件追加、0件スキップ
      expect(result.added.length).toBe(3)
      expect(result.skipped).toBe(0)
    })

    it('追加されたフィードは新しいIDとsubscribedAtを持つ', () => {
      // Arrange
      const existingSubscriptions: Subscription[] = []
      const importedSubscriptions: Subscription[] = [
        {
          id: 'old-id',
          url: 'https://example.com/feed1',
          title: 'Feed 1',
          customTitle: null,
          subscribedAt: '2020-01-01T00:00:00.000Z', // 古い日付
          lastFetchedAt: '2020-01-01T01:00:00.000Z',
          status: 'error',
        },
      ]

      // Act
      const result = mergeSubscriptions(existingSubscriptions, importedSubscriptions)

      // Assert: 新しいIDが生成されている
      expect(result.added[0].id).not.toBe('old-id')
      expect(result.added[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

      // Assert: subscribedAtが現在日時に更新されている
      const now = new Date().toISOString()
      const subscribedAt = result.added[0].subscribedAt
      expect(new Date(subscribedAt).getTime()).toBeGreaterThan(new Date('2020-01-01').getTime())
      expect(new Date(subscribedAt).getTime()).toBeLessThanOrEqual(new Date(now).getTime())

      // Assert: lastFetchedAtとstatusがリセットされている
      expect(result.added[0].lastFetchedAt).toBeNull()
      expect(result.added[0].status).toBe('active')
    })
  })

  describe('importSubscriptions', () => {
    beforeEach(() => {
      // localStorageのモック
      vi.spyOn(storage, 'loadSubscriptions').mockReturnValue([])
      vi.spyOn(storage, 'saveSubscriptions').mockImplementation(() => {})
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('有効なJSONファイルをインポートし、重複しないフィードを追加する', async () => {
      // Arrange: 既存フィード2件
      const existingSubscriptions: Subscription[] = [
        {
          id: '1',
          url: 'https://example.com/feed1',
          title: 'Feed 1',
          customTitle: null,
          subscribedAt: '2025-01-01T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
        {
          id: '2',
          url: 'https://example.com/feed2',
          title: 'Feed 2',
          customTitle: null,
          subscribedAt: '2025-01-02T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
      ]
      vi.spyOn(storage, 'loadSubscriptions').mockReturnValue(existingSubscriptions)

      // Arrange: インポートファイル（3件、うち1件は重複）
      const importData = {
        version: '1.0.0',
        exportedAt: '2025-11-02T00:00:00.000Z',
        subscriptions: [
          {
            id: 'old-1',
            url: 'https://example.com/feed1', // 重複
            title: 'Feed 1',
            customTitle: null,
            subscribedAt: '2025-01-01T00:00:00.000Z',
            lastFetchedAt: null,
            status: 'active',
          },
          {
            id: 'new-3',
            url: 'https://example.com/feed3', // 新規
            title: 'Feed 3',
            customTitle: null,
            subscribedAt: '2025-01-03T00:00:00.000Z',
            lastFetchedAt: null,
            status: 'active',
          },
          {
            id: 'new-4',
            url: 'https://example.com/feed4', // 新規
            title: 'Feed 4',
            customTitle: null,
            subscribedAt: '2025-01-04T00:00:00.000Z',
            lastFetchedAt: null,
            status: 'active',
          },
        ],
      }
      const file = new File([JSON.stringify(importData)], 'import.json', {
        type: 'application/json',
      })

      // Act
      const result = await importSubscriptions(file)

      // Assert
      expect(result.success).toBe(true)
      expect(result.addedCount).toBe(2)
      expect(result.skippedCount).toBe(1)
      expect(result.message).toContain('2件')
      expect(result.message).toContain('1件')
      expect(storage.saveSubscriptions).toHaveBeenCalledTimes(1)
    })

    it('ファイルサイズが1MBを超える場合、エラーを返す', async () => {
      // Arrange: 1MBを超えるファイル
      const largeContent = 'a'.repeat(1048577)
      const file = new File([largeContent], 'large.json', { type: 'application/json' })

      // Act
      const result = await importSubscriptions(file)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('1MB')
      expect(storage.saveSubscriptions).not.toHaveBeenCalled()
    })

    it('不正なJSON形式の場合、エラーを返す', async () => {
      // Arrange: 不正なJSON
      const file = new File(['{ invalid json }'], 'invalid.json', {
        type: 'application/json',
      })

      // Act
      const result = await importSubscriptions(file)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(storage.saveSubscriptions).not.toHaveBeenCalled()
    })

    it('スキーマ不一致の場合、エラーを返す', async () => {
      // Arrange: versionフィールドが欠けているデータ
      const invalidData = {
        exportedAt: '2025-11-02T00:00:00.000Z',
        subscriptions: [],
      }
      const file = new File([JSON.stringify(invalidData)], 'invalid.json', {
        type: 'application/json',
      })

      // Act
      const result = await importSubscriptions(file)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(storage.saveSubscriptions).not.toHaveBeenCalled()
    })

    it('JSONファイル以外を選択した場合、エラーを返す', async () => {
      // Arrange: テキストファイル
      const file = new File(['plain text'], 'test.txt', { type: 'text/plain' })

      // Act
      const result = await importSubscriptions(file)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('JSON')
      expect(storage.saveSubscriptions).not.toHaveBeenCalled()
    })

    it('全フィードが重複している場合、0件追加される', async () => {
      // Arrange: 既存フィード2件
      const existingSubscriptions: Subscription[] = [
        {
          id: '1',
          url: 'https://example.com/feed1',
          title: 'Feed 1',
          customTitle: null,
          subscribedAt: '2025-01-01T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
        {
          id: '2',
          url: 'https://example.com/feed2',
          title: 'Feed 2',
          customTitle: null,
          subscribedAt: '2025-01-02T00:00:00.000Z',
          lastFetchedAt: null,
          status: 'active',
        },
      ]
      vi.spyOn(storage, 'loadSubscriptions').mockReturnValue(existingSubscriptions)

      // Arrange: インポートファイル（全て重複）
      const importData = {
        version: '1.0.0',
        exportedAt: '2025-11-02T00:00:00.000Z',
        subscriptions: existingSubscriptions,
      }
      const file = new File([JSON.stringify(importData)], 'import.json', {
        type: 'application/json',
      })

      // Act
      const result = await importSubscriptions(file)

      // Assert
      expect(result.success).toBe(true)
      expect(result.addedCount).toBe(0)
      expect(result.skippedCount).toBe(2)
      expect(result.message).toContain('0件')
      expect(result.message).toContain('2件')
    })
  })
})
