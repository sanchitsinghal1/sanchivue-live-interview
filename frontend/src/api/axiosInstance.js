import axios from 'axios';
import toast from 'react-hot-toast';

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

    // Network failure or server unreachable
    if (!error.response) {
      toast.error('Network error — please check your connection.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // Avoid infinite loops: if the failing request is itself a refresh, bail.
    if (originalRequest._retry || originalRequest.url?.includes('/auth/refresh')) {
      if (status === 401) {
        clearAuthToken();
        // Soft redirect to login so we don't break the back button history.
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          const from = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?from=${from}`;
        }
      }
      const msg = data?.message || 'Request failed.';
      toast.error(msg);
      return Promise.reject(error);
    }

    if (status === 401) {
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
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          const from = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?from=${from}`;
        }
        toast.error('Your session has expired. Please log in again.');
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

export default axiosInstance;
