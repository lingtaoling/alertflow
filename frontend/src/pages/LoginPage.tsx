import { useState } from 'react';
import { useAppDispatch } from '../store/hooks';
import { setSession } from '../store/slices/authSlice';
import { authApi } from '../api';
import { AlertTriangle, LogIn, Zap, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      const { accessToken, user, org } = await authApi.login(email.trim(), password);
      dispatch(setSession({ accessToken, org, user }));
    } catch (e: any) {
      setError(e.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-signal-orange/20 border border-signal-orange/40 flex items-center justify-center">
              <Zap size={20} className="text-signal-orange" />
            </div>
            <span className="text-2xl font-display font-bold text-ink-700 tracking-tight">AlertFlow</span>
          </div>
          <p className="text-ink-600 text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="gradient-border rounded-2xl p-6 bg-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                className="input"
                type="email"
                placeholder="john@acme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-signal-red text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertTriangle size={14} /> {error}
              </div>
            )}
            <button
              type="submit"
              className="btn-primary w-full justify-center"
              disabled={loading || !email.trim() || !password}
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Signing in...</>
              ) : (
                <><LogIn size={14} /> Sign in</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-ink-500 text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/setup" className="text-signal-orange font-medium hover:underline">
            Create your organization
          </Link>
        </p>
      </div>
    </div>
  );
}
