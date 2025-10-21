import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import StandaloneAnalyticsDashboard from './pages/StandaloneAnalyticsDashboard';
import './index.css';
import './styles/theme-command-center.css';
import './styles/premium-anim.css';
import './styles/theme-hackathon.css';

// Analytics dashboard is deployed to root, no basename needed
ReactDOM.createRoot(document.getElementById('analytics-root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <StandaloneAnalyticsDashboard />
    </BrowserRouter>
  </React.StrictMode>
);
