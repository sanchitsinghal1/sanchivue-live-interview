import api from './axiosInstance.js';

// User profile API surface — matches `/api/v1/users/*`.
export const userApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (payload) => api.patch('/users/me', payload),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadResume: (file) => {
    const form = new FormData();
    form.append('resume', file);
    return api.post('/users/me/resume', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default userApi;
