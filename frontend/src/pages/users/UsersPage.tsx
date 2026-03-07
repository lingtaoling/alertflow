import { useEffect, useState } from 'react';
import { usersApi } from '../../services/users.service';
import { User } from '../../types';
import CreateUserForm from './components/CreateUserForm';
import { Users, Loader2, RefreshCw, UserPlus } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  function load() {
    setLoading(true);
    setError('');
    usersApi.listByOrg().then(setUsers).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ink-700">Users</h2>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={load} disabled={loading} title="Refresh">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowCreateForm(true)} title="Create user">
            <UserPlus size={14} />
            Create user
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-ink-500">
          <Loader2 size={18} className="animate-spin" />
          <span>Loading users...</span>
        </div>
      ) : error ? (
        <div className="card p-6 text-center">
          <Users size={24} className="text-signal-red mx-auto mb-2" />
          <p className="text-signal-red text-sm">{error}</p>
          <button className="btn-ghost mt-3 mx-auto" onClick={load}>
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={24} className="text-ink-400 mx-auto mb-4" />
          <p className="text-ink-700 font-medium mb-1">No users found</p>
          <p className="text-ink-500 text-sm">Users are created during organization setup</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="card p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink-700">{user.name || '—'}</p>
                <p className="text-xs text-ink-500">{user.email}</p>
              </div>
              <span className="text-xs text-ink-400 font-mono">{user.id.slice(0, 8)}...</span>
            </div>
          ))}
        </div>
      )}

      {showCreateForm && <CreateUserForm onClose={() => setShowCreateForm(false)} onSuccess={load} />}
    </div>
  );
}
