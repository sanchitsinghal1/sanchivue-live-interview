import api from './axiosInstance.js';

// InterviewTemplate API — matches `/api/v1/interview-templates/*`.
// Templates bundle a question set + rubric + duration + allowed languages so a
// recruiter can launch a role-ready interview in one click.
export const templateApi = {
  list: (params = {}) => api.get('/interview-templates', { params }),
  get: (id) => api.get(`/interview-templates/${id}`),
  create: (payload) => api.post('/interview-templates', payload),
  update: (id, payload) => api.patch(`/interview-templates/${id}`, payload),
  delete: (id) => api.delete(`/interview-templates/${id}`),
};

export default templateApi;
