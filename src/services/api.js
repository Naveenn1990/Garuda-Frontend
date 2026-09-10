// Base HTTP client. All service modules import this configured axios instance so
// auth headers, base URL and error handling live in one place.
import axios from "axios";
import config from "../config";

const api = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

// Attach the auth token (if present) to every outgoing request.
api.interceptors.request.use((request) => {
  const token = localStorage.getItem(config.tokenStorageKey);
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
});

// Basic response error handling. On 401 we clear the token so the app can redirect
// the user back to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(config.tokenStorageKey);
    }
    return Promise.reject(error);
  }
);

export default api;
