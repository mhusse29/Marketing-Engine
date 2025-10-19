import { Routes, Route, Navigate } from 'react-router-dom';
import AdminAuthPage from './pages/AdminAuthPage';
import StandaloneAnalyticsDashboard from './pages/StandaloneAnalyticsDashboard';
import AdminProtectedRoute from './components/AdminProtectedRoute';

export default function AdminRouter() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminAuthPage />} />
      <Route
        path="/dashboard"
        element={
          <AdminProtectedRoute>
            <StandaloneAnalyticsDashboard />
          </AdminProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
