import { LucideIcon } from "lucide-react";
import StatsCard from "../../../components/ui/StatsCard";
import { AlertStatus } from "../../../types";

export interface AlertStatItem {
  label: string;
  value: number;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  filterValue: AlertStatus | "";
}

interface Props {
  stats: AlertStatItem[];
  filterStatus: AlertStatus | "" | undefined;
  onStatusFilter: (value: AlertStatus | "") => void;
}

export default function AlertStatsGrid({
  stats,
  filterStatus,
  onStatusFilter,
}: Props) {
  return (
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
            onClick={() => onStatusFilter(s.filterValue)}
            animationDelay={i * 50}
          />
        );
      })}
    </div>
  );
}
