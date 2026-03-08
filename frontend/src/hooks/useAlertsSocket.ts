import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAlerts, fetchAlertById, fetchAlertEvents } from '../store/slices/alertsSlice';
import { store } from '../store';

/**
 * Connects to the alerts WebSocket only when the user is on the alerts page.
 * Refreshes data on alert:created / alert:updated. Disconnects when navigating away.
 */
export function useAlertsSocket() {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const accessToken = useAppSelector((s) => s.auth.accessToken);

  const isOnAlertsPage = pathname === '/alerts' || pathname.startsWith('/alerts');

  useEffect(() => {
    if (!accessToken || !isOnAlertsPage) return;

    const socket = io({
      path: '/socket.io',
      auth: { token: accessToken },
    });

    socket.on('alert:created', () => {
      const { filterStatus, limit, offset } = store.getState().alerts;
      dispatch(fetchAlerts({ status: filterStatus || undefined, limit, offset }));
    });

    socket.on('alert:updated', (payload: { id: string }) => {
      const { filterStatus, limit, offset, selectedAlert } = store.getState().alerts;
      dispatch(fetchAlerts({ status: filterStatus || undefined, limit, offset }));
      if (selectedAlert?.id === payload?.id) {
        dispatch(fetchAlertById(payload.id));
        dispatch(fetchAlertEvents(payload.id));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, isOnAlertsPage, dispatch]);
}
