import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { AlertStatus } from "../../types";
import { useAlerts } from "./hooks/useAlerts";
import { useAlertsSocket } from "../../hooks/useAlertsSocket";
import AlertsListContent from "./components/AlertsListContent";
import AlertDetailModal from "./components/AlertDetailModal";
import CreateAlertForm from "./components/CreateAlertForm";
import { AlertCircle, CheckCircle2, Activity } from "lucide-react";
import Pagination from "../../components/ui/Pagination";
import AlertStatsGrid from "./components/AlertStatsGrid";
import AlertsPageHeader from "./components/AlertsPageHeader";

export default function AlertsPage() {
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
      <AlertsPageHeader
        isAdmin={isAdmin}
        orgName={org?.name}
        searchQuery={searchQuery}
        onSearchChange={handleSearchQuery}
        onCreateAlert={() => setShowCreateForm(true)}
      />

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
