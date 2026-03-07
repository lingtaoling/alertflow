import { useState } from 'react';
import { useAppDispatch } from '../store/hooks';
import { setSession } from '../store/slices/authSlice';
import { orgsApi, usersApi } from '../api';
import { Organization, User } from '../types';
import { Link } from 'react-router-dom';
import { AlertTriangle, Building2, UserPlus, ChevronRight, Zap } from 'lucide-react';

export default function SetupPage() {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<'org' | 'user'>('org');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [org, setOrg] = useState<Organization | null>(null);

  const [orgName, setOrgName] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const created = await orgsApi.create(orgName.trim());
      setOrg(created);
      setStep('user');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!org || !userName.trim() || !userEmail.trim() || !userPassword) return;
    setLoading(true);
    setError('');
    try {
      const user = await usersApi.create({
        name: userName.trim(),
        email: userEmail.trim(),
        orgId: org.id,
        password: userPassword,
      });
      dispatch(setSession({ org, user }));
    } catch (e: any) {
      setError(e.message);
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
          <p className="text-ink-600 text-sm">Multi-tenant alert workflow management</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[{ id: 'org', label: 'Organization', icon: Building2 }, { id: 'user', label: 'User', icon: UserPlus }].map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              {i > 0 && <ChevronRight size={14} className="text-ink-600" />}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                step === s.id 
                  ? 'bg-signal-orange/20 text-signal-orange border border-signal-orange/40' 
                  : s.id === 'user' && step === 'org' 
                    ? 'text-ink-500 border border-ink-300'
                    : 'text-signal-green border border-signal-green/30 bg-signal-green/10'
              }`}>
                <s.icon size={12} />
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="gradient-border rounded-2xl p-6 bg-white">
          {step === 'org' ? (
            <form onSubmit={handleCreateOrg} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-ink-700 mb-1">Create your organization</h2>
                <p className="text-ink-600 text-sm">Each organization is an isolated tenant. Data never leaks between orgs.</p>
              </div>
              <div>
                <label className="label">Organization name</label>
                <input
                  className="input"
                  placeholder="e.g. Acme Corp"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  autoFocus
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-signal-red text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle size={14} /> {error}
                </div>
              )}
              <button type="submit" className="btn-primary w-full justify-center" disabled={loading || !orgName.trim()}>
                {loading ? 'Creating...' : 'Create Organization'}
                <ChevronRight size={14} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateUser} className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="badge bg-signal-green/15 text-signal-green border border-signal-green/30">
                    <Building2 size={10} /> {org?.name}
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-ink-700 mb-1">Create your user account</h2>
                <p className="text-ink-600 text-sm">This user will be assigned to <span className="text-signal-orange font-medium">{org?.name}</span>.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Full name</label>
                  <input className="input" placeholder="John Doe" value={userName} onChange={(e) => setUserName(e.target.value)} autoFocus />
                </div>
                <div>
                  <label className="label">Email address</label>
                  <input className="input" type="email" placeholder="john@acme.com" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Min 8 characters"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    minLength={8}
                  />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-signal-red text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle size={14} /> {error}
                </div>
              )}
              <div className="flex gap-2">
                <button type="button" className="btn-secondary" onClick={() => { setStep('org'); setError(''); }}>
                  Back
                </button>
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading || !userName.trim() || !userEmail.trim() || userPassword.length < 8}>
                  {loading ? 'Creating...' : 'Enter Dashboard'}
                  <ChevronRight size={14} />
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-ink-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-signal-orange font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
