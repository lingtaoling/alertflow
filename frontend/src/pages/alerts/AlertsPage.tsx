import { useState } from "react";
import { useAppDispatch } from "../../store/hooks";
import { clearSelected } from "../../store/slices/alertsSlice";
import { AlertStatus } from "../../types";
import { useAlerts } from "./hooks/useAlerts";
import { useAlertsSocket } from "../../hooks/useAlertsSocket";
import AlertCard from "./components/AlertCard";
import AlertDetailModal from "./components/AlertDetailModal";
import CreateAlertForm from "./components/CreateAlertForm";
import { statusConfig } from "../../utils/alertStatus";
import {
  Plus,
  RefreshCw,
  Zap,
  AlertCircle,
  CheckCircle2,
  Activity,
  Loader2,
} from "lucide-react";
import Pagination from "../../components/ui/Pagination";

const STATUS_FILTERS: { label: string; value: AlertStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "New", value: "NEW" },
  { label: "Acknowledged", value: "ACKNOWLEDGED" },
  { label: "Resolved", value: "RESOLVED" },
];

export default function AlertsPage() {
  const dispatch = useAppDispatch();
  useAlertsSocket();
  const {
    items,
    total,
    counts,
    loading,
    error,
    filterStatus,
    limit,
    offset,
    selectedAlert,
    load,
    handleStatusFilter,
    handleSetOffset,
    handleSelectAlert,
  } = useAlerts();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const stats: {
    label: string;
    value: number;
    icon: typeof Activity;
    color: string;
    filterValue: AlertStatus | "";
  }[] = [
    {
      label: "Total",
      value: counts?.total ?? total,
      icon: Activity,
      color: "text-ink-600",
      filterValue: "",
    },
    {
      label: "New",
      value: counts?.NEW ?? 0,
      icon: AlertCircle,
      color: "text-signal-red",
      filterValue: "NEW",
    },
    {
      label: "Acknowledged",
      value: counts?.ACKNOWLEDGED ?? 0,
      icon: Activity,
      color: "text-signal-orange",
      filterValue: "ACKNOWLEDGED",
    },
    {
      label: "Resolved",
      value: counts?.RESOLVED ?? 0,
      icon: CheckCircle2,
      color: "text-signal-green",
      filterValue: "RESOLVED",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-lg font-semibold text-ink-700">Alerts</h1>
        <div className="flex items-center gap-2">
          <button
            className="btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Alert</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => {
          const isActive = filterStatus === s.filterValue;
          const cfg = s.filterValue ? statusConfig[s.filterValue] : null;
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => handleStatusFilter(s.filterValue)}
              className={`card p-3 text-left w-full transition-all card-hover cursor-pointer ${
                isActive
                  ? cfg
                    ? "border-2 " + cfg.badge
                    : "border-2 border-ink-600 bg-ink-700/5"
                  : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <s.icon size={13} className={s.color} />
                <span className="text-ink-500 text-xs">{s.label}</span>
              </div>
              <div className="text-2xl font-display font-bold text-ink-700">
                {s.value}
              </div>
            </button>
          );
        })}
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
            {filterStatus
              ? `No alerts with status "${filterStatus}"`
              : "Create your first alert to get started"}
          </p>
          <button
            className="btn-primary mx-auto"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus size={14} /> Create Alert
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onClick={() => handleSelectAlert(alert.id)}
            />
          ))}
        </div>
      )}

      <Pagination
        total={total}
        limit={limit}
        offset={offset}
        onPageChange={handleSetOffset}
        itemLabel="alert"
      />

      {showCreateForm && (
        <CreateAlertForm onClose={() => setShowCreateForm(false)} />
      )}
      {selectedAlert && <AlertDetailModal alert={selectedAlert} />}
    </div>
  );
}
