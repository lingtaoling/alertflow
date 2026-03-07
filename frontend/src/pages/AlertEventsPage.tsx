import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAlerts, fetchAlertById, fetchAlertEvents, clearSelected } from '../store/slices/alertsSlice';
import AlertDetailModal from '../components/AlertDetailModal';
import { statusConfig } from '../utils';
import { Activity, Loader2, RefreshCw, Shield, Zap } from 'lucide-react';

export default function AlertEventsPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error, selectedAlert } = useAppSelector((s) => s.alerts);
  const { orgId } = useAppSelector((s) => s.auth);
  const [refreshing, setRefreshing] = useState(false);

  function load() {
    setRefreshing(true);
    dispatch(fetchAlerts({ limit: 50 })).finally(() => setRefreshing(false));
  }

  useEffect(() => { load(); }, []);

  function handleViewEvents(alertId: string) {
    dispatch(fetchAlertById(alertId));
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6 card p-3 flex items-center gap-3 text-xs text-ink-600">
        <Shield size={13} className="text-signal-orange shrink-0" />
        <span>View audit trail for each alert. Click an alert to see its event history.</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ink-700">Alert Events</h2>
        <button className="btn-ghost" onClick={load} disabled={refreshing} title="Refresh">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-ink-500">
          <Loader2 size={18} className="animate-spin" />
          <span>Loading alerts...</span>
        </div>
      ) : error ? (
        <div className="card p-6 text-center">
          <Activity size={24} className="text-signal-red mx-auto mb-2" />
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
          <p className="text-ink-700 font-medium mb-1">No alerts yet</p>
          <p className="text-ink-500 text-sm">Create alerts to see their event history</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((alert) => (
            <div
              key={alert.id}
              className="card-hover p-4 cursor-pointer flex items-center justify-between gap-4"
              onClick={() => handleViewEvents(alert.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleViewEvents(alert.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${statusConfig[alert.status].dot}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-700 truncate">{alert.title}</p>
                  <p className="text-xs text-ink-500">
                    {statusConfig[alert.status].label} · {alert._count?.alertEvents ?? 0} event{(alert._count?.alertEvents ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <span className="text-xs text-ink-400 shrink-0">View events →</span>
            </div>
          ))}
        </div>
      )}

      {selectedAlert && <AlertDetailModal alert={selectedAlert} />}
    </div>
  );
}
