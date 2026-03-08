import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchAlertEvents,
  fetchAlertById,
  fetchAlerts,
  updateAlertStatus,
  clearSelected,
  clearError,
} from "../../../store/slices/alertsSlice";
import { Alert, AlertStatus } from "../../../types";
import {
  statusConfig,
  nextStatus,
  nextStatusLabel,
} from "../../../utils/alertStatus";
import { formatDateTime, formatRelativeTime } from "../../../utils/format";
import {
  X,
  Clock,
  User,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Activity,
  Zap,
} from "lucide-react";

interface Props {
  alert: Alert;
}

export default function AlertDetailModal({ alert }: Props) {
  const dispatch = useAppDispatch();
  const {
    selectedAlertEvents,
    eventsLoading,
    updateLoading,
    error,
    filterStatus,
    limit,
    offset,
  } = useAppSelector((s) => s.alerts);
  const [note, setNote] = useState("");

  useEffect(() => {
    dispatch(fetchAlertEvents(alert.id));
  }, [alert.id, dispatch]);

  // When status update fails (e.g. 409 conflict), refresh once after 5s to pick up latest data
  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => {
      dispatch(fetchAlertById(alert.id));
      dispatch(fetchAlertEvents(alert.id));
      dispatch(clearError());
    }, 3000);
    return () => clearTimeout(id);
  }, [error, alert.id, dispatch]);

  function handleClose() {
    dispatch(fetchAlerts({ status: filterStatus || undefined, limit, offset }));
    dispatch(clearSelected());
  }

  async function handleAdvance() {
    const next = nextStatus[alert.status];
    if (!next) return;
    const result = await dispatch(
      updateAlertStatus({
        id: alert.id,
        status: next,
        version: alert.version,
        note: note.trim() || undefined,
      }),
    );
    if (updateAlertStatus.fulfilled.match(result)) {
      setNote("");
      dispatch(fetchAlertEvents(alert.id));
    }
  }

  const statusCfg = statusConfig[alert.status];
  const next = nextStatus[alert.status];

  const eventStatusColors: Record<AlertStatus, string> = {
    NEW: "border-signal-red bg-signal-red/20 text-signal-red",
    ACKNOWLEDGED: "border-signal-orange bg-signal-orange/20 text-signal-orange",
    RESOLVED: "border-signal-green bg-signal-green/20 text-signal-green",
  };

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center min-h-[100vh] p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-ink-700/60 backdrop-blur-sm -z-10"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-2xl rounded-2xl border border-ink-200 bg-gradient-to-br from-[#edcba5] to-[#ebeae5] flex flex-col max-h-[calc(100vh-2rem)] shrink-0 animate-slide-up shadow-[0_20px_20px_-8px_rgb(148_134_113_/_55%),0_24px_24px_-16px_rgba(0,0,0,0.4),0_0_0_1px_rgba(0,0,0,0.08)]">
        {/* Header */}
        <div className="p-6">
          {/* Row 1: status (left) + created by + updated time + close (right) */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className={`badge ${statusCfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            <div className="flex items-center gap-4 text-xs text-gray-900 font-medium">
              <div className="flex items-center gap-1.5">
                <User size={12} />
                Created by{" "}
                <span className="text-gray-900 font-semibold">
                  {alert.createdBy?.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-900 font-semibold">
                <Clock size={12} /> {formatDateTime(alert.createdAt)}
              </div>
              <button
                onClick={handleClose}
                className="btn-ghost p-3 shrink-0 rounded-lg hover:bg-ink-100 -m-3 ml-2"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          {/* Row 2: title */}
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 mt-3 items-baseline">
            <span className="text-sm font-medium text-gray-900">Title</span>
            <span className="text-[1rem] text-gray-900 font-semibold">
              {alert.title}
            </span>
          </div>
        </div>

        {/* Events timeline */}
        <div className="flex-1 overflow-y-auto p-6 pt-0">
          {eventsLoading ? (
            <div className="flex items-center gap-2 text-gray-900 py-8 justify-center">
              <Loader2 size={16} className="animate-spin" /> Loading events...
            </div>
          ) : selectedAlertEvents.length === 0 ? (
            <p className="text-gray-900 font-medium text-sm text-center py-8">
              No events yet
            </p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-4 bottom-4 w-px bg-ink-200" />
              <div className="space-y-4">
                {selectedAlertEvents.map((event, i) => (
                  <div
                    key={event.id}
                    className="flex gap-4 relative animate-fade-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${eventStatusColors[event.toStatus]}`}
                    >
                      {event.toStatus === "RESOLVED" ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-current" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 bg-ink-50 rounded-xl p-3 border border-ink-200">
                      {/* Row 1: status + user + time */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs shrink-0">
                          {event.fromStatus ? (
                            <>
                              <span
                                className={`badge ${statusConfig[event.fromStatus].badge} py-0.5`}
                              >
                                {statusConfig[event.fromStatus].label}
                              </span>
                              <ArrowRight size={10} className="text-ink-500" />
                              <span
                                className={`badge ${statusConfig[event.toStatus].badge} py-0.5`}
                              >
                                {statusConfig[event.toStatus].label}
                              </span>
                            </>
                          ) : (
                            <span
                              className={`badge ${statusConfig[event.toStatus].badge} py-0.5 rounded-full font-semibold`}
                            >
                              Create
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-ink-500 shrink-0">
                          <User size={10} />
                          <span className="text-gray-900 font-medium">
                            {event.user?.name}
                          </span>
                          <span className="text-ink-400">·</span>
                          <span className="text-gray-900 font-medium whitespace-nowrap">
                            {formatDateTime(event.createdAt)}
                          </span>
                        </div>
                      </div>
                      {/* Row 2: description */}
                      {alert.description ? (
                        <p className="text-ink-600 text-sm mt-2 bg-ink-100 rounded-lg px-3 py-2  break-words">
                          {alert.description}
                        </p>
                      ) : event.note ? (
                        <p className="text-ink-600 text-sm mt-2 bg-ink-100 rounded-lg px-3 py-2  break-words">
                          "{event.note}"
                        </p>
                      ) : null}
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
                        Note{" "}
                        <span className="text-ink-500 normal-case font-normal">
                          optional
                        </span>
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
                      className={`btn-primary w-full justify-center ${next === "RESOLVED" ? "!bg-signal-green hover:!bg-emerald-600" : ""}`}
                      onClick={handleAdvance}
                      disabled={updateLoading}
                    >
                      {updateLoading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />{" "}
                          Updating...
                        </>
                      ) : (
                        <>
                          <ArrowRight size={14} />{" "}
                          {nextStatusLabel[alert.status]} Alert
                        </>
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

  return createPortal(modal, document.body);
}
