import api from './axiosInstance.js';

// Interview API surface — matches `/api/v1/interviews/*`.
// List supports `?page&limit&status&search`.
export const interviewApi = {
  list: (params = {}) => api.get('/interviews', { params }),
  create: (payload) => api.post('/interviews', payload),
  get: (id) => api.get(`/interviews/${id}`),
  update: (id, payload) => api.patch(`/interviews/${id}`, payload),
  join: (id) => api.post(`/interviews/${id}/join`),
  saveSnapshot: (id, payload) => api.post(`/interviews/${id}/snapshots`, payload),
  recordProctoring: (id, payload) => api.post(`/interviews/${id}/proctoring`, payload),
  sendChat: (id, payload) => api.post(`/interviews/${id}/chat`, payload),
  end: (id) => api.post(`/interviews/${id}/end`),
  // Convenience: validate a candidate invitation token before joining.
  validateInvitation: (token) => api.get(`/interviews/invitations/${token}`),
};

export default interviewApi;
