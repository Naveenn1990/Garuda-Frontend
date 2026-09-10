// Auth-related API calls.
import api from "./api";
import config from "../config";

export const authService = {
  async login(credentials) {
    const { data } = await api.post("/auth/login", credentials);
    if (data?.token) {
      localStorage.setItem(config.tokenStorageKey, data.token);
    }
    return data;
  },

  logout() {
    localStorage.removeItem(config.tokenStorageKey);
  },

  async me() {
    // The API returns { success, user } - return the user object itself so callers
    // get the shape they expect (with permissions, isSuperAdmin, etc.).
    const { data } = await api.get("/auth/me");
    return data.user;
  },

  getToken() {
    return localStorage.getItem(config.tokenStorageKey);
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem(config.tokenStorageKey));
  },
};

export default authService;
