import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

/**
 * Service Worker更新状態のコンテキスト
 */
interface UpdateContextType {
  hasUpdate: boolean
  setHasUpdate: (hasUpdate: boolean) => void
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined)

/**
 * UpdateContextのプロバイダー
 */
export function UpdateProvider({ children }: { children: ReactNode }) {
  const [hasUpdate, setHasUpdate] = useState(false)

  useEffect(() => {
    // カスタムイベントをリッスン
    const handleUpdateAvailable = () => {
      setHasUpdate(true)
    }

    window.addEventListener('sw-update-available', handleUpdateAvailable)

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable)
    }
  }, [])

  return (
    <UpdateContext.Provider value={{ hasUpdate, setHasUpdate }}>
      {children}
    </UpdateContext.Provider>
  )
}

/**
 * UpdateContextを使用するカスタムフック
 */
export function useUpdate() {
  const context = useContext(UpdateContext)
  if (!context) {
    throw new Error('useUpdate must be used within UpdateProvider')
  }
  return context
}
