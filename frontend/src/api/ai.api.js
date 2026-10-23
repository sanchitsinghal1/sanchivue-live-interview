import api from './axiosInstance.js';

// AI helper API — matches `/api/v1/ai/*`.
export const aiApi = {
  copilot: (payload) => api.post('/ai/copilot', payload),
  assessment: (payload) => api.post('/ai/assessment', payload),
  summary: (payload) => api.post('/ai/summary', payload),
  followups: (payload) => api.post('/ai/followups', payload),
};

export default aiApi;
