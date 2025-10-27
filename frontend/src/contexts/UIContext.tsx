/**
 * UI state context for loading, welcome screen, and toast notifications
 */

import React, { createContext, useContext, useReducer, type ReactNode } from 'react';

interface UIState {
  isRefreshing: boolean;
  showWelcomeScreen: boolean;
  toast: {
    message: string;
    type: 'success' | 'error' | 'info';
  } | null;
}

type UIAction =
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_WELCOME_SCREEN'; payload: boolean }
  | { type: 'SHOW_TOAST'; payload: { message: string; type: 'success' | 'error' | 'info' } }
  | { type: 'HIDE_TOAST' };

const initialState: UIState = {
  isRefreshing: false,
  showWelcomeScreen: true,
  toast: null,
};

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SET_REFRESHING':
      return { ...state, isRefreshing: action.payload };
    case 'SET_WELCOME_SCREEN':
      return { ...state, showWelcomeScreen: action.payload };
    case 'SHOW_TOAST':
      return { ...state, toast: action.payload };
    case 'HIDE_TOAST':
      return { ...state, toast: null };
    default:
      return state;
  }
}

interface UIContextValue {
  state: UIState;
  dispatch: React.Dispatch<UIAction>;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  return (
    <UIContext.Provider value={{ state, dispatch }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
}
