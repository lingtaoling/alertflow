import { Alert } from '../../../types';
import { statusConfig } from '../../../utils/alertStatus';
import { formatRelativeTime } from '../../../utils/format';
import { Clock, User, Activity } from 'lucide-react';

interface Props {
  alert: Alert;
  onClick: () => void;
}

export default function AlertCard({ alert, onClick }: Props) {
  const status = statusConfig[alert.status];

  return (
    <div
      className="card-hover p-4 cursor-pointer group animate-fade-in"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${status.dot} ${alert.status === 'NEW' ? 'animate-pulse-slow' : ''}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              className={`text-sm font-semibold text-ink-700 transition-colors break-words ${
                alert.status === 'NEW'
                  ? 'group-hover:text-signal-red'
                  : alert.status === 'ACKNOWLEDGED'
                    ? 'group-hover:text-signal-orange'
                    : 'group-hover:text-signal-green'
              }`}
            >
              {alert.title}
            </h3>
          </div>
          {alert.description && (
            <p className="text-ink-400 text-xs mb-2 line-clamp-2">{alert.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-ink-500 flex-wrap">
            <span className={`badge ${status.badge} py-0.5`}>{status.label}</span>
            {alert.createdBy && (
              <span className="flex items-center gap-1">
                <User size={10} /> {alert.createdBy.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={10} /> {formatRelativeTime(alert.createdAt)}
            </span>
            {alert._count?.alertEvents !== undefined && (
              <span className="flex items-center gap-1">
                <Activity size={10} /> {alert._count.alertEvents} event{alert._count.alertEvents !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
