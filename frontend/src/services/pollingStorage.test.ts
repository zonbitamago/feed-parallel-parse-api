import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadPollingConfig, savePollingConfig, STORAGE_KEY } from './pollingStorage'

describe('pollingStorage', () => {
  beforeEach(() => {
    // 各テストの前にlocalStorageをクリア
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('loadPollingConfig', () => {
    it('localStorageにデータがない場合はデフォルト設定を返す', () => {
      // Arrange: 準備
      // localStorageは空（beforeEachでクリア済み）

      // Act: 実行
      const result = loadPollingConfig()

      // Assert: 検証
      expect(result).toEqual({
        lastPolledAt: null,
        pollingInterval: 600000, // 10分
        enabled: true,
      })
    })

    it('localStorageから正しい設定を読み込む', () => {
      // Arrange: 準備
      const savedConfig = {
        lastPolledAt: 1699000000000,
        pollingInterval: 600000,
        enabled: true,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedConfig))

      // Act: 実行
      const result = loadPollingConfig()

      // Assert: 検証
      expect(result).toEqual(savedConfig)
    })

    it('localStorageのJSONが不正な場合はデフォルト設定を返す', () => {
      // Arrange: 準備
      localStorage.setItem(STORAGE_KEY, 'invalid-json')

      // Act: 実行
      const result = loadPollingConfig()

      // Assert: 検証
      expect(result).toEqual({
        lastPolledAt: null,
        pollingInterval: 600000,
        enabled: true,
      })
    })

    it('pollingIntervalが不正な値の場合はデフォルト値を使用', () => {
      // Arrange: 準備
      const invalidConfig = {
        lastPolledAt: null,
        pollingInterval: -1, // 不正な値
        enabled: true,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidConfig))

      // Act: 実行
      const result = loadPollingConfig()

      // Assert: 検証
      expect(result.pollingInterval).toBe(600000) // デフォルト値
    })

    it('enabledがboolean以外の場合はデフォルト値を使用', () => {
      // Arrange: 準備
      const invalidConfig = {
        lastPolledAt: null,
        pollingInterval: 600000,
        enabled: 'yes', // 不正な値
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidConfig))

      // Act: 実行
      const result = loadPollingConfig()

      // Assert: 検証
      expect(result.enabled).toBe(true) // デフォルト値
    })

    it('lastPolledAtがnumberでない場合はnullを使用', () => {
      // Arrange: 準備
      const invalidConfig = {
        lastPolledAt: 'invalid', // 不正な値
        pollingInterval: 600000,
        enabled: true,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidConfig))

      // Act: 実行
      const result = loadPollingConfig()

      // Assert: 検証
      expect(result.lastPolledAt).toBe(null)
    })
  })

  describe('savePollingConfig', () => {
    it('設定をlocalStorageに保存する', () => {
      // Arrange: 準備
      const config = {
        lastPolledAt: 1699000000000,
        pollingInterval: 600000,
        enabled: true,
      }

      // Act: 実行
      savePollingConfig(config)

      // Assert: 検証
      const saved = localStorage.getItem(STORAGE_KEY)
      expect(saved).toBe(JSON.stringify(config))
    })

    it('lastPolledAtがnullの設定も保存できる', () => {
      // Arrange: 準備
      const config = {
        lastPolledAt: null,
        pollingInterval: 600000,
        enabled: false,
      }

      // Act: 実行
      savePollingConfig(config)

      // Assert: 検証
      const saved = localStorage.getItem(STORAGE_KEY)
      expect(saved).toBe(JSON.stringify(config))
    })

    it('localStorageエラー時もエラーをスローしない', () => {
      // Arrange: 準備
      const config = {
        lastPolledAt: null,
        pollingInterval: 600000,
        enabled: true,
      }
      // localStorageをモックしてエラーをスロー
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('QuotaExceededError')
      })

      // Act & Assert: 実行と検証
      expect(() => savePollingConfig(config)).not.toThrow()
    })
  })
})
