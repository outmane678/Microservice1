import { authApi } from './axios';

export const authService = {
  login(credentials) {
    return authApi.post('/api/Auth/login', credentials);
  },

  register(data) {
    return authApi.post('/api/Auth/register', data);
  },

  getProfile() {
    return authApi.get('/api/Auth/profile');
  },
};
