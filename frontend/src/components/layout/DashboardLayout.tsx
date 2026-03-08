import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { NAV_ITEMS } from "./nav.config";
import { Zap, Building2, User, Shield, LogOut } from "lucide-react";
import logo from "../../assets/images/alertflow-icon1.svg";

export default function DashboardLayout() {
  const { org, user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-200 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between gap-4">
            <NavLink to="/alerts" className="flex items-center gap-2 shrink-0">
              <img src={logo} alt="" className="h-10 w-auto logo-animated" />
              <span className="font-display font-bold text-xl tracking-tight brand-text-animated">
                AlertFlow
              </span>
            </NavLink>

            <nav className="flex items-center gap-1 flex-1 justify-center">
              {visibleNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "nav-link-active" : ""}`.trim()
                  }
                >
                  <item.icon size={14} />
                  <span className="nav-link-text">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex items-center gap-1.5 bg-ink-100 border border-ink-200 rounded-full px-3 py-1.5 text-sm">
                <Shield size={11} className="text-signal-orange" />
                <span className="text-ink-700 font-medium">
                  {"Welcome, " + user?.name || "..."}
                </span>
              </div>
              <button
                className="btn-ghost text-ink-500 hover:text-signal-red"
                onClick={handleLogout}
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
