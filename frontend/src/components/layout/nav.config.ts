import { AlertCircle, Users, Building2, LucideIcon } from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/alerts', label: 'Alerts', icon: AlertCircle },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/organizations', label: 'Organizations', icon: Building2 },
];
