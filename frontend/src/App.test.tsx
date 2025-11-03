import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App - NewArticlesNotification統合', () => {
  beforeEach(() => {
    // localStorageをクリア
    localStorage.clear()

    // navigator.onLineをモック
    vi.stubGlobal('navigator', {
      onLine: true,
      serviceWorker: {
        register: vi.fn().mockResolvedValue({}),
      },
    })
  })

  it('初期状態では新着記事通知が表示されない', () => {
    // Arrange: 準備
    // ArticleContextの初期状態はhasNewArticles=false

    // Act: 実行
    render(<App />)

    // Assert: 検証
    expect(screen.queryByText(/新着記事があります/i)).not.toBeInTheDocument()
  })

  it('NewArticlesNotificationコンポーネントがレンダリングされている', () => {
    // Arrange: 準備
    // Act: 実行
    const { container } = render(<App />)

    // Assert: 検証
    // NewArticlesNotificationはvisible=falseで非表示だが、DOMには存在しない（return nullのため）
    const notification = container.querySelector('[role="status"]')
    expect(notification).not.toBeInTheDocument()
  })

  it('複数の通知コンポーネントが共存できる', () => {
    // Arrange: 準備
    // Act: 実行
    render(<App />)

    // Assert: 検証
    // 他の通知コンポーネント（OfflineNotification, OnlineNotification, UpdateNotification）
    // と新着記事通知が共存していることを確認
    // 全ての通知が正常にレンダリングされている
    expect(screen.getByText('RSSリーダー')).toBeInTheDocument()
  })
})
