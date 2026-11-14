import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { desbloquearVoz } from './lib/voz'

// iPhone: a voz só toca depois de um toque; liberamos no primeiro toque em qualquer lugar
window.addEventListener('pointerdown', desbloquearVoz, { once: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
