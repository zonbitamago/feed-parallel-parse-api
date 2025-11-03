import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewArticlesNotification } from './NewArticlesNotification'

describe('NewArticlesNotification', () => {
  it('基本的なプロップで正しくレンダリングされる', () => {
    // Arrange: 準備
    const onLoad = vi.fn()

    // Act: 実行
    render(
      <NewArticlesNotification
        visible={true}
        count={5}
        onLoad={onLoad}
      />
    )

    // Assert: 検証
    expect(screen.getByText(/新着記事があります/i)).toBeInTheDocument()
  })

  it('visible=trueで通知が表示される', () => {
    // Arrange: 準備
    const onLoad = vi.fn()

    // Act: 実行
    render(
      <NewArticlesNotification
        visible={true}
        count={3}
        onLoad={onLoad}
      />
    )

    // Assert: 検証
    expect(screen.getByText(/新着記事があります/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /読み込む/i })).toBeInTheDocument()
  })

  it('visible=falseで通知が非表示になる', () => {
    // Arrange: 準備
    const onLoad = vi.fn()

    // Act: 実行
    render(
      <NewArticlesNotification
        visible={false}
        count={3}
        onLoad={onLoad}
      />
    )

    // Assert: 検証
    expect(screen.queryByText(/新着記事があります/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /読み込む/i })).not.toBeInTheDocument()
  })

  it('count表示が正しく表示される（5件）', () => {
    // Arrange: 準備
    const onLoad = vi.fn()

    // Act: 実行
    render(
      <NewArticlesNotification
        visible={true}
        count={5}
        onLoad={onLoad}
      />
    )

    // Assert: 検証
    expect(screen.getByText('新着記事があります (5件)')).toBeInTheDocument()
  })

  it('count表示が正しく表示される（1件）', () => {
    // Arrange: 準備
    const onLoad = vi.fn()

    // Act: 実行
    render(
      <NewArticlesNotification
        visible={true}
        count={1}
        onLoad={onLoad}
      />
    )

    // Assert: 検証
    expect(screen.getByText('新着記事があります (1件)')).toBeInTheDocument()
  })

  it('「読み込む」ボタンクリック時にonLoadコールバックが呼ばれる', async () => {
    // Arrange: 準備
    const user = userEvent.setup()
    const onLoad = vi.fn()

    render(
      <NewArticlesNotification
        visible={true}
        count={3}
        onLoad={onLoad}
      />
    )

    // Act: 実行
    const button = screen.getByRole('button', { name: /読み込む/i })
    await user.click(button)

    // Assert: 検証
    expect(onLoad).toHaveBeenCalledTimes(1)
  })
})
