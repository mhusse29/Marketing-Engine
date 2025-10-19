import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './styles/theme-command-center.css';
import './styles/premium-anim.css';
import AdminRouter from './AdminRouter';
import { TooltipProvider } from './components/ui/tooltip';
import { ThemeProvider } from 'next-themes';
import { AdminAuthProvider } from './contexts/AdminAuthContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AdminAuthProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <TooltipProvider delayDuration={80} skipDelayDuration={200}>
            <AdminRouter />
          </TooltipProvider>
        </ThemeProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  </StrictMode>
);
