import { useEffect, useState } from 'react';
import { orgsApi } from '../../services/organizations.service';
import { Organization } from '../../types';
import CreateOrgForm from './components/CreateOrgForm';
import { Building2, Loader2, Plus, RefreshCw, Shield } from 'lucide-react';

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  function load() {
    setLoading(true);
    setError('');
    orgsApi.list().then(setOrgs).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6 card p-3 flex items-center gap-3 text-xs text-ink-600">
        <Shield size={13} className="text-signal-orange shrink-0" />
        <span>All organizations (tenants) in the system</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ink-700">Organizations</h2>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={load} disabled={loading} title="Refresh">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowCreateForm(true)} title="Create organization">
            <Plus size={14} />
            Create organization
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-ink-500">
          <Loader2 size={18} className="animate-spin" />
          <span>Loading organizations...</span>
        </div>
      ) : error ? (
        <div className="card p-6 text-center">
          <Building2 size={24} className="text-signal-red mx-auto mb-2" />
          <p className="text-signal-red text-sm">{error}</p>
          <button className="btn-ghost mt-3 mx-auto" onClick={load}>
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      ) : orgs.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 size={24} className="text-ink-400 mx-auto mb-4" />
          <p className="text-ink-700 font-medium mb-1">No organizations found</p>
          <p className="text-ink-500 text-sm mb-4">Organizations are created during setup</p>
          <button className="btn-primary mx-auto" onClick={() => setShowCreateForm(true)}>
            <Plus size={14} /> Create organization
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {orgs.map((org) => (
            <div key={org.id} className="card p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink-700">{org.name}</p>
                {org._count && (
                  <p className="text-xs text-ink-500">
                    {org._count.users} user{org._count.users !== 1 ? 's' : ''} · {org._count.alerts} alert{org._count.alerts !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <span className="text-xs text-ink-400 font-mono">{org.id.slice(0, 8)}...</span>
            </div>
          ))}
        </div>
      )}

      {showCreateForm && <CreateOrgForm onClose={() => setShowCreateForm(false)} onSuccess={load} />}
    </div>
  );
}
