import api from './axiosInstance.js';

// Notifications API — matches `/api/v1/notifications/*`.
export const notificationApi = {
  list: (params = {}) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  updatePreferences: (payload) => api.patch('/notifications/preferences', payload),
};

export default notificationApi;
