import api from './axiosInstance.js';

// Submissions API — matches `/api/v1/submissions/*`.
export const submissionApi = {
  run: (payload) => api.post('/submissions/run', payload),
  submit: (payload) => api.post('/submissions/submit', payload),
  history: (params = {}) => api.get('/submissions/history', { params }),
};

export default submissionApi;
