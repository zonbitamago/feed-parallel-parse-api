import { describe, it, expect } from 'vitest'
import { validateExportData, validateSubscription } from './importValidation'
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
})
