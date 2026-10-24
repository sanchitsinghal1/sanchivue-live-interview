import api from './axiosInstance.js';

// Question bank API — matches `/api/v1/questions/*`.
export const questionApi = {
  list: (params = {}) => api.get('/questions', { params }),
  create: (payload) => api.post('/questions', payload),
  get: (id) => api.get(`/questions/${id}`),
  update: (id, payload) => api.patch(`/questions/${id}`, payload),
  delete: (id) => api.delete(`/questions/${id}`),
};

export default questionApi;
