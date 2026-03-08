import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchAlerts,
  fetchAlertById,
  setFilterStatus,
  setOffset,
  setSearchQuery,
} from '../../../store/slices/alertsSlice';
import { AlertStatus } from '../../../types';

export function useAlerts() {
  const dispatch = useAppDispatch();
  const alertsState = useAppSelector((s) => s.alerts);
  const userId = useAppSelector((s) => s.auth.userId);
  const { filterStatus, searchQuery, limit, offset } = alertsState;

  function load() {
    dispatch(
      fetchAlerts({
        status: filterStatus || undefined,
        search: (searchQuery ?? '').trim() || undefined,
        limit,
        offset,
      }),
    );
  }

  useEffect(() => {
    load();
  }, [userId, filterStatus, searchQuery, offset, limit]);

  return {
    ...alertsState,
    load,
    handleStatusFilter: (val: AlertStatus | '') => dispatch(setFilterStatus(val)),
    handleSetOffset: (val: number) => dispatch(setOffset(val)),
    handleSearchQuery: (val: string) => dispatch(setSearchQuery(val)),
    handleSelectAlert: (id: string) => dispatch(fetchAlertById(id)),
  };
}
