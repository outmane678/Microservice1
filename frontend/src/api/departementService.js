import { departementApi } from './axios';

const BASE = '/api/Departments';

export const departementService = {
  getAll() {
    return departementApi.get(`${BASE}/get-all-departments`);
  },

  getById(id) {
    return departementApi.get(`${BASE}/get-departement/${id}`);
  },

  create(data) {
    return departementApi.post(`${BASE}/create-departement`, data);
  },

  update(id, data) {
    return departementApi.put(`${BASE}/update-departement/${id}`, data);
  },

  delete(id) {
    return departementApi.delete(`${BASE}/delete-departement/${id}`);
  },
};
