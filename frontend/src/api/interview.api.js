import api from './axiosInstance.js';

// Interview API surface — matches `/api/v1/interviews/*`.
// List supports `?page&limit&status&search`.
// `invite` issues a high-entropy candidate invitation token linked to this
// interview. `validateInvitation` is PUBLIC (no auth) so unauthenticated
// candidates can resolve their token from the waiting room.
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
  // Candidate invitation flow — interviewer-only.
  invite: (id, payload) => api.post(`/interviews/${id}/invite`, payload),
  listInvitations: (id) => api.get(`/interviews/${id}/invitations`),
  // Public: validate a candidate invitation token before joining. No auth
  // header required — the backend mounts this route before verifyJWT.
  validateInvitation: (token) => api.get(`/interviews/invitations/${token}`),
};

export default interviewApi;
