import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Organization, User } from '../../types';

interface AuthState {
  orgId: string | null;
  userId: string | null;
  org: Organization | null;
  user: User | null;
}

const stored = {
  orgId: localStorage.getItem('orgId'),
  userId: localStorage.getItem('userId'),
};

const initialState: AuthState = {
  orgId: stored.orgId,
  userId: stored.userId,
  org: null,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{ org: Organization; user: User }>) {
      state.orgId = action.payload.org.id;
      state.userId = action.payload.user.id;
      state.org = action.payload.org;
      state.user = action.payload.user;
      localStorage.setItem('orgId', action.payload.org.id);
      localStorage.setItem('userId', action.payload.user.id);
    },
    clearSession(state) {
      state.orgId = null;
      state.userId = null;
      state.org = null;
      state.user = null;
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
