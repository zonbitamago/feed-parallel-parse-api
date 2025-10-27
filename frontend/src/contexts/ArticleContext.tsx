import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { Article, FeedError } from '../types/models'

interface ArticleState {
  articles: Article[]
  displayedArticles: Article[]
  searchQuery: string
  selectedFeedId: string | null
  isLoading: boolean
  errors: FeedError[]
}

type ArticleAction =
  | { type: 'SET_ARTICLES'; payload: Article[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_ERROR'; payload: FeedError }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_FEED'; payload: string | null }

const initialState: ArticleState = {
  articles: [],
  displayedArticles: [],
  searchQuery: '',
  selectedFeedId: null,
  isLoading: false,
  errors: [],
}

function filterArticles(articles: Article[], searchQuery: string, selectedFeedId: string | null): Article[] {
  let filtered = articles

  // Filter by feed
  if (selectedFeedId) {
    filtered = filtered.filter(article => article.feedId === selectedFeedId)
  }

  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.summary.toLowerCase().includes(query)
    )
  }

  return filtered
}

function articleReducer(state: ArticleState, action: ArticleAction): ArticleState {
  switch (action.type) {
    case 'SET_ARTICLES': {
      const displayed = filterArticles(action.payload, state.searchQuery, state.selectedFeedId)
      return {
        ...state,
        articles: action.payload,
        displayedArticles: displayed,
      }
    }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }
    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors, action.payload],
      }
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: [],
      }
    case 'SET_SEARCH_QUERY': {
      const displayed = filterArticles(state.articles, action.payload, state.selectedFeedId)
      return {
        ...state,
        searchQuery: action.payload,
        displayedArticles: displayed,
      }
    }
    case 'SET_SELECTED_FEED': {
      const displayed = filterArticles(state.articles, state.searchQuery, action.payload)
      return {
        ...state,
        selectedFeedId: action.payload,
        displayedArticles: displayed,
      }
    }
    default:
      return state
  }
}

interface ArticleContextValue {
  state: ArticleState
  dispatch: React.Dispatch<ArticleAction>
}

const ArticleContext = createContext<ArticleContextValue | undefined>(undefined)

export function ArticleProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(articleReducer, initialState)

  return (
    <ArticleContext.Provider value={{ state, dispatch }}>
      {children}
    </ArticleContext.Provider>
  )
}

export function useArticle() {
  const context = useContext(ArticleContext)
  if (!context) {
    throw new Error('useArticle must be used within ArticleProvider')
  }
  return context
}
