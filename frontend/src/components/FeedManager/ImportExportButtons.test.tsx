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

  // User Story 1: 初回利用時のフィードインポート（Red Phase）
  describe('[US1] 購読フィード0件時のインポート機能', () => {
    it('[US1] subscriptionCountプロップを受け取れる', () => {
      // Arrange: 準備
      const mockOnExport = vi.fn()
      const mockOnImport = vi.fn()
      const subscriptionCount = 0

      // Act: 実行
      render(
        <ImportExportButtons
          onExport={mockOnExport}
          onImport={mockOnImport}
          subscriptionCount={subscriptionCount}
        />
      )

      // Assert: 検証
      expect(screen.getByRole('button', { name: /エクスポート/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /インポート/i })).toBeInTheDocument()
    })

    it('[US1] 購読フィード0件時にインポートボタンが表示される', () => {
      // Arrange: 準備
      const mockOnExport = vi.fn()
      const mockOnImport = vi.fn()
      const subscriptionCount = 0

      // Act: 実行
      render(
        <ImportExportButtons
          onExport={mockOnExport}
          onImport={mockOnImport}
          subscriptionCount={subscriptionCount}
        />
      )

      // Assert: 検証
      const importButton = screen.getByRole('button', { name: /インポート/i })
      expect(importButton).toBeInTheDocument()
    })

    it('[US1] 購読フィード0件時にインポートボタンがクリック可能', async () => {
      // Arrange: 準備
      const user = userEvent.setup()
      const mockOnExport = vi.fn()
      const mockOnImport = vi.fn()
      const subscriptionCount = 0

      // Act: 実行
      render(
        <ImportExportButtons
          onExport={mockOnExport}
          onImport={mockOnImport}
          subscriptionCount={subscriptionCount}
        />
      )
      const importButton = screen.getByRole('button', { name: /インポート/i })
      await user.click(importButton)

      // Assert: 検証
      expect(mockOnImport).toHaveBeenCalledTimes(1)
    })
  })

  // User Story 2: エクスポート機能の適切な無効化（Red Phase）
  describe('[US2] エクスポートボタンの無効化', () => {
    it('[US2] 購読フィード0件時にエクスポートボタンがdisabled状態', () => {
      // Arrange: 準備
      const mockOnExport = vi.fn()
      const mockOnImport = vi.fn()
      const subscriptionCount = 0

      // Act: 実行
      render(
        <ImportExportButtons
          onExport={mockOnExport}
          onImport={mockOnImport}
          subscriptionCount={subscriptionCount}
        />
      )

      // Assert: 検証
      const exportButton = screen.getByRole('button', { name: /エクスポート/i })
      expect(exportButton).toBeDisabled()
    })

    it('[US2] 購読フィード0件時にエクスポートボタンにopacity-50クラスが適用される', () => {
      // Arrange: 準備
      const mockOnExport = vi.fn()
      const mockOnImport = vi.fn()
      const subscriptionCount = 0

      // Act: 実行
      render(
        <ImportExportButtons
          onExport={mockOnExport}
          onImport={mockOnImport}
          subscriptionCount={subscriptionCount}
        />
      )

      // Assert: 検証
      const exportButton = screen.getByRole('button', { name: /エクスポート/i })
      expect(exportButton).toHaveClass('opacity-50')
    })

    it('[US2] 購読フィード0件時にエクスポートボタンにcursor-not-allowedクラスが適用される', () => {
      // Arrange: 準備
      const mockOnExport = vi.fn()
      const mockOnImport = vi.fn()
      const subscriptionCount = 0

      // Act: 実行
      render(
        <ImportExportButtons
          onExport={mockOnExport}
          onImport={mockOnImport}
          subscriptionCount={subscriptionCount}
        />
      )

      // Assert: 検証
      const exportButton = screen.getByRole('button', { name: /エクスポート/i })
      expect(exportButton).toHaveClass('cursor-not-allowed')
    })

    it('[US2] 購読フィード1件以上の時にエクスポートボタンが有効化される', () => {
      // Arrange: 準備
      const mockOnExport = vi.fn()
      const mockOnImport = vi.fn()
      const subscriptionCount = 1

      // Act: 実行
      render(
        <ImportExportButtons
          onExport={mockOnExport}
          onImport={mockOnImport}
          subscriptionCount={subscriptionCount}
        />
      )

      // Assert: 検証
      const exportButton = screen.getByRole('button', { name: /エクスポート/i })
      expect(exportButton).not.toBeDisabled()
      expect(exportButton).toHaveClass('hover:bg-blue-700')
    })
  })
})
