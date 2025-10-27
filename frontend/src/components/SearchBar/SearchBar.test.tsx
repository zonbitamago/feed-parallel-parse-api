import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from './SearchBar'

describe('SearchBar', () => {
  it('検索入力欄をレンダリングする', () => {
    render(<SearchBar onSearch={() => {}} />)

    const input = screen.getByPlaceholderText(/検索/i)
    expect(input).toBeInTheDocument()
  })

  it('入力時にonSearchを呼び出す', async () => {
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

  it('検索入力を300msでデバウンスする', async () => {
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

  it('クリアボタンをクリックすると検索をクリアする', async () => {
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

  it('入力が空の場合はクリアボタンを表示しない', () => {
    render(<SearchBar onSearch={() => {}} />)

    const clearButton = screen.queryByRole('button', { name: /クリア/i })
    expect(clearButton).not.toBeInTheDocument()
  })

  it('入力に値がある場合はクリアボタンを表示する', async () => {
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
