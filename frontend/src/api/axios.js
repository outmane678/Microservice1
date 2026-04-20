import axios from 'axios';

const isDev = import.meta.env.DEV;

const BASE_URLS = {
  auth: isDev ? 'http://localhost:5003' : '',
  employe: isDev ? 'http://localhost:5245' : '',
  departement: isDev ? 'http://localhost:5022' : '',
};

function createInstance(baseURL) {
  const instance = axios.create({ baseURL });

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

export const authApi = createInstance(BASE_URLS.auth);
export const employeApi = createInstance(BASE_URLS.employe);
export const departementApi = createInstance(BASE_URLS.departement);
