import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../components/layout/DashboardLayout";
import LoginPage from "../pages/login";
import AlertsPage from "../pages/alerts";
import UsersPage from "../pages/users";
import OrganizationsPage from "../pages/organizations";
import { ShieldX } from "lucide-react";

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-ink-500">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <ShieldX size={26} className="text-signal-red" />
        </div>
        <p className="text-lg font-semibold text-ink-700">Access Denied</p>
        <p className="text-sm text-ink-500">
          You need admin privileges to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

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
