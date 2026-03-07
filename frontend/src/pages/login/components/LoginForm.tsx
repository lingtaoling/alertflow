import { AlertTriangle, LogIn, Loader2 } from 'lucide-react';
import { useLoginForm } from '../hooks/useLoginForm';

export default function LoginForm() {
  const { email, setEmail, password, setPassword, loading, error, handleSubmit } = useLoginForm();

  return (
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
  );
}
