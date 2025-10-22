import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css';
import './styles/theme-command-center.css';
import './styles/premium-anim.css'
import './styles/theme-hackathon.css'
import Router from './Router.tsx'
import { TooltipProvider } from './components/ui/tooltip'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from './contexts/AuthContext'

// Use basename only in production (GitHub Pages), not in local dev
const basename = import.meta.env.MODE === 'production' ? '/Marketing-Engine' : '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <TooltipProvider delayDuration={80} skipDelayDuration={200}>
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
