import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useImportExport } from './useImportExport'
import * as importExportService from '../services/importExport.service'

// モック化
vi.mock('../services/importExport.service', () => ({
  exportSubscriptions: vi.fn(),
  importSubscriptions: vi.fn(),
}))

describe('useImportExport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handleExportを呼ぶとexportSubscriptionsが実行される', () => {
    // Arrange
    const { result } = renderHook(() => useImportExport())

    // Act
    act(() => {
      result.current.handleExport()
    })

    // Assert
    expect(importExportService.exportSubscriptions).toHaveBeenCalledTimes(1)
  })

  it('handleImportを呼ぶとファイル選択ダイアログが開く', () => {
    // Arrange
    const { result } = renderHook(() => useImportExport())
    const mockClick = vi.fn()

    // document.createElement をモック
    const mockInput = document.createElement('input')
    mockInput.click = mockClick
    vi.spyOn(document, 'createElement').mockReturnValue(mockInput as HTMLInputElement)

    // Act
    act(() => {
      result.current.handleImport()
    })

    // Assert
    expect(mockClick).toHaveBeenCalledTimes(1)
  })

  it('ファイル選択後にimportSubscriptionsが呼ばれる', async () => {
    // Arrange
    const mockFile = new File(['test'], 'test.json', { type: 'application/json' })
    const { result } = renderHook(() => useImportExport())

    vi.mocked(importExportService.importSubscriptions).mockResolvedValue({
      success: true,
      addedCount: 2,
      skippedCount: 1,
      message: '2件のフィードを追加しました（1件はスキップ）',
    })

    // Act
    act(() => {
      result.current.handleImport()
    })

    // ファイル選択をシミュレート
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const fileList = {
      0: mockFile,
      length: 1,
      item: () => mockFile,
    } as unknown as FileList

    // 既存のfilesプロパティを削除してから再定義
    delete (input as any).files
    Object.defineProperty(input, 'files', {
      value: fileList,
      writable: true,
      configurable: true,
    })

    await act(async () => {
      const event = new Event('change', { bubbles: true })
      input.dispatchEvent(event)
    })

    // Assert
    expect(importExportService.importSubscriptions).toHaveBeenCalledWith(mockFile)
  })

  it('インポート成功時にonSuccessコールバックが呼ばれる', async () => {
    // Arrange
    const mockOnSuccess = vi.fn()
    const mockFile = new File(['test'], 'test.json', { type: 'application/json' })
    const { result } = renderHook(() => useImportExport({ onSuccess: mockOnSuccess }))

    vi.mocked(importExportService.importSubscriptions).mockResolvedValue({
      success: true,
      addedCount: 2,
      skippedCount: 1,
      message: '2件のフィードを追加しました（1件はスキップ）',
    })

    // Act
    act(() => {
      result.current.handleImport()
    })

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const fileList = {
      0: mockFile,
      length: 1,
      item: () => mockFile,
    } as unknown as FileList

    delete (input as any).files
    Object.defineProperty(input, 'files', {
      value: fileList,
      writable: true,
      configurable: true,
    })

    await act(async () => {
      const event = new Event('change', { bubbles: true })
      input.dispatchEvent(event)
    })

    // Assert
    expect(mockOnSuccess).toHaveBeenCalledWith('2件のフィードを追加しました（1件はスキップ）')
  })

  it('インポート失敗時にonErrorコールバックが呼ばれる', async () => {
    // Arrange
    const mockOnError = vi.fn()
    const mockFile = new File(['test'], 'test.json', { type: 'application/json' })
    const { result } = renderHook(() => useImportExport({ onError: mockOnError }))

    vi.mocked(importExportService.importSubscriptions).mockResolvedValue({
      success: false,
      addedCount: 0,
      skippedCount: 0,
      message: '',
      error: 'ファイル形式が正しくありません',
    })

    // Act
    act(() => {
      result.current.handleImport()
    })

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const fileList = {
      0: mockFile,
      length: 1,
      item: () => mockFile,
    } as unknown as FileList

    delete (input as any).files
    Object.defineProperty(input, 'files', {
      value: fileList,
      writable: true,
      configurable: true,
    })

    await act(async () => {
      const event = new Event('change', { bubbles: true })
      input.dispatchEvent(event)
    })

    // Assert
    expect(mockOnError).toHaveBeenCalledWith('ファイル形式が正しくありません')
  })
})
