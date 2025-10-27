import React, { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { Subscription } from '../types/models'

interface SubscriptionState {
  subscriptions: Subscription[]
  isLoading: boolean
  error: string | null
}

type SubscriptionAction =
  | { type: 'ADD_SUBSCRIPTION'; payload: Subscription }
  | { type: 'REMOVE_SUBSCRIPTION'; payload: string }
  | { type: 'UPDATE_SUBSCRIPTION'; payload: Subscription }
  | { type: 'LOAD_SUBSCRIPTIONS'; payload: Subscription[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

const initialState: SubscriptionState = {
  subscriptions: [],
  isLoading: false,
  error: null,
}

function subscriptionReducer(state: SubscriptionState, action: SubscriptionAction): SubscriptionState {
  switch (action.type) {
    case 'ADD_SUBSCRIPTION':
      return {
        ...state,
        subscriptions: [...state.subscriptions, action.payload],
      }
    case 'REMOVE_SUBSCRIPTION':
      return {
        ...state,
        subscriptions: state.subscriptions.filter(sub => sub.id !== action.payload),
      }
    case 'UPDATE_SUBSCRIPTION':
      return {
        ...state,
        subscriptions: state.subscriptions.map(sub =>
          sub.id === action.payload.id ? action.payload : sub
        ),
      }
    case 'LOAD_SUBSCRIPTIONS':
      return {
        ...state,
        subscriptions: action.payload,
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      }
    default:
      return state
  }
}

interface SubscriptionContextValue {
  state: SubscriptionState
  dispatch: React.Dispatch<SubscriptionAction>
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(subscriptionReducer, initialState)

  return (
    <SubscriptionContext.Provider value={{ state, dispatch }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider')
  }
  return context
}
