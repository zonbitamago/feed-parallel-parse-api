import { describe, it, expect } from 'vitest'
import { validateExportData } from './importValidation'
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
})
