import api from './axiosInstance.js';

// Organizations API — matches `/api/v1/organizations/*`.
export const organizationApi = {
  list: () => api.get('/organizations'),
  create: (payload) => api.post('/organizations', payload),
  get: (id) => api.get(`/organizations/${id}`),
  addMember: (orgId, payload) => api.post(`/organizations/${orgId}/members`, payload),
  invite: (orgId, payload) => api.post(`/organizations/${orgId}/invite`, payload),
  acceptInvitation: (token) => api.post(`/organizations/invitations/${token}/accept`),
};

export default organizationApi;
