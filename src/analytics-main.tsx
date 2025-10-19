import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import StandaloneAnalyticsDashboard from './pages/StandaloneAnalyticsDashboard';
import './index.css';
import './styles/theme-command-center.css?v=2';
import './styles/premium-anim.css?v=2';

// Use basename only in production (GitHub Pages), not in local dev
const basename = import.meta.env.MODE === 'production' ? '/Marketing-Engine' : '';

ReactDOM.createRoot(document.getElementById('analytics-root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <StandaloneAnalyticsDashboard />
    </BrowserRouter>
  </React.StrictMode>
);
