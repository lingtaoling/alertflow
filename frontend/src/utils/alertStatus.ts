import { AlertStatus } from "../types";

export const statusConfig: Record<
  AlertStatus,
  { label: string; color: string; dot: string; badge: string }
> = {
  NEW: {
    label: "New",
    color: "text-red-800",
    dot: "bg-red-700",
    badge: "bg-red-600/25 text-red-800 border border-red-600/50",
  },
  ACKNOWLEDGED: {
    label: "Acknowledged",
    color: "text-orange-400",
    dot: "bg-orange-400",
    badge: "bg-orange-600/25 text-orange-800 border border-orange-600/50",
  },
  RESOLVED: {
    label: "Resolved",
    color: "text-emerald-800",
    dot: "bg-emerald-700",
    badge: "bg-emerald-600/25 text-emerald-800 border border-emerald-600/50",
  },
};

export const nextStatus: Record<AlertStatus, AlertStatus | null> = {
  NEW: "ACKNOWLEDGED",
  ACKNOWLEDGED: "RESOLVED",
  RESOLVED: null,
};

export const nextStatusLabel: Record<AlertStatus, string> = {
  NEW: "Acknowledge",
  ACKNOWLEDGED: "Resolve",
  RESOLVED: "",
};
