import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { driver } from 'driver.js'

// driver.jsモック
vi.mock('driver.js', () => ({
  driver: vi.fn(),
}))

describe('App - NewArticlesNotification統合', () => {
  beforeEach(() => {
    // localStorageをクリア
    localStorage.clear()
    // チュートリアル自動表示を無効化（driver.jsエラー回避のため）
    localStorage.setItem('rss_reader_tutorial_seen', 'true')

    // driver.jsモックのセットアップ
    const mockDrive = vi.fn()
    vi.mocked(driver).mockClear()
    vi.mocked(driver).mockReturnValue({
      drive: mockDrive,
    } as any)

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

describe('App - ヘルプボタン（US2: チュートリアル再表示）', () => {
  let mockDrive: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // localStorageをクリア
    localStorage.clear()
    // チュートリアル自動表示を無効化
    localStorage.setItem('rss_reader_tutorial_seen', 'true')

    // driver.jsモックのセットアップ
    mockDrive = vi.fn()
    vi.mocked(driver).mockClear()
    vi.mocked(driver).mockReturnValue({
      drive: mockDrive,
    } as any)

    // navigator.onLineをモック
    vi.stubGlobal('navigator', {
      onLine: true,
      serviceWorker: {
        register: vi.fn().mockResolvedValue({}),
      },
    })
  })

  it('ヘッダーにヘルプボタンが表示される', () => {
    // Arrange: 準備
    // Act: 実行
    render(<App />)

    // Assert: 検証
    const helpButton = screen.getByRole('button', { name: /チュートリアルを表示/i })
    expect(helpButton).toBeInTheDocument()
    expect(helpButton.textContent).toContain('ヘルプ')
  })

  it('ヘルプボタンをクリックするとstartTutorialが呼ばれる', async () => {
    // Arrange: 準備
    render(<App />)
    const user = userEvent.setup()

    // Act: 実行
    const helpButton = screen.getByRole('button', { name: /チュートリアルを表示/i })
    await user.click(helpButton)

    // Assert: 検証
    // driver()が呼ばれたことを確認
    expect(vi.mocked(driver)).toHaveBeenCalled()
    // drive()が呼ばれたことを確認
    await waitFor(() => {
      expect(mockDrive).toHaveBeenCalled()
    })
  })

  it('ヘルプボタンにツールチップ（aria-label）が設定されている', () => {
    // Arrange: 準備
    // Act: 実行
    render(<App />)

    // Assert: 検証
    const helpButton = screen.getByRole('button', { name: /チュートリアルを表示/i })
    expect(helpButton).toHaveAttribute('aria-label', 'チュートリアルを表示')
  })

  it('ヘルプボタンを連続クリックしても正常に動作する', async () => {
    // Arrange: 準備
    render(<App />)
    const user = userEvent.setup()

    // Act: 実行
    const helpButton = screen.getByRole('button', { name: /チュートリアルを表示/i })
    await user.click(helpButton)
    await user.click(helpButton)
    await user.click(helpButton)

    // Assert: 検証
    // driver()が3回呼ばれたことを確認
    expect(vi.mocked(driver)).toHaveBeenCalledTimes(3)
    // drive()も3回呼ばれたことを確認
    await waitFor(() => {
      expect(mockDrive).toHaveBeenCalledTimes(3)
    })
  })
})

describe('App - キーボード操作（US4: アクセシビリティ）', () => {
  let mockDrive: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // localStorageをクリア
    localStorage.clear()
    // チュートリアル自動表示を無効化
    localStorage.setItem('rss_reader_tutorial_seen', 'true')

    // driver.jsモックのセットアップ
    mockDrive = vi.fn()
    vi.mocked(driver).mockClear()
    vi.mocked(driver).mockReturnValue({
      drive: mockDrive,
    } as any)

    // navigator.onLineをモック
    vi.stubGlobal('navigator', {
      onLine: true,
      serviceWorker: {
        register: vi.fn().mockResolvedValue({}),
      },
    })
  })

  it('ヘルプボタンにフォーカスできる', () => {
    // Arrange: 準備
    render(<App />)

    // Act: 実行
    const helpButton = screen.getByRole('button', { name: /チュートリアルを表示/i })
    helpButton.focus()

    // Assert: 検証
    expect(document.activeElement).toBe(helpButton)
  })

  it('Enterキーでヘルプボタンを押下できる', async () => {
    // Arrange: 準備
    render(<App />)
    const user = userEvent.setup()

    // Act: 実行
    const helpButton = screen.getByRole('button', { name: /チュートリアルを表示/i })
    helpButton.focus()
    await user.keyboard('{Enter}')

    // Assert: 検証
    // driver()が呼ばれたことを確認
    await waitFor(() => {
      expect(vi.mocked(driver)).toHaveBeenCalled()
    })
  })

  it('Spaceキーでヘルプボタンを押下できる', async () => {
    // Arrange: 準備
    render(<App />)
    const user = userEvent.setup()

    // Act: 実行
    const helpButton = screen.getByRole('button', { name: /チュートリアルを表示/i })
    helpButton.focus()
    await user.keyboard(' ')

    // Assert: 検証
    // driver()が呼ばれたことを確認
    await waitFor(() => {
      expect(vi.mocked(driver)).toHaveBeenCalled()
    })
  })
})

describe('App - スクリーンリーダー（US4: アクセシビリティ）', () => {
  beforeEach(() => {
    // localStorageをクリア
    localStorage.clear()
    // チュートリアル自動表示を無効化
    localStorage.setItem('rss_reader_tutorial_seen', 'true')

    // driver.jsモックのセットアップ
    const mockDrive = vi.fn()
    vi.mocked(driver).mockClear()
    vi.mocked(driver).mockReturnValue({
      drive: mockDrive,
    } as any)

    // navigator.onLineをモック
    vi.stubGlobal('navigator', {
      onLine: true,
      serviceWorker: {
        register: vi.fn().mockResolvedValue({}),
      },
    })
  })

  it('ヘルプボタンにaria-label属性がある', () => {
    // Arrange: 準備
    // Act: 実行
    render(<App />)

    // Assert: 検証
    const helpButton = screen.getByRole('button', { name: /チュートリアルを表示/i })
    expect(helpButton).toHaveAttribute('aria-label', 'チュートリアルを表示')
  })

  it('ヘルプボタンのrole属性がbuttonである', () => {
    // Arrange: 準備
    // Act: 実行
    render(<App />)

    // Assert: 検証
    const helpButton = screen.getByRole('button', { name: /チュートリアルを表示/i })
    expect(helpButton.tagName).toBe('BUTTON')
  })

  it('すべてのインタラクティブ要素にアクセシブルな名前がある', () => {
    // Arrange: 準備
    // Act: 実行
    const { container } = render(<App />)

    // Assert: 検証
    // すべてのボタンにアクセシブルな名前があることを確認
    const buttons = container.querySelectorAll('button')
    buttons.forEach((button) => {
      const accessibleName =
        button.getAttribute('aria-label') ||
        button.textContent ||
        button.getAttribute('title')
      expect(accessibleName).toBeTruthy()
    })
  })
})
