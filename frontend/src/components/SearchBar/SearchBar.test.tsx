import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from './SearchBar'

describe('SearchBar', () => {
  it('should render search input', () => {
    render(<SearchBar onSearch={() => {}} />)

    const input = screen.getByPlaceholderText(/検索/i)
    expect(input).toBeInTheDocument()
  })

  it('should call onSearch when typing', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()

    render(<SearchBar onSearch={onSearch} />)

    const input = screen.getByPlaceholderText(/検索/i)
    await user.type(input, 'react')

    // デバウンス（300ms）後に呼ばれる
    await vi.waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('react')
    }, { timeout: 500 })
  })

  it('should debounce search input (300ms)', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()

    render(<SearchBar onSearch={onSearch} />)

    const input = screen.getByPlaceholderText(/検索/i)

    // 連続入力
    await user.type(input, 'r')
    await user.type(input, 'e')
    await user.type(input, 'a')

    // デバウンス中は呼ばれない
    expect(onSearch).not.toHaveBeenCalled()

    // 300ms待機
    await vi.waitFor(() => {
      expect(onSearch).toHaveBeenCalledTimes(1)
      expect(onSearch).toHaveBeenCalledWith('rea')
    }, { timeout: 500 })
  })

  it('should clear search when clicking clear button', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()

    render(<SearchBar onSearch={onSearch} />)

    const input = screen.getByPlaceholderText(/検索/i) as HTMLInputElement
    await user.type(input, 'react')

    // クリアボタンが表示される
    await vi.waitFor(() => {
      const clearButton = screen.getByRole('button', { name: /クリア/i })
      expect(clearButton).toBeInTheDocument()
    }, { timeout: 500 })

    const clearButton = screen.getByRole('button', { name: /クリア/i })
    await user.click(clearButton)

    // 入力がクリアされる
    expect(input.value).toBe('')

    // onSearchが空文字で呼ばれる
    await vi.waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('')
    }, { timeout: 500 })
  })

  it('should not show clear button when input is empty', () => {
    render(<SearchBar onSearch={() => {}} />)

    const clearButton = screen.queryByRole('button', { name: /クリア/i })
    expect(clearButton).not.toBeInTheDocument()
  })

  it('should show clear button when input has value', async () => {
    const user = userEvent.setup()

    render(<SearchBar onSearch={() => {}} />)

    const input = screen.getByPlaceholderText(/検索/i)
    await user.type(input, 'react')

    await vi.waitFor(() => {
      const clearButton = screen.queryByRole('button', { name: /クリア/i })
      expect(clearButton).toBeInTheDocument()
    }, { timeout: 500 })
  })
})
