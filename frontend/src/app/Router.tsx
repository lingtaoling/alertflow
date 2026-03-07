import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import DashboardLayout from '../components/layout/DashboardLayout';
import LoginPage from '../pages/login';
import SetupPage from '../pages/setup';
import AlertsPage from '../pages/alerts';
import UsersPage from '../pages/users';
import OrganizationsPage from '../pages/organizations';

export default function Router() {
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
