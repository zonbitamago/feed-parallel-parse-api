import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UpdateNotification } from '../../src/components/UpdateNotification'

describe('UpdateNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when visible is false', () => {
    // このテストは失敗する（Red）- UpdateNotificationがまだ実装されていない
    const mockOnUpdate = vi.fn()
    render(<UpdateNotification visible={false} onUpdate={mockOnUpdate} />)

    expect(screen.queryByText(/新しいバージョン/i)).not.toBeInTheDocument()
  })

  it('should render notification when visible is true', () => {
    // このテストは失敗する（Red）
    const mockOnUpdate = vi.fn()
    render(<UpdateNotification visible={true} onUpdate={mockOnUpdate} />)

    expect(screen.getByText(/新しいバージョン/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /更新/i })).toBeInTheDocument()
  })

  it('should call onUpdate when update button is clicked', () => {
    // このテストは失敗する（Red）
    const mockOnUpdate = vi.fn()
    render(<UpdateNotification visible={true} onUpdate={mockOnUpdate} />)

    const updateButton = screen.getByRole('button', { name: /更新/i })
    fireEvent.click(updateButton)

    expect(mockOnUpdate).toHaveBeenCalledTimes(1)
  })

  it('should have proper accessibility attributes', () => {
    // このテストは失敗する（Red）
    const mockOnUpdate = vi.fn()
    render(<UpdateNotification visible={true} onUpdate={mockOnUpdate} />)

    const notification = screen.getByRole('status')
    expect(notification).toBeInTheDocument()
    expect(notification).toHaveAttribute('aria-live', 'polite')
  })

  it('should render with blue background and info icon', () => {
    // このテストは失敗する（Red）
    const mockOnUpdate = vi.fn()
    render(<UpdateNotification visible={true} onUpdate={mockOnUpdate} />)

    const notification = screen.getByRole('status')
    expect(notification.className).toContain('bg-blue')
  })
})
