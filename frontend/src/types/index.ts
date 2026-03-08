export type AlertStatus = 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  _count?: { users: number; alerts: number };
}

export type UserRole = 'admin' | 'normal';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
  orgId: string;
  createdAt: string;
  organization?: { id: string; name: string };
}

export interface Alert {
  id: string;
  title: string;
  description?: string;
  status: AlertStatus;
  orgId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string; email: string };
  _count?: { alertEvents: number };
}

export interface AlertEvent {
  id: string;
  alertId: string;
  userId: string;
  fromStatus: AlertStatus | null;
  toStatus: AlertStatus;
  note?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  /** Optional: total counts by status (alerts list) — unchanged by filter/pagination */
  counts?: { total: number; NEW: number; ACKNOWLEDGED: number; RESOLVED: number };
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
}
