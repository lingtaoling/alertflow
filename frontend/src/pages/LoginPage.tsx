import { useState } from "react";
import { useAppDispatch } from "../store/hooks";
import { setSession } from "../store/slices/authSlice";
import { authApi } from "../api";
import { AlertTriangle, LogIn, Loader2 } from "lucide-react";
import LoginBgCanvas from "../components/LoginBgCanvas";
import logoIcon from "../assets/images/alertflow-icon1.svg";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError("");
    try {
      const { accessToken, user, org } = await authApi.login(
        email.trim(),
        password,
      );
      dispatch(setSession({ accessToken, org, user }));
    } catch (e: any) {
      setError(e.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <LoginBgCanvas />
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <img src={logoIcon} alt="" className="h-14 w-auto" />
            <span className="text-2xl font-logo font-bold text-ink-700 tracking-tight">
              AlertFlow
            </span>
          </div>
          <p className="text-ink-600 text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="gradient-border rounded-2xl p-6 bg-white shadow-xl shadow-ink-700/20">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="test@example.com"
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
                <>
                  <Loader2 size={14} className="animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  <LogIn size={14} /> Sign in
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-ink-500 text-sm mt-6">
          Don&apos;t have an account?{" "}
          <span className="relative inline-block">
            <button
              type="button"
              onClick={() => {
                setShowTooltip(true);
                setTimeout(() => setShowTooltip(false), 2000);
              }}
              className="text-signal-orange font-medium hover:underline cursor-pointer"
            >
              Create account
            </button>
            {showTooltip && (
              <span
                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 text-xs font-medium text-white bg-ink-700 rounded-lg whitespace-nowrap shadow-lg"
                role="tooltip"
              >
                Under construction
              </span>
            )}
          </span>
        </p>
      </div>
    </div>
  );
}
