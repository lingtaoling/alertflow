import { AlertStatus } from '../types';

export const statusConfig: Record<AlertStatus, { label: string; color: string; dot: string; badge: string }> = {
  NEW: {
    label: 'New',
    color: 'text-signal-red',
    dot: 'bg-signal-red',
    badge: 'bg-red-500/15 text-signal-red border border-signal-red/30',
  },
  ACKNOWLEDGED: {
    label: 'Acknowledged',
    color: 'text-signal-orange',
    dot: 'bg-signal-orange',
    badge: 'bg-orange-500/15 text-signal-orange border border-signal-orange/30',
  },
  RESOLVED: {
    label: 'Resolved',
    color: 'text-signal-green',
    dot: 'bg-signal-green',
    badge: 'bg-green-500/15 text-signal-green border border-signal-green/30',
  },
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
