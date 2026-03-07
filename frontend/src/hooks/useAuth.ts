import { useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { clearSession } from '../store/slices/authSlice';

interface JwtPayload {
  sub: string;
  email: string;
  orgId: string | null;
  role: string;
  exp: number;
  iat: number;
}

/**
 * Decodes a JWT payload without verifying the signature.
 * Signature verification always happens on the server — the frontend
 * only needs to read the claims (role, expiry, etc.) for UI decisions.
 */
function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Payload = token.split('.')[1];
    const json = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(payload: JwtPayload): boolean {
  return Date.now() >= payload.exp * 1000;
}

export function useAuth() {
  const dispatch = useAppDispatch();
  const { accessToken, org, user, orgId, userId } = useAppSelector((s) => s.auth);

  const payload = useMemo(
    () => (accessToken ? decodeJwt(accessToken) : null),
    [accessToken],
  );

  const expired = payload ? isTokenExpired(payload) : true;
  const isAuthenticated = Boolean(accessToken && payload && !expired);

  const role = payload?.role ?? null;
  const isAdmin = role === 'admin';

  function logout() {
    dispatch(clearSession());
  }

  return {
    // Token state
    isAuthenticated,
    isTokenExpired: expired,
    accessToken,

    // Identity
    userId,
    orgId,
    user,
    org,

    // Role
    role,
    isAdmin,

    // Actions
    logout,
  };
}
