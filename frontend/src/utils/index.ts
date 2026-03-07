import { AlertStatus, Severity } from '../types';

export const statusConfig: Record<AlertStatus, { label: string; color: string; dot: string; badge: string }> = {
  NEW: {
    label: 'New',
    color: 'text-signal-orange',
    dot: 'bg-signal-orange',
    badge: 'bg-orange-500/15 text-signal-orange border border-signal-orange/30',
  },
  ACKNOWLEDGED: {
    label: 'Acknowledged',
    color: 'text-signal-amber',
    dot: 'bg-signal-amber',
    badge: 'bg-amber-500/15 text-signal-amber border border-signal-amber/30',
  },
  RESOLVED: {
    label: 'Resolved',
    color: 'text-signal-green',
    dot: 'bg-signal-green',
    badge: 'bg-green-500/15 text-signal-green border border-signal-green/30',
  },
};

export const severityConfig: Record<Severity, { label: string; badge: string; icon: string }> = {
  LOW: { label: 'Low', badge: 'bg-ink-200 text-ink-600 border border-ink-300', icon: '▽' },
  MEDIUM: { label: 'Medium', badge: 'bg-orange-500/10 text-signal-orange border border-signal-orange/20', icon: '◇' },
  HIGH: { label: 'High', badge: 'bg-amber-500/10 text-signal-amber border border-signal-amber/20', icon: '△' },
  CRITICAL: { label: 'Critical', badge: 'bg-red-500/15 text-signal-red border border-signal-red/30', icon: '▲' },
};

export const nextStatus: Record<AlertStatus, AlertStatus | null> = {
  NEW: 'ACKNOWLEDGED',
  ACKNOWLEDGED: 'RESOLVED',
  RESOLVED: null,
};

export const nextStatusLabel: Record<AlertStatus, string> = {
  NEW: 'Acknowledge',
  ACKNOWLEDGED: 'Resolve',
  RESOLVED: '',
};

export function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
