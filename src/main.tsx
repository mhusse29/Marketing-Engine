import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css';
import './styles/theme-command-center.css';
import './styles/premium-anim.css'
import Router from './Router.tsx'
import { TooltipProvider } from './components/ui/tooltip'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from './contexts/AuthContext'

// Use basename only in production (GitHub Pages), not in local dev
const basename = import.meta.env.MODE === 'production' ? '/Marketing-Engine' : '';

// Check if we're on the standalone analytics route (no auth needed)
const isStandalone = window.location.pathname.includes('/analytics-standalone');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      {isStandalone ? (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <TooltipProvider delayDuration={80} skipDelayDuration={200}>
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      ) : (
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <TooltipProvider delayDuration={80} skipDelayDuration={200}>
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      )}
    </BrowserRouter>
  </StrictMode>,
)
