// Base HTTP client. All service modules import this configured axios instance so
// auth headers, base URL and error handling live in one place.
import axios from "axios";
import config from "../config";

const api = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

// Storefront (customer) routes live under /shop/*. Those calls carry the CUSTOMER
// token explicitly (set per-request in CustomerAuthProvider), so the shared staff
// interceptor must NOT touch them — otherwise the two logins clobber each other.
function isShopRoute(url = "") {
  return url.startsWith("/shop") || url.startsWith("shop/") || url.includes("/shop/");
}

// Attach the STAFF auth token to CRM/admin requests only. If a request already set
// its own Authorization header (e.g. a customer call), leave it untouched.
api.interceptors.request.use((request) => {
  if (isShopRoute(request.url) || request.headers.Authorization) {
    return request;
  }
  const token = localStorage.getItem(config.tokenStorageKey);
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
});

// On 401, only clear the STAFF token for CRM/admin routes. A 401 from a /shop/*
// (customer) call must never log the admin out, and vice versa.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    if (error.response?.status === 401 && !isShopRoute(url)) {
      localStorage.removeItem(config.tokenStorageKey);
    }
    return Promise.reject(error);
  }
);

export default api;
