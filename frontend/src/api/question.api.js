import api from './axiosInstance.js';

// Question bank API — matches `/api/v1/questions/*`.
export const questionApi = {
  list: (params = {}) => api.get('/questions', { params }),
  create: (payload) => api.post('/questions', payload),
  get: (id) => api.get(`/questions/${id}`),
  update: (id, payload) => api.patch(`/questions/${id}`, payload),
  delete: (id) => api.delete(`/questions/${id}`),
  // GET /questions/export — downloads the org's non-archived questions as a
  // JSON attachment. Hidden tests are included only for interviewer+ requesters.
  // The backend sets Content-Disposition: attachment so a browser-side fetch
  // returns the JSON body as `data.questions`.
  exportJson: (params = {}) =>
    api.get('/questions/export', {
      params,
      headers: { Accept: 'application/json' },
    }),
  // POST /questions/import — accepts { questions: [...] }, validates + dedupes
  // by (orgId, slug), returns { imported, skipped, errors[] }.
  importJson: (payload) => api.post('/questions/import', payload),
  // POST /questions/ai-generate-question — topic + difficulty + type →
  // question preview (NOT persisted). The user reviews + edits in the form,
  // then clicks Save which calls `create`.
  aiGenerateQuestion: (payload) => api.post('/questions/ai-generate-question', payload),
};

export default questionApi;
