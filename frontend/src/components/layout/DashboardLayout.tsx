import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { NAV_ITEMS } from "./nav.config";
import { Shield, LogOut, Menu, X } from "lucide-react";
import logo from "../../assets/images/alertflow-icon1.svg";
import logoFull from "../../assets/images/alertflow-logo.svg";

export default function DashboardLayout() {
  const { org, user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-200 bg-white/95 backdrop-blur-md sticky top-0 z-20 relative">
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="h-16 flex items-center justify-between gap-4">
            <NavLink to="/alerts" className="flex items-center gap-2 shrink-0">
              <img src={logo} alt="" className="h-10 w-auto logo-animated" />
              <span className="font-display font-bold text-xl tracking-tight brand-text-animated">
                AlertFlow
              </span>
            </NavLink>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
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
              {/* Hamburger button - small screens only */}
              <button
                className="md:hidden btn-ghost p-2 text-ink-600 hover:text-ink-800"
                onClick={() => setMobileMenuOpen((o) => !o)}
                title={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
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

          {/* Mobile menu - floating dropdown, small screens only */}
          {mobileMenuOpen && (
            <>
              <div
                className="md:hidden fixed inset-0 z-40 bg-black/20"
                onClick={() => setMobileMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="md:hidden absolute right-4 top-full mt-2 z-50 min-w-[12rem] rounded-xl border border-ink-200 bg-white py-2 shadow-lg animate-fade-in">
                <nav className="flex flex-col gap-0.5">
                  {visibleNavItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `nav-link ${isActive ? "nav-link-active" : ""}`.trim()
                      }
                    >
                      <item.icon size={14} />
                      <span className="nav-link-text">{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 relative">
        <div
          className="absolute right-4 top-3/4 -translate-y-1/2 w-60 h-60 pointer-events-none select-none -z-10"
          aria-hidden
        >
          <img src={logoFull} alt="" className="w-full h-full object-contain" />
        </div>
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
