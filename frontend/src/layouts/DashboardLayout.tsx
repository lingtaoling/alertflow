import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearSession } from '../store/slices/authSlice';
import { NAV_ITEMS } from '../config/nav';
import { Zap, Building2, User, Shield, LogOut } from 'lucide-react';

export default function DashboardLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { org, user } = useAppSelector((s) => s.auth);

  function handleLogout() {
    dispatch(clearSession());
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-200 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-14 flex items-center justify-between gap-4">
            {/* Logo */}
            <NavLink to="/alerts" className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-signal-orange/20 border border-signal-orange/40 flex items-center justify-center">
                <Zap size={14} className="text-signal-orange" />
              </div>
              <span className="font-display font-bold text-ink-700 text-sm tracking-tight">AlertFlow</span>
            </NavLink>

            {/* Nav links */}
            <nav className="flex items-center gap-1 flex-1 justify-center">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-signal-orange/15 text-signal-orange border border-signal-orange/30'
                        : 'text-ink-600 hover:text-ink-800 hover:bg-ink-100'
                    }`
                  }
                >
                  <item.icon size={14} />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Tenant context + actions */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex items-center gap-1.5 bg-ink-100 border border-ink-200 rounded-full px-3 py-1 text-xs">
                <Shield size={11} className="text-signal-orange" />
                <Building2 size={11} className="text-ink-500" />
                <span className="text-ink-700 font-medium">{org?.name || 'Loading...'}</span>
                <span className="text-ink-400">·</span>
                <User size={11} className="text-ink-500" />
                <span className="text-ink-700">{user?.name || '...'}</span>
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
