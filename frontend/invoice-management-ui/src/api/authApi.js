import apiClient from './apiClient';

export const authApi = {
  login: async (email, password) => {
    const res = await apiClient.post('/api/auth/login', { email, password });
    return res.data;
  },
};
