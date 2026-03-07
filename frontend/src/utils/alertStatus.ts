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
