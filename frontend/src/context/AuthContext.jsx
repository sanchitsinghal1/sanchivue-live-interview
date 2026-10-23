import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import authApi from '../api/auth.api.js';
import { setAuthToken, clearAuthToken } from '../api/axiosInstance.js';
import { disconnectSocket } from '../services/socket.js';
import storage from '../utils/storage.js';
import { ROLES } from '../constants/index.js';

// AuthContext holds the in-memory user + token. We hydrate from localStorage on
// mount so a page refresh keeps the user signed in (the httpOnly cookie handles
// the actual auth; the localStorage copy is just for UI state).
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => storage.get('user', null));
  const [token, setToken] = useState(() => storage.get('token', null));
  const [loading, setLoading] = useState(true);

  // Hydrate: ONLY if we have a stored token do we call `/auth/me` to refresh
  // the user record. A brand-new visitor with no token must NEVER trigger the
  // auth/refresh chain — otherwise they see spurious "session expired" toasts
  // the moment the site loads.
  const bootstrap = useCallback(async () => {
    const storedToken = storage.get('token', null);
    if (!storedToken) {
      // No prior session — nothing to restore. Stay logged out silently.
      setLoading(false);
      return;
    }
    setAuthToken(storedToken);
    try {
      const res = await authApi.me();
      const u = res?.data?.data;
      if (u) {
        setUser(u);
        storage.set('user', u);
      } else {
        clearAll();
      }
    } catch {
      // `/auth/me` failed even with a token (cookie expired, etc). Clear
      // silently — the user will be prompted to log in by ProtectedRoute.
      clearAll();
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const clearAll = useCallback(() => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    clearAuthToken();
    storage.remove('user');
    storage.remove('token');
    disconnectSocket();
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    const data = res?.data?.data || {};
    const u = data.user;
    const t = data.accessToken;
    if (u) {
      setUser(u);
      storage.set('user', u);
    }
    if (t) {
      setToken(t);
      setAuthToken(t);
      storage.set('token', t);
    }
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload);
    const data = res?.data?.data || {};
    const u = data.user;
    const t = data.accessToken;
    if (u) {
      setUser(u);
      storage.set('user', u);
    }
    if (t) {
      setToken(t);
      setAuthToken(t);
      storage.set('token', t);
    }
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the server-side logout fails (e.g. cookie already expired),
      // wipe local state so the UI reflects the signed-out reality.
    }
    clearAll();
  }, [clearAll]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      const u = res?.data?.data;
      if (u) {
        setUser(u);
        storage.set('user', u);
      }
      return u;
    } catch {
      return null;
    }
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      storage.set('user', next);
      return next;
    });
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isInterviewer:
      user?.role === ROLES.INTERVIEWER || user?.role === ROLES.ADMIN,
    isCandidate: user?.role === ROLES.CANDIDATE,
    login,
    register,
    logout,
    refreshUser,
    updateUser,
    clearAll,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider.');
  return ctx;
}

export default AuthContext;
