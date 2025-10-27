import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import App from '../../src/App'

const server = setupServer(
  http.post('*/api/parse', () => {
    return HttpResponse.json({
      feeds: [
        {
          title: 'Test Feed',
          link: 'https://example.com',
          articles: [
            {
              title: 'Test Article',
              link: 'https://example.com/article',
              pubDate: '2025-01-01T10:00:00Z',
              summary: 'Test summary',
            },
          ],
        },
      ],
      errors: [],
    })
  })
)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())

describe('Feed Flow Integration', () => {
  it('should complete full feed flow: add feed -> fetch -> display articles', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Should show welcome screen initially
    expect(screen.getByText(/ウェルカム/i)).toBeInTheDocument()
    
    // Add feed URL
    const input = screen.getByPlaceholderText(/URL/i)
    await user.type(input, 'https://example.com/rss')
    
    const addButton = screen.getByRole('button', { name: /追加/i })
    await user.click(addButton)
    
    // Wait for articles to load
    await waitFor(() => {
      expect(screen.getByText('Test Article')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Verify article is clickable
    const articleLink = screen.getByRole('link', { name: /Test Article/i })
    expect(articleLink).toHaveAttribute('href', 'https://example.com/article')
  })
})
