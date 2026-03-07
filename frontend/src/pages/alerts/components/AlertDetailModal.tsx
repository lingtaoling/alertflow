import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchAlertEvents, updateAlertStatus, clearSelected } from '../../../store/slices/alertsSlice';
import { Alert, AlertStatus } from '../../../types';
import { statusConfig, nextStatus, nextStatusLabel } from '../../../utils/alertStatus';
import { formatDateTime, formatRelativeTime } from '../../../utils/format';
import {
  X, Clock, User, ArrowRight, CheckCircle2, Loader2, AlertTriangle, Activity,
} from 'lucide-react';

interface Props {
  alert: Alert;
}

export default function AlertDetailModal({ alert }: Props) {
  const dispatch = useAppDispatch();
  const { selectedAlertEvents, eventsLoading, updateLoading, error } = useAppSelector((s) => s.alerts);
  const [note, setNote] = useState('');

  useEffect(() => {
    dispatch(fetchAlertEvents(alert.id));
  }, [alert.id, dispatch]);

  function handleClose() {
    dispatch(clearSelected());
  }

  async function handleAdvance() {
    const next = nextStatus[alert.status];
    if (!next) return;
    await dispatch(updateAlertStatus({ id: alert.id, status: next, note: note.trim() || undefined }));
    setNote('');
    dispatch(fetchAlertEvents(alert.id));
  }

  const statusCfg = statusConfig[alert.status];
  const next = nextStatus[alert.status];

  const eventStatusColors: Record<AlertStatus, string> = {
    NEW: 'border-signal-red bg-signal-red/20 text-signal-red',
    ACKNOWLEDGED: 'border-signal-orange bg-signal-orange/20 text-signal-orange',
    RESOLVED: 'border-signal-green bg-signal-green/20 text-signal-green',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-700/30 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-2xl gradient-border rounded-2xl bg-white flex flex-col max-h-[90vh] animate-slide-up shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-ink-200">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`badge ${statusCfg.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-ink-700 leading-tight">{alert.title}</h2>
            {alert.description && (
              <p className="text-ink-400 text-sm mt-1">{alert.description}</p>
            )}
          </div>
          <button onClick={handleClose} className="btn-ghost p-1.5 shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Meta */}
        <div className="px-6 py-3 border-b border-ink-200 flex items-center gap-4 text-xs text-ink-500 flex-wrap">
          <div className="flex items-center gap-1.5">
            <User size={12} />
            Created by <span className="text-ink-700 font-medium">{alert.createdBy?.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} /> {formatDateTime(alert.createdAt)}
          </div>
          <div className="flex items-center gap-1.5">
            <Activity size={12} />
            <span className="font-mono">{alert.id.slice(0, 8)}...</span>
          </div>
        </div>

        {/* Events timeline */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-sm font-semibold text-ink-600 mb-4 flex items-center gap-2 uppercase tracking-wider">
            <Activity size={14} /> Audit Trail
          </h3>

          {eventsLoading ? (
            <div className="flex items-center gap-2 text-ink-500 py-8 justify-center">
              <Loader2 size={16} className="animate-spin" /> Loading events...
            </div>
          ) : selectedAlertEvents.length === 0 ? (
            <p className="text-ink-500 text-sm text-center py-8">No events yet</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-4 bottom-4 w-px bg-ink-200" />
              <div className="space-y-4">
                {selectedAlertEvents.map((event, i) => (
                  <div key={event.id} className="flex gap-4 relative animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${eventStatusColors[event.toStatus]}`}>
                      {event.toStatus === 'RESOLVED' ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-current" />
                      )}
                    </div>
                    <div className="flex-1 bg-ink-50 rounded-xl p-3 border border-ink-200">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {event.fromStatus ? (
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className={`badge ${statusConfig[event.fromStatus].badge} py-0.5`}>
                                  {statusConfig[event.fromStatus].label}
                                </span>
                                <ArrowRight size={10} className="text-ink-500" />
                                <span className={`badge ${statusConfig[event.toStatus].badge} py-0.5`}>
                                  {statusConfig[event.toStatus].label}
                                </span>
                              </div>
                            ) : (
                              <span className={`badge ${statusConfig[event.toStatus].badge} py-0.5 text-xs`}>
                                Alert created → {statusConfig[event.toStatus].label}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-ink-400">
                            <User size={10} />
                            <span className="text-ink-700">{event.user?.name}</span>
                            <span>·</span>
                            <span>{event.user?.email}</span>
                          </div>
                          {event.note && (
                            <p className="text-ink-600 text-sm mt-2 bg-ink-100 rounded-lg px-3 py-2 border-l-2 border-signal-orange/40">
                              "{event.note}"
                            </p>
                          )}
                        </div>
                        <span className="text-ink-500 text-xs whitespace-nowrap">
                          {formatRelativeTime(event.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(next || error) && (
            <div className="mt-6 pt-4 flex gap-4">
              <div className="w-8 shrink-0" />
              <div className="flex-1 min-w-0 border-t border-ink-200 pt-4">
                {error && (
                  <div className="flex items-center gap-2 text-signal-red text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
                    <AlertTriangle size={14} /> {error}
                  </div>
                )}
                {next && (
                  <>
                    <div className="mb-3">
                      <label className="label">
                        Note <span className="text-ink-500 normal-case font-normal">optional</span>
                      </label>
                      <textarea
                        className="input resize-none"
                        rows={2}
                        placeholder="Add a note for this status change..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        maxLength={500}
                      />
                    </div>
                    <button
                      className={`btn-primary w-full justify-center ${next === 'RESOLVED' ? '!bg-signal-green hover:!bg-emerald-600' : ''}`}
                      onClick={handleAdvance}
                      disabled={updateLoading}
                    >
                      {updateLoading ? (
                        <><Loader2 size={14} className="animate-spin" /> Updating...</>
                      ) : (
                        <><ArrowRight size={14} /> {nextStatusLabel[alert.status]} Alert</>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
