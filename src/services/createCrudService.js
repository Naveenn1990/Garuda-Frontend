// Factory that builds a standard CRUD service for a given resource path.
// Most modules share the same list/get/create/update/remove shape, so we generate
// them instead of repeating the code.
import api from "./api";

export function createCrudService(resource) {
  return {
    async list(params = {}) {
      const { data } = await api.get(`/${resource}`, { params });
      return data;
    },
    async get(id) {
      const { data } = await api.get(`/${resource}/${id}`);
      return data;
    },
    async create(payload) {
      const { data } = await api.post(`/${resource}`, payload);
      return data;
    },
    async update(id, payload) {
      const { data } = await api.put(`/${resource}/${id}`, payload);
      return data;
    },
    async remove(id) {
      const { data } = await api.delete(`/${resource}/${id}`);
      return data;
    },
  };
}

export default createCrudService;
