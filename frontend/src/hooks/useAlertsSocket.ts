import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAlerts, fetchAlertById, fetchAlertEvents } from '../store/slices/alertsSlice';
import { store } from '../store';

/**
 * Connects to the alerts WebSocket and refreshes data on alert:created / alert:updated.
 * Call this from a component that is mounted when the user is authenticated (e.g. AlertsPage).
 */
export function useAlertsSocket() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);

  useEffect(() => {
    if (!accessToken) return;

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
  }, [accessToken, dispatch]);
}
