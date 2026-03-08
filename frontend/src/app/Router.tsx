import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../components/layout/DashboardLayout";
import AdminRoute from "./AdminRoute";
import LoginPage from "../pages/login";
import AlertsPage from "../pages/alerts";
import UsersPage from "../pages/users";
import OrganizationsPage from "../pages/organizations";

export default function Router() {
  const { isAuthenticated } = useAuth();
  const defaultRoute = "/alerts";

  if (isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to={defaultRoute} replace />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route
            path="users"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="organizations"
            element={
              <AdminRoute>
                <OrganizationsPage />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to={defaultRoute} replace />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
