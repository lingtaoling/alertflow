import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Alert, AlertEvent, AlertStatus, PaginatedResult } from '../../types';
import { alertsApi } from '../../api';

interface AlertsState {
  items: Alert[];
  total: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  selectedAlert: Alert | null;
  selectedAlertEvents: AlertEvent[];
  eventsLoading: boolean;
  filterStatus: AlertStatus | '';
  limit: number;
  offset: number;
  createLoading: boolean;
  updateLoading: boolean;
}

const initialState: AlertsState = {
  items: [],
  total: 0,
  hasMore: false,
  loading: false,
  error: null,
  selectedAlert: null,
  selectedAlertEvents: [],
  eventsLoading: false,
  filterStatus: '',
  limit: 10,
  offset: 0,
  createLoading: false,
  updateLoading: false,
};

export const fetchAlerts = createAsyncThunk(
  'alerts/fetchAlerts',
  async (params: { status?: AlertStatus; limit?: number; offset?: number }, { rejectWithValue }) => {
    try {
      return await alertsApi.list(params);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  },
);

export const createAlert = createAsyncThunk(
  'alerts/createAlert',
  async (data: { title: string; description?: string }, { rejectWithValue }) => {
    try {
      return await alertsApi.create(data);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  },
);

export const updateAlertStatus = createAsyncThunk(
  'alerts/updateStatus',
  async ({ id, status, note }: { id: string; status: AlertStatus; note?: string }, { rejectWithValue }) => {
    try {
      return await alertsApi.updateStatus(id, { status, note });
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  },
);

export const fetchAlertById = createAsyncThunk(
  'alerts/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await alertsApi.get(id);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  },
);

export const fetchAlertEvents = createAsyncThunk(
  'alerts/fetchEvents',
  async (alertId: string, { rejectWithValue }) => {
    try {
      return await alertsApi.getEvents(alertId);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  },
);

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    setFilterStatus(state, action: PayloadAction<AlertStatus | ''>) {
      state.filterStatus = action.payload;
      state.offset = 0;
    },
    setOffset(state, action: PayloadAction<number>) {
      state.offset = action.payload;
    },
    clearSelected(state) {
      state.selectedAlert = null;
      state.selectedAlertEvents = [];
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch alerts
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action: PayloadAction<PaginatedResult<Alert>>) => {
        state.loading = false;
        state.items = action.payload.data;
        state.total = action.payload.total;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create alert
      .addCase(createAlert.pending, (state) => { state.createLoading = true; state.error = null; })
      .addCase(createAlert.fulfilled, (state, action: PayloadAction<Alert>) => {
        state.createLoading = false;
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createAlert.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload as string;
      })
      // Update status
      .addCase(updateAlertStatus.pending, (state) => { state.updateLoading = true; state.error = null; })
      .addCase(updateAlertStatus.fulfilled, (state, action: PayloadAction<Alert>) => {
        state.updateLoading = false;
        const idx = state.items.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.selectedAlert?.id === action.payload.id) state.selectedAlert = action.payload;
      })
      .addCase(updateAlertStatus.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload as string;
      })
      // Fetch by id
      .addCase(fetchAlertById.fulfilled, (state, action: PayloadAction<Alert>) => {
        state.selectedAlert = action.payload;
      })
      // Fetch events
      .addCase(fetchAlertEvents.pending, (state) => { state.eventsLoading = true; })
      .addCase(fetchAlertEvents.fulfilled, (state, action: PayloadAction<AlertEvent[]>) => {
        state.eventsLoading = false;
        state.selectedAlertEvents = action.payload;
      })
      .addCase(fetchAlertEvents.rejected, (state) => { state.eventsLoading = false; });
  },
});

export const { setFilterStatus, setOffset, clearSelected, clearError } = alertsSlice.actions;
export default alertsSlice.reducer;
