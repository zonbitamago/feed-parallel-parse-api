import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { ImportExportButtons } from './ImportExportButtons'

describe('ImportExportButtons', () => {
  it('エクスポートボタンとインポートボタンが表示される', () => {
    // Arrange
    const mockOnExport = vi.fn()
    const mockOnImport = vi.fn()

    // Act
    render(<ImportExportButtons onExport={mockOnExport} onImport={mockOnImport} />)

    // Assert
    expect(screen.getByRole('button', { name: /エクスポート/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /インポート/i })).toBeInTheDocument()
  })

  it('エクスポートボタンをクリックするとonExportが呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockOnExport = vi.fn()
    const mockOnImport = vi.fn()

    // Act
    render(<ImportExportButtons onExport={mockOnExport} onImport={mockOnImport} />)
    const exportButton = screen.getByRole('button', { name: /エクスポート/i })
    await user.click(exportButton)

    // Assert
    expect(mockOnExport).toHaveBeenCalledTimes(1)
    expect(mockOnImport).not.toHaveBeenCalled()
  })

  it('インポートボタンをクリックするとonImportが呼ばれる', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockOnExport = vi.fn()
    const mockOnImport = vi.fn()

    // Act
    render(<ImportExportButtons onExport={mockOnExport} onImport={mockOnImport} />)
    const importButton = screen.getByRole('button', { name: /インポート/i })
    await user.click(importButton)

    // Assert
    expect(mockOnImport).toHaveBeenCalledTimes(1)
    expect(mockOnExport).not.toHaveBeenCalled()
  })

  it('ボタンが正しいスタイルで表示される', () => {
    // Arrange
    const mockOnExport = vi.fn()
    const mockOnImport = vi.fn()

    // Act
    render(<ImportExportButtons onExport={mockOnExport} onImport={mockOnImport} />)

    const exportButton = screen.getByRole('button', { name: /エクスポート/i })
    const importButton = screen.getByRole('button', { name: /インポート/i })

    // Assert: ボタンが表示されていることを確認（スタイルの詳細は実装後に調整）
    expect(exportButton).toBeVisible()
    expect(importButton).toBeVisible()
  })
})
