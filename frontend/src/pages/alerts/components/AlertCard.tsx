import { Alert } from "../../../types";
import { statusConfig } from "../../../utils/alertStatus";
import { formatRelativeTime } from "../../../utils/format";
import { Clock, User } from "lucide-react";

interface Props {
  alert: Alert;
  onClick: () => void;
  showOrg?: boolean;
}

const statusHoverBg: Record<string, string> = {
  NEW: "hover:bg-signal-red/5",
  ACKNOWLEDGED: "hover:bg-signal-orange/5",
  RESOLVED: "hover:bg-signal-green/5",
};

export default function AlertCard({ alert, onClick, showOrg }: Props) {
  const status = statusConfig[alert.status];

  return (
    <div
      className={`card-hover p-3 cursor-pointer group animate-fade-in transition-colors hover:border-ink-200 ${statusHoverBg[alert.status]}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* Wide screen: single row */}
      <div className="hidden md:flex items-center gap-4">
        <div
          className={`w-2 h-2 rounded-full shrink-0 ${status.dot} ${alert.status === "NEW" ? "animate-pulse-slow" : ""}`}
        />
        <h3
          className={`min-w-0 flex-1 truncate text-sm font-semibold text-ink-700 transition-colors ${
            alert.status === "NEW"
              ? "group-hover:text-signal-red"
              : alert.status === "ACKNOWLEDGED"
                ? "group-hover:text-signal-orange"
                : "group-hover:text-signal-green"
          }`}
        >
          {alert.title}
        </h3>
        {alert.createdBy && (
          <span className="flex items-center gap-1 text-xs text-ink-500 shrink-0">
            <User size={10} /> {alert.createdBy.name}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-ink-500 shrink-0">
          <Clock size={10} /> {formatRelativeTime(alert.updatedAt)}
        </span>
        {showOrg && alert.org && (
          <span className="text-xs text-ink-500 shrink-0 truncate max-w-[8rem]">
            {alert.org.name}
          </span>
        )}
        <span
          className={`badge ${status.badge} py-0.5 px-2 text-xs min-w-[5.5rem] w-[5.5rem] justify-center shrink-0`}
        >
          {status.label}
        </span>
      </div>

      {/* Narrow screen: stacked */}
      <div className="flex flex-col gap-2 md:hidden">
        <div className="flex items-start gap-3">
          <div
            className={`mt-1 w-2 h-2 rounded-full shrink-0 ${status.dot} ${alert.status === "NEW" ? "animate-pulse-slow" : ""}`}
          />
          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm font-semibold text-ink-700 transition-colors break-words ${
                alert.status === "NEW"
                  ? "group-hover:text-signal-red"
                  : alert.status === "ACKNOWLEDGED"
                    ? "group-hover:text-signal-orange"
                    : "group-hover:text-signal-green"
              }`}
            >
              {alert.title}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-ink-500 flex-wrap pl-5">
          {alert.createdBy && (
            <span className="flex items-center gap-1">
              <User size={10} /> {alert.createdBy.name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock size={10} /> {formatRelativeTime(alert.updatedAt)}
          </span>
          {showOrg && alert.org && (
            <span className="text-xs text-ink-500">{alert.org.name}</span>
          )}
          <span
            className={`badge ${status.badge} py-0.5 px-2 text-xs min-w-[5.5rem] w-[5.5rem] justify-center`}
          >
            {status.label}
          </span>
        </div>
      </div>
    </div>
  );
}
