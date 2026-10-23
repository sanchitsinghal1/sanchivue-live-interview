import api from './axiosInstance.js';

// Auth API surface — matches the backend `/api/v1/auth/*` routes.
export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  me: () => api.get('/auth/me'),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
  changePassword: (payload) => api.post('/auth/change-password', payload),
};

export default authApi;
