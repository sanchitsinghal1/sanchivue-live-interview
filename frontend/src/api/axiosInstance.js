import axios from 'axios';
import toast from 'react-hot-toast';
import storage from '../utils/storage.js';

// We store the in-memory access token here so the request interceptor can
// attach it as a Bearer header. The AuthContext calls setAuthToken() after
// login/refresh so the rest of the app picks it up.
let authToken = null;
export const getAuthToken = () => authToken;
export const setAuthToken = (token) => {
  authToken = token || null;
};
export const clearAuthToken = () => {
  authToken = null;
};

// A simple subscriber queue: while a token refresh is in flight, every other
// 401'd request is held here and replayed once the refresh resolves.
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true, // send httpOnly JWT cookies
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request interceptor: attach Authorization header if we have a token ---
axiosInstance.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// --- Response interceptor: 401 → refresh once, otherwise toast ---
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    // Network failure or server unreachable — toast only for genuine network
    // errors (not for 401s on public pages, which are expected).
    if (!error.response) {
      toast.error('Network error — please check your connection.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // If the failing request IS the refresh endpoint itself, we know the
    // session is truly gone. Clear silently — do NOT toast here (the caller
    // decides whether to surface a message). This prevents new visitors from
    // seeing "Refresh token required" the moment the site loads.
    if (originalRequest.url?.includes('/auth/refresh')) {
      clearAuthToken();
      // Only redirect to login if the user was actually authenticated (had a
      // token in memory). A brand-new visitor has no token, so we stay put.
      if (getAuthToken() === null && storageHasToken()) {
        redirectToLogin();
        toast.error('Your session has expired. Please log in again.');
      }
      return Promise.reject(error);
    }

    if (status === 401) {
      // Avoid infinite loops: if we already retried this request, bail.
      if (originalRequest._retry) {
        clearAuthToken();
        return Promise.reject(error);
      }

      // If there's no token at all, the user is simply not authenticated —
      // don't attempt a refresh and don't toast. The caller (e.g. a
      // ProtectedRoute or a data fetch) handles the redirect.
      if (!getAuthToken() && !storageHasToken()) {
        return Promise.reject(error);
      }

      // Try ONE refresh; if it works, replay the queued requests.
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axiosInstance.post('/auth/refresh');
        const newToken = refreshRes?.data?.data?.accessToken;
        if (newToken) {
          setAuthToken(newToken);
        }
        processQueue(null, newToken);
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthToken();
        // Only toast + redirect if the user WAS signed in. A first-time
        // visitor triggering a 401 on a public endpoint should see nothing.
        if (storageHasToken()) {
          redirectToLogin();
          toast.error('Your session has expired. Please log in again.');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Friendly toast for other errors (4xx/5xx). Ignore 422 validation errors
    // since the form layer surfaces those inline.
    if (status >= 500) {
      toast.error(data?.message || 'Server error. Please try again.');
    } else if (status >= 400 && status !== 422) {
      toast.error(data?.message || 'Something went wrong.');
    }
    return Promise.reject(error);
  },
);

// Helper: check if a token exists in localStorage (means the user was signed
// in at some point). Uses the storage helper so the prefix stays consistent.
function storageHasToken() {
  return !!storage.get('token', null);
}

// Helper: soft redirect to login preserving the current path.
function redirectToLogin() {
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    const from = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?from=${from}`;
  }
}

// Convenience: extract the paginated items array from a standardized
// `{success, data: {items, total, page, limit, totalPages}}` response.
// Falls back gracefully if `data` is already a bare array (older endpoints).
export function extractItems(res) {
  const payload = res?.data?.data;
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
}

export default axiosInstance;
