import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Organization, User } from '../../types';

const TOKEN_KEY = 'accessToken';
const ORG_KEY = 'auth_org';
const USER_KEY = 'auth_user';

function parseStored<T>(key: string): T | null {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
}

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
  org: parseStored<Organization>(ORG_KEY),
  user: parseStored<User>(USER_KEY),
};

const initialState: AuthState = {
  accessToken: stored.accessToken,
  orgId: stored.orgId,
  userId: stored.userId,
  org: stored.org,
  user: stored.user,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{ accessToken: string; org: Organization | null; user: User }>) {
      state.accessToken = action.payload.accessToken;
      state.orgId = action.payload.org?.id ?? null;
      state.userId = action.payload.user.id;
      state.org = action.payload.org;
      state.user = action.payload.user;
      localStorage.setItem(TOKEN_KEY, action.payload.accessToken);
      if (action.payload.org) {
        localStorage.setItem('orgId', action.payload.org.id);
        localStorage.setItem(ORG_KEY, JSON.stringify(action.payload.org));
      } else {
        localStorage.removeItem('orgId');
        localStorage.removeItem(ORG_KEY);
      }
      localStorage.setItem('userId', action.payload.user.id);
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
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
      localStorage.removeItem(ORG_KEY);
      localStorage.removeItem(USER_KEY);
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
