import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchAlerts,
  fetchAlertById,
  setFilterStatus,
  setOffset,
} from '../../../store/slices/alertsSlice';
import { AlertStatus } from '../../../types';

export function useAlerts() {
  const dispatch = useAppDispatch();
  const alertsState = useAppSelector((s) => s.alerts);
  const userId = useAppSelector((s) => s.auth.userId);
  const { filterStatus, limit, offset } = alertsState;

  function load() {
    dispatch(fetchAlerts({ status: filterStatus || undefined, limit, offset }));
  }

  useEffect(() => {
    load();
  }, [userId, filterStatus, offset, limit]);

  return {
    ...alertsState,
    load,
    handleStatusFilter: (val: AlertStatus | '') => dispatch(setFilterStatus(val)),
    handleSetOffset: (val: number) => dispatch(setOffset(val)),
    handleSelectAlert: (id: string) => dispatch(fetchAlertById(id)),
  };
}
