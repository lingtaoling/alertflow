import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Organization, User } from '../../types';

const TOKEN_KEY = 'accessToken';

interface AuthState {
  accessToken: string | null;
  orgId: string | null;
  userId: string | null;
  org: Organization | null;
  user: User | null;
}

const stored = {
  accessToken: localStorage.getItem(TOKEN_KEY),
  orgId: localStorage.getItem('orgId'),
  userId: localStorage.getItem('userId'),
};

const initialState: AuthState = {
  accessToken: stored.accessToken,
  orgId: stored.orgId,
  userId: stored.userId,
  org: null,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{ accessToken: string; org: Organization; user: User }>) {
      state.accessToken = action.payload.accessToken;
      state.orgId = action.payload.org.id;
      state.userId = action.payload.user.id;
      state.org = action.payload.org;
      state.user = action.payload.user;
      localStorage.setItem(TOKEN_KEY, action.payload.accessToken);
      localStorage.setItem('orgId', action.payload.org.id);
      localStorage.setItem('userId', action.payload.user.id);
    },
    clearSession(state) {
      state.accessToken = null;
      state.orgId = null;
      state.userId = null;
      state.org = null;
      state.user = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('orgId');
      localStorage.removeItem('userId');
    },
    setOrgDetails(state, action: PayloadAction<Organization>) {
      state.org = action.payload;
    },
    setUserDetails(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
  },
});

export const { setSession, clearSession, setOrgDetails, setUserDetails } = authSlice.actions;
export default authSlice.reducer;
