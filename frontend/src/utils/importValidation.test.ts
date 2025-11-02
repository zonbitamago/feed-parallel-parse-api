import { describe, it, expect, vi } from 'vitest'
import { validateExportData, validateSubscription, readFileAsText } from './importValidation'
import type { ExportData, Subscription } from '../types/models'

describe('importValidation', () => {
  describe('validateExportData', () => {
    it('有効なExportDataの場合、エラーなしで成功する', () => {
      // Arrange: 正しい形式のExportData
      const validData: ExportData = {
        version: '1.0.0',
        exportedAt: '2025-11-02T00:00:00.000Z',
        subscriptions: [
          {
            id: '1',
            url: 'https://example.com/feed',
            title: 'Test Feed',
            customTitle: null,
            subscribedAt: '2025-11-02T00:00:00.000Z',
            lastFetchedAt: null,
            status: 'active',
          },
        ],
      }

      // Act
      const result = validateExportData(validData)

      // Assert
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('versionフィールドが欠けている場合、MISSING_REQUIRED_FIELDエラーを返す', () => {
      // Arrange: versionが欠けているデータ
      const invalidData = {
        exportedAt: '2025-11-02T00:00:00.000Z',
        subscriptions: [],
      }

      // Act
      const result = validateExportData(invalidData as ExportData)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error?.code).toBe('MISSING_REQUIRED_FIELD')
      expect(result.error?.details).toContain('version')
    })

    it('exportedAtフィールドが欠けている場合、MISSING_REQUIRED_FIELDエラーを返す', () => {
      // Arrange: exportedAtが欠けているデータ
      const invalidData = {
        version: '1.0.0',
        subscriptions: [],
      }

      // Act
      const result = validateExportData(invalidData as ExportData)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error?.code).toBe('MISSING_REQUIRED_FIELD')
      expect(result.error?.details).toContain('exportedAt')
    })

    it('subscriptionsフィールドが欠けている場合、MISSING_REQUIRED_FIELDエラーを返す', () => {
      // Arrange: subscriptionsが欠けているデータ
      const invalidData = {
        version: '1.0.0',
        exportedAt: '2025-11-02T00:00:00.000Z',
      }

      // Act
      const result = validateExportData(invalidData as ExportData)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error?.code).toBe('MISSING_REQUIRED_FIELD')
      expect(result.error?.details).toContain('subscriptions')
    })

    it('subscriptionsが配列でない場合、INVALID_SCHEMAエラーを返す', () => {
      // Arrange: subscriptionsが配列ではない
      const invalidData = {
        version: '1.0.0',
        exportedAt: '2025-11-02T00:00:00.000Z',
        subscriptions: 'not an array',
      }

      // Act
      const result = validateExportData(invalidData as unknown as ExportData)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error?.code).toBe('INVALID_SCHEMA')
      expect(result.error?.details).toContain('subscriptions')
    })

    it('versionが1.0.0以外の場合、INVALID_VERSIONエラーを返す', () => {
      // Arrange: サポートされていないバージョン
      const invalidData: ExportData = {
        version: '2.0.0',
        exportedAt: '2025-11-02T00:00:00.000Z',
        subscriptions: [],
      }

      // Act
      const result = validateExportData(invalidData)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error?.code).toBe('INVALID_VERSION')
      expect(result.error?.details).toContain('2.0.0')
    })

    it('空のsubscriptions配列の場合、エラーなしで成功する', () => {
      // Arrange: 空の配列
      const validData: ExportData = {
        version: '1.0.0',
        exportedAt: '2025-11-02T00:00:00.000Z',
        subscriptions: [],
      }

      // Act
      const result = validateExportData(validData)

      // Assert
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe('validateSubscription', () => {
    it('有効なSubscriptionの場合、エラーなしで成功する', () => {
      // Arrange: 正しい形式のSubscription
      const validSubscription: Subscription = {
        id: '1',
        url: 'https://example.com/feed',
        title: 'Test Feed',
        customTitle: null,
        subscribedAt: '2025-11-02T00:00:00.000Z',
        lastFetchedAt: '2025-11-02T01:00:00.000Z',
        status: 'active',
      }

      // Act
      const result = validateSubscription(validSubscription, 0)

      // Assert
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('urlフィールドが欠けている場合、MISSING_REQUIRED_FIELDエラーを返す', () => {
      // Arrange: urlが欠けているデータ
      const invalidSubscription = {
        id: '1',
        title: 'Test Feed',
        customTitle: null,
        subscribedAt: '2025-11-02T00:00:00.000Z',
        lastFetchedAt: null,
        status: 'active',
      }

      // Act
      const result = validateSubscription(invalidSubscription as Subscription, 0)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error?.code).toBe('MISSING_REQUIRED_FIELD')
      expect(result.error?.details).toContain('url')
      expect(result.error?.details).toContain('index 0')
    })

    it('statusフィールドが欠けている場合、MISSING_REQUIRED_FIELDエラーを返す', () => {
      // Arrange: statusが欠けているデータ
      const invalidSubscription = {
        id: '1',
        url: 'https://example.com/feed',
        title: 'Test Feed',
        customTitle: null,
        subscribedAt: '2025-11-02T00:00:00.000Z',
        lastFetchedAt: null,
      }

      // Act
      const result = validateSubscription(invalidSubscription as Subscription, 1)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error?.code).toBe('MISSING_REQUIRED_FIELD')
      expect(result.error?.details).toContain('status')
      expect(result.error?.details).toContain('index 1')
    })

    it('statusが"active"または"error"以外の場合、INVALID_SCHEMAエラーを返す', () => {
      // Arrange: 無効なstatus値
      const invalidSubscription = {
        id: '1',
        url: 'https://example.com/feed',
        title: 'Test Feed',
        customTitle: null,
        subscribedAt: '2025-11-02T00:00:00.000Z',
        lastFetchedAt: null,
        status: 'invalid',
      }

      // Act
      const result = validateSubscription(invalidSubscription as unknown as Subscription, 2)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error?.code).toBe('INVALID_SCHEMA')
      expect(result.error?.details).toContain('status')
      expect(result.error?.details).toContain('index 2')
    })

    it('urlが文字列でない場合、INVALID_SCHEMAエラーを返す', () => {
      // Arrange: urlが数値
      const invalidSubscription = {
        id: '1',
        url: 12345,
        title: 'Test Feed',
        customTitle: null,
        subscribedAt: '2025-11-02T00:00:00.000Z',
        lastFetchedAt: null,
        status: 'active',
      }

      // Act
      const result = validateSubscription(invalidSubscription as unknown as Subscription, 3)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error?.code).toBe('INVALID_SCHEMA')
      expect(result.error?.details).toContain('url')
      expect(result.error?.details).toContain('string')
      expect(result.error?.details).toContain('index 3')
    })

    it('titleがnullまたは文字列の場合、成功する', () => {
      // Arrange: titleがnull
      const subscription1: Subscription = {
        id: '1',
        url: 'https://example.com/feed',
        title: null,
        customTitle: null,
        subscribedAt: '2025-11-02T00:00:00.000Z',
        lastFetchedAt: null,
        status: 'active',
      }

      // Arrange: titleが文字列
      const subscription2: Subscription = {
        id: '2',
        url: 'https://example.com/feed2',
        title: 'Feed Title',
        customTitle: null,
        subscribedAt: '2025-11-02T00:00:00.000Z',
        lastFetchedAt: null,
        status: 'active',
      }

      // Act
      const result1 = validateSubscription(subscription1, 0)
      const result2 = validateSubscription(subscription2, 1)

      // Assert
      expect(result1.valid).toBe(true)
      expect(result2.valid).toBe(true)
    })

    it('customTitleがnullまたは文字列の場合、成功する', () => {
      // Arrange: customTitleがnull
      const subscription1: Subscription = {
        id: '1',
        url: 'https://example.com/feed',
        title: 'Feed Title',
        customTitle: null,
        subscribedAt: '2025-11-02T00:00:00.000Z',
        lastFetchedAt: null,
        status: 'active',
      }

      // Arrange: customTitleが文字列
      const subscription2: Subscription = {
        id: '2',
        url: 'https://example.com/feed2',
        title: 'Original Title',
        customTitle: 'Custom Title',
        subscribedAt: '2025-11-02T00:00:00.000Z',
        lastFetchedAt: null,
        status: 'active',
      }

      // Act
      const result1 = validateSubscription(subscription1, 0)
      const result2 = validateSubscription(subscription2, 1)

      // Assert
      expect(result1.valid).toBe(true)
      expect(result2.valid).toBe(true)
    })
  })

  describe('readFileAsText', () => {
    it('有効なJSONファイルを読み込み、テキスト内容を返す', async () => {
      // Arrange: モックJSONファイル
      const jsonContent = JSON.stringify({ version: '1.0.0' })
      const file = new File([jsonContent], 'test.json', { type: 'application/json' })

      // Act
      const result = await readFileAsText(file)

      // Assert
      expect(result.success).toBe(true)
      expect(result.text).toBe(jsonContent)
      expect(result.error).toBeUndefined()
    })

    it('ファイルサイズが1MBを超える場合、FILE_TOO_LARGEエラーを返す', async () => {
      // Arrange: 1MBを超えるファイル（1MB = 1048576バイト）
      const largeContent = 'a'.repeat(1048577)
      const file = new File([largeContent], 'large.json', { type: 'application/json' })

      // Act
      const result = await readFileAsText(file)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('FILE_TOO_LARGE')
    })

    it('JSONファイル以外を選択した場合、INVALID_FILE_TYPEエラーを返す', async () => {
      // Arrange: テキストファイル
      const file = new File(['plain text'], 'test.txt', { type: 'text/plain' })

      // Act
      const result = await readFileAsText(file)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INVALID_FILE_TYPE')
    })

    it('ファイル拡張子が.jsonの場合、MIMEタイプに関わらず読み込む', async () => {
      // Arrange: MIMEタイプがtext/plainだが拡張子は.json
      const jsonContent = JSON.stringify({ test: 'data' })
      const file = new File([jsonContent], 'test.json', { type: 'text/plain' })

      // Act
      const result = await readFileAsText(file)

      // Assert
      expect(result.success).toBe(true)
      expect(result.text).toBe(jsonContent)
    })

    it('FileReaderエラー発生時、FILE_READ_ERRORエラーを返す', async () => {
      // Arrange: FileReader.readAsTextをモックしてエラーを発生させる
      const file = new File(['test'], 'test.json', { type: 'application/json' })

      const mockFileReader = {
        readAsText: vi.fn(),
        addEventListener: vi.fn((event: string, handler: EventListener) => {
          if (event === 'error') {
            // エラーハンドラを即座に呼び出す
            setTimeout(() => handler(new Event('error')), 0)
          }
        }),
        error: new Error('FileReader error'),
      }

      vi.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader)

      // Act
      const result = await readFileAsText(file)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('FILE_READ_ERROR')

      // Cleanup
      vi.restoreAllMocks()
    })
  })
})
