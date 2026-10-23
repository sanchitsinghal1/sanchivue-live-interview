import api from './axiosInstance.js';

// Evaluations API — matches `/api/v1/evaluations/*`.
export const evaluationApi = {
  get: (interviewId) => api.get(`/evaluations/${interviewId}`),
  create: (interviewId, payload) => api.post(`/evaluations/${interviewId}`, payload),
};

export default evaluationApi;
