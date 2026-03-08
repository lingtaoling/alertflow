import { useState } from "react";
import { useAppDispatch } from "../../store/hooks";
import { useAuth } from "../../hooks/useAuth";
import { AlertStatus } from "../../types";
import { useAlerts } from "./hooks/useAlerts";
import { useAlertsSocket } from "../../hooks/useAlertsSocket";
import AlertsListContent from "./components/AlertsListContent";
import AlertDetailModal from "./components/AlertDetailModal";
import CreateAlertForm from "./components/CreateAlertForm";
import {
  Plus,
  AlertCircle,
  CheckCircle2,
  Activity,
  Search,
  X,
} from "lucide-react";
import Pagination from "../../components/ui/Pagination";
import AlertStatsGrid from "./components/AlertStatsGrid";
import parkleOrangeSvg from "../../assets/images/parkle-orange.svg";

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
    searchQuery,
    handleSearchQuery,
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
      iconColor: "text-orange-500",
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
        <h1 className="text-lg font-semibold text-ink-700 shrink-0">
          Alerts
          {isAdmin ? " – All organizations" : org?.name ? ` – ${org.name}` : ""}
        </h1>
        <div className="relative flex-1 max-w-md mx-4 min-w-0">
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {(searchQuery ?? "").trim() && (
              <button
                type="button"
                onClick={() => handleSearchQuery("")}
                className="p-0.5 rounded text-ink-400 hover:text-ink-600 hover:bg-ink-100 transition-colors"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
            <Search size={14} className="text-ink-400 shrink-0" />
          </div>
          <input
            type="text"
            placeholder="Search alerts by title or description..."
            value={searchQuery ?? ""}
            onChange={(e) => handleSearchQuery(e.target.value)}
            className="w-full pr-12 py-1.5 text-sm bg-transparent border-0 border-b border-ink-300 rounded-none placeholder:text-ink-400 text-ink-700 focus:outline-none focus:border-signal-orange focus:border-b"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
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

      <AlertStatsGrid
        stats={stats}
        filterStatus={filterStatus}
        onStatusFilter={handleStatusFilter}
      />

      <AlertsListContent
        loading={loading}
        error={error}
        items={items}
        searchQuery={searchQuery}
        filterStatus={filterStatus}
        onRetry={load}
        onCreateAlert={() => setShowCreateForm(true)}
        onSelectAlert={handleSelectAlert}
        showOrg={isAdmin}
      />

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
