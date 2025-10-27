import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArticleList } from './ArticleList'
import type { Article } from '../../types/models'

describe('ArticleList', () => {
  const mockArticles: Article[] = [
    {
      id: '1',
      title: 'Test Article',
      link: 'https://example.com/1',
      pubDate: '2025-01-01T10:00:00Z',
      summary: 'Test summary',
      feedId: 'feed-1',
      feedTitle: 'Test Feed',
      feedOrder: 0,
    },
  ]

  it('記事をレンダリングする', () => {
    render(<ArticleList articles={mockArticles} />)
    expect(screen.getByText('Test Article')).toBeInTheDocument()
  })

  it('記事がない場合は空の状態を表示する', () => {
    render(<ArticleList articles={[]} />)
    expect(screen.getByText(/記事がありません/i)).toBeInTheDocument()
  })

  it('記事のリンクをレンダリングする', () => {
    render(<ArticleList articles={mockArticles} />)
    const link = screen.getByRole('link', { name: /Test Article/i })
    expect(link).toHaveAttribute('href', 'https://example.com/1')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
