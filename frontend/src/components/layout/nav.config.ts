import { AlertCircle, BarChart3, Users, Building2, LucideIcon } from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/alerts',        label: 'Alerts',        icon: AlertCircle  },
  { path: '/analytics',    label: 'Analytics',     icon: BarChart3    },
  { path: '/users',         label: 'Users',         icon: Users,        adminOnly: true },
  { path: '/organizations', label: 'Organizations', icon: Building2,    adminOnly: true },
];
