import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css';
import './styles/theme-command-center.css';
import './styles/premium-anim.css'
import './styles/theme-hackathon.css'
import './styles/adaptive-zoom.css'
import Router from './Router.tsx'
import { TooltipProvider } from './components/ui/tooltip'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from './contexts/AuthContext'
import { EdgeBlendSettingsProvider } from './contexts/EdgeBlendSettingsContext'
import ErrorBoundary from './ErrorBoundary'
import { smartZoomAdapter } from './utils/smartZoomAdapter'

// No basename needed for Vercel deployment
const basename = '';

// Debug log to verify app is loading
console.log('🚀 Marketing Engine starting...', {
  basename,
  bypassAuth: import.meta.env.VITE_BYPASS_AUTH,
  mode: import.meta.env.MODE
});

// Initialize smart zoom adapter (automatically detects and adapts to zoom changes)
smartZoomAdapter.subscribe((zoomLevel) => {
  console.log(`📐 Zoom level changed: ${zoomLevel.toFixed(2)}x - Layout adapting automatically`);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <AuthProvider>
          <EdgeBlendSettingsProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <TooltipProvider delayDuration={80} skipDelayDuration={200}>
              <Router />
            </TooltipProvider>
          </ThemeProvider>
          </EdgeBlendSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
