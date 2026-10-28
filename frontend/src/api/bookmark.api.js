import api from './axiosInstance.js';

// Bookmark API — matches `/api/v1/bookmarks/*`. A bookmark is a per-user
// "starred" question. The toggle endpoint is idempotent: it creates or removes
// the bookmark depending on whether one already exists.
export const bookmarkApi = {
  // GET /bookmarks — paginated list of the caller's bookmarked questions.
  // Hidden tests are stripped by the backend projection.
  list: (params = {}) => api.get('/bookmarks', { params }),
  // POST /bookmarks/:questionId — create or remove the bookmark; returns
  // { bookmarked: boolean }.
  toggle: (questionId) => api.post(`/bookmarks/${questionId}`),
  // GET /bookmarks/:questionId — cheap lookup for the card icon's initial state.
  isBookmarked: (questionId) => api.get(`/bookmarks/${questionId}`),
};

export default bookmarkApi;
