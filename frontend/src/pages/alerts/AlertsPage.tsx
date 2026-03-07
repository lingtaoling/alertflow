import { useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { clearSelected } from '../../store/slices/alertsSlice';
import { AlertStatus } from '../../types';
import { useAlerts } from './hooks/useAlerts';
import AlertCard from './components/AlertCard';
import AlertDetailModal from './components/AlertDetailModal';
import CreateAlertForm from './components/CreateAlertForm';
import { statusConfig } from '../../utils/alertStatus';
import {
  Plus, RefreshCw, Zap, AlertCircle, CheckCircle2, Activity,
  Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';

const STATUS_FILTERS: { label: string; value: AlertStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'New', value: 'NEW' },
  { label: 'Acknowledged', value: 'ACKNOWLEDGED' },
  { label: 'Resolved', value: 'RESOLVED' },
];

export default function AlertsPage() {
  const dispatch = useAppDispatch();
  const {
    items, total, loading, error, filterStatus, limit, offset, selectedAlert,
    load, handleStatusFilter, handleSetOffset, handleSelectAlert,
  } = useAlerts();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const stats = [
    { label: 'Total', value: total, icon: Activity, color: 'text-ink-600' },
    { label: 'New', value: items.filter((a) => a.status === 'NEW').length, icon: AlertCircle, color: 'text-signal-red' },
    { label: "Ack'd", value: items.filter((a) => a.status === 'ACKNOWLEDGED').length, icon: Activity, color: 'text-signal-orange' },
    { label: 'Resolved', value: items.filter((a) => a.status === 'RESOLVED').length, icon: CheckCircle2, color: 'text-signal-green' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-lg font-semibold text-ink-700">Alerts</h1>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={load} title="Refresh">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
            <Plus size={14} />
            <span className="hidden sm:inline">New Alert</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="card p-3">
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={13} className={s.color} />
              <span className="text-ink-500 text-xs">{s.label}</span>
            </div>
            <div className="text-2xl font-display font-bold text-ink-700">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 mb-4 flex-wrap">
        {STATUS_FILTERS.map((f) => {
          const isActive = filterStatus === f.value;
          const cfg = f.value ? statusConfig[f.value] : null;
          return (
            <button
              key={f.value}
              onClick={() => handleStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? cfg
                    ? cfg.badge + ' border'
                    : 'bg-ink-700 text-white border border-ink-600'
                  : 'text-ink-500 hover:text-ink-700 hover:bg-ink-100'
              }`}
            >
              {f.value && cfg && <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1.5`} />}
              {f.label}
            </button>
          );
        })}
        <span className="ml-2 text-ink-500 text-xs">{total} alert{total !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-ink-500">
          <Loader2 size={18} className="animate-spin" />
          <span>Loading alerts...</span>
        </div>
      ) : error ? (
        <div className="card p-6 text-center">
          <AlertCircle size={24} className="text-signal-red mx-auto mb-2" />
          <p className="text-signal-red text-sm">{error}</p>
          <button className="btn-ghost mt-3 mx-auto" onClick={load}>
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-ink-100 border border-ink-200 flex items-center justify-center mx-auto mb-4">
            <Zap size={20} className="text-signal-orange" />
          </div>
          <p className="text-ink-700 font-medium mb-1">No alerts found</p>
          <p className="text-ink-500 text-sm mb-4">
            {filterStatus ? `No alerts with status "${filterStatus}"` : 'Create your first alert to get started'}
          </p>
          <button className="btn-primary mx-auto" onClick={() => setShowCreateForm(true)}>
            <Plus size={14} /> Create Alert
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onClick={() => handleSelectAlert(alert.id)} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-ink-200">
          <span className="text-ink-500 text-sm">
            Page {currentPage} of {totalPages} · {total} total
          </span>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" disabled={offset === 0} onClick={() => handleSetOffset(Math.max(0, offset - limit))}>
              <ChevronLeft size={14} /> Prev
            </button>
            <button className="btn-secondary" disabled={offset + limit >= total} onClick={() => handleSetOffset(offset + limit)}>
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {showCreateForm && <CreateAlertForm onClose={() => setShowCreateForm(false)} />}
      {selectedAlert && <AlertDetailModal alert={selectedAlert} />}
    </div>
  );
}
