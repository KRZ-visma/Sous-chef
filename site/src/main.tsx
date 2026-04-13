import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Hash routing works on static hosts (e.g. GitHub Pages) without server rewrites. */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
