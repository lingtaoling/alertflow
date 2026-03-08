import { useState } from "react";
import { useAppDispatch } from "../../store/hooks";
import { useAuth } from "../../hooks/useAuth";
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
import StatsCard from "../../components/ui/StatsCard";
import parkleOrangeSvg from "../../assets/images/parkle-orange.svg";

const STATUS_FILTERS: { label: string; value: AlertStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "New", value: "NEW" },
  { label: "Acknowledged", value: "ACKNOWLEDGED" },
  { label: "Resolved", value: "RESOLVED" },
];

export default function AlertsPage() {
  const dispatch = useAppDispatch();
  const { org, isAdmin } = useAuth();
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
    iconBg: string;
    iconColor: string;
    filterValue: AlertStatus | "";
  }[] = [
    {
      label: "Total",
      value: counts?.total ?? total,
      icon: Activity,
      iconBg: "bg-ink-100 border border-ink-200",
      iconColor: "text-ink-600",
      filterValue: "",
    },
    {
      label: "New",
      value: counts?.NEW ?? 0,
      icon: AlertCircle,
      iconBg: "bg-signal-red/15 border border-signal-red/30",
      iconColor: "text-red-700",
      filterValue: "NEW",
    },
    {
      label: "Acknowledged",
      value: counts?.ACKNOWLEDGED ?? 0,
      icon: Activity,
      iconBg: "bg-signal-orange/15 border border-signal-orange/30",
      iconColor: "text-orange-700",
      filterValue: "ACKNOWLEDGED",
    },
    {
      label: "Resolved",
      value: counts?.RESOLVED ?? 0,
      icon: CheckCircle2,
      iconBg: "bg-signal-green/15 border border-signal-green/30",
      iconColor: "text-green-700",
      filterValue: "RESOLVED",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-3 py-6">
      <div className="flex items-center justify-between gap-4 mb-2">
        <h1 className="text-lg font-semibold text-ink-700">
          Alerts
          {isAdmin ? " – All organizations" : org?.name ? ` – ${org.name}` : ""}
        </h1>
        <div className="flex items-center gap-2">
          <div className="new-alert-btn-wrapper group relative inline-flex overflow-visible">
            <button
              className="btn-primary px-3 py-1.5 text-base font-bold bg-transparent hover:bg-transparent text-signal-orange relative z-10"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus size={12} />
              <span className="hidden sm:inline">New Alert</span>
            </button>
            <img
              src={parkleOrangeSvg}
              alt=""
              className="new-alert-parkle absolute inset-0 w-full h-full object-contain opacity-0 pointer-events-none transition-opacity duration-200 z-10 object-center origin-center scale-x-125 translate-x-2"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6 overflow-visible">
        {stats.map((s, i) => {
          const isActive = filterStatus === s.filterValue;
          const activeClass =
            isActive && s.filterValue === ""
              ? "stats-card-active-total"
              : isActive && s.filterValue === "NEW"
                ? "stats-card-active-new"
                : isActive && s.filterValue === "ACKNOWLEDGED"
                  ? "stats-card-active-ack"
                  : isActive && s.filterValue === "RESOLVED"
                    ? "stats-card-active-resolved"
                    : "";
          return (
            <StatsCard
              key={s.label}
              label={s.label}
              value={s.value}
              icon={s.icon}
              iconBg={s.iconBg}
              iconColor={s.iconColor}
              activeClass={activeClass}
              onClick={() => handleStatusFilter(s.filterValue)}
              animationDelay={i * 50}
            />
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
              showOrg={isAdmin}
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
