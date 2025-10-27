import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// localStorageのモックを設定
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    },
  }
})()

// グローバルにlocalStorageを即座に設定（MSWのインポートより前に必要）
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup()
  localStorageMock.clear()
})
