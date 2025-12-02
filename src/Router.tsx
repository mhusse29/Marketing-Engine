import { Routes, Route } from 'react-router-dom';
import App from './App';
import AuthPage from './pages/AuthPage';
import PasswordResetPage from './pages/PasswordResetPage';
import FeedbackDashboard from './pages/FeedbackDashboard';
import StandaloneAnalyticsDashboard from './pages/StandaloneAnalyticsDashboard';
import MediaPlanLite from './pages/MediaPlanLite';
import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import { BaduDashboard } from './components/Analytics/BaduDashboard';

/**
 * Main application router
 * Handles all top-level routes and protected route wrappers
 */
export default function Router() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/landing" element={<LandingPage />} />
      
      {/* Protected App Route */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        }
      />
      <Route
        path="/media-plan-lite"
        element={
          <ProtectedRoute>
            <MediaPlanLite />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <StandaloneAnalyticsDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics-standalone"
        element={
          <ProtectedRoute>
            <StandaloneAnalyticsDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feedback"
        element={
          <ProtectedRoute>
            <FeedbackDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/badu/analytics"
        element={
          <ProtectedRoute>
            <BaduDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/reset-password" element={<PasswordResetPage />} />
    </Routes>
  );
}
