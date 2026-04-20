import { employeApi } from './axios';

const BASE = '/api/Employee';

export const employeService = {
  getAll() {
    return employeApi.get(`${BASE}/get-all-employees`);
  },

  getById(id) {
    return employeApi.get(`${BASE}/get-employee/${id}`);
  },

  create(data) {
    return employeApi.post(`${BASE}/create-employee`, data);
  },

  update(id, data) {
    return employeApi.put(`${BASE}/update-employee/${id}`, data);
  },

  delete(id) {
    return employeApi.delete(`${BASE}/delete-employee/${id}`);
  },
};
