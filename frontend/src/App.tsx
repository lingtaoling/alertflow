import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './store/hooks';
import LoginPage from './pages/LoginPage';
import SetupPage from './pages/SetupPage';
import DashboardLayout from './layouts/DashboardLayout';
import AlertsPage from './pages/AlertsPage';
import UsersPage from './pages/UsersPage';
import OrganizationsPage from './pages/OrganizationsPage';

export default function App() {
  const { accessToken, orgId } = useAppSelector((s) => s.auth);
  const isAuthenticated = Boolean(accessToken);
  const defaultRoute = orgId ? '/alerts' : '/organizations';

  if (isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to={defaultRoute} replace />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="organizations" element={<OrganizationsPage />} />
          <Route path="*" element={<Navigate to={defaultRoute} replace />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
