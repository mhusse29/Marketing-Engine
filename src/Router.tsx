import { Routes, Route } from 'react-router-dom';
import App from './App';
import AuthPage from './pages/AuthPage';
import PasswordResetPage from './pages/PasswordResetPage';
import FeedbackDashboard from './pages/FeedbackDashboard';
import StandaloneAnalyticsDashboard from './pages/StandaloneAnalyticsDashboard';
import ProtectedRoute from './components/ProtectedRoute';

export default function Router() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <App />
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
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/reset-password" element={<PasswordResetPage />} />
    </Routes>
  );
}
