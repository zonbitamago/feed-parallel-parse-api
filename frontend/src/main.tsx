import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from './registerSW'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service Workerを登録（本番環境のみ）
if (import.meta.env.PROD) {
  registerSW(() => {
    // Service Worker更新が検出されたときにカスタムイベントを発火
    window.dispatchEvent(new CustomEvent('sw-update-available'))
  }).catch(console.error)
}
