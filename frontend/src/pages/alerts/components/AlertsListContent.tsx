import { Alert, AlertStatus } from "../../../types";
import AlertCard from "./AlertCard";
import { Plus, RefreshCw, Zap, AlertCircle, Loader2 } from "lucide-react";

interface Props {
  loading: boolean;
  error: string | null;
  items: Alert[];
  searchQuery: string | undefined;
  filterStatus: AlertStatus | "" | undefined;
  onRetry: () => void;
  onCreateAlert: () => void;
  onSelectAlert: (id: string) => void;
  showOrg: boolean;
}

export default function AlertsListContent({
  loading,
  error,
  items,
  searchQuery,
  filterStatus,
  onRetry,
  onCreateAlert,
  onSelectAlert,
  showOrg,
}: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-ink-500">
        <Loader2 size={18} className="animate-spin" />
        <span>Loading alerts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <AlertCircle size={24} className="text-signal-red mx-auto mb-2" />
        <p className="text-signal-red text-sm">{error}</p>
        <button className="btn-ghost mt-3 mx-auto" onClick={onRetry}>
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-ink-100 border border-ink-200 flex items-center justify-center mx-auto mb-4">
          <Zap size={20} className="text-signal-orange" />
        </div>
        <p className="text-ink-700 font-medium mb-1">No alerts found</p>
        <p className="text-ink-500 text-sm mb-4">
          {(searchQuery ?? "").trim()
            ? `No alerts matching "${(searchQuery ?? "").trim()}"`
            : filterStatus
              ? `No alerts with status "${filterStatus}"`
              : "Create your first alert to get started"}
        </p>
        <button className="btn-primary mx-auto" onClick={onCreateAlert}>
          <Plus size={14} /> Create Alert
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onClick={() => onSelectAlert(alert.id)}
          showOrg={showOrg}
        />
      ))}
    </div>
  );
}
