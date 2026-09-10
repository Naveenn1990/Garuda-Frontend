// Storefront customer auth: phone + OTP. Separate from staff auth. Persists the
// customer token + profile in localStorage so the session survives refresh.
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../../../services";

const TOKEN_KEY = "garuda_customer_token";
const CUSTOMER_KEY = "garuda_customer";

const CustomerAuthContext = createContext(null);

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function CustomerAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [customer, setCustomer] = useState(() => load(CUSTOMER_KEY));

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  useEffect(() => {
    if (customer) localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    else localStorage.removeItem(CUSTOMER_KEY);
  }, [customer]);

  // Auth header for customer API calls (kept separate from the staff token in api.js,
  // which we pass explicitly per request below).
  function authHeaders() {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function requestOtp(mobile) {
    const { data } = await api.post("/shop/auth/request-otp", { mobile });
    return data; // { otp } for on-screen display
  }

  async function verifyOtp(mobile, otp) {
    const { data } = await api.post("/shop/auth/verify-otp", { mobile, otp });
    setToken(data.token);
    setCustomer(data.customer);
    return data; // { isNew, customer }
  }

  async function completeProfile(payload) {
    const { data } = await api.post("/shop/auth/complete-profile", payload, {
      headers: authHeaders(),
    });
    setCustomer(data.customer);
    return data.customer;
  }

  // Edit profile/address from the My Account page.
  async function updateProfile(payload) {
    const { data } = await api.put("/shop/auth/profile", payload, {
      headers: authHeaders(),
    });
    setCustomer(data.customer);
    return data.customer;
  }

  // Fetch this customer's order history.
  async function fetchOrders() {
    const { data } = await api.get("/shop/auth/orders", { headers: authHeaders() });
    return data.orders || [];
  }

  // Place an online order from the cart.
  async function checkout(payload) {
    const { data } = await api.post("/shop/auth/checkout", payload, {
      headers: authHeaders(),
    });
    return data; // { orderId, number, total }
  }

  // Submit a product review (verified-purchase enforced on the server).
  async function submitReview(productId, payload) {
    const { data } = await api.post(`/shop/products/${productId}/reviews`, payload, {
      headers: authHeaders(),
    });
    return data.review;
  }

  // Upload a review image; returns the public URL.
  async function uploadReviewImage(file) {
    const fd = new FormData();
    fd.append("image", file);
    const { data } = await api.post("/shop/reviews/upload", fd, {
      headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
    });
    return data.url;
  }

  function logout() {
    setToken(null);
    setCustomer(null);
  }

  const value = {
    token,
    customer,
    isLoggedIn: Boolean(token),
    requestOtp,
    verifyOtp,
    completeProfile,
    updateProfile,
    fetchOrders,
    checkout,
    submitReview,
    uploadReviewImage,
    logout,
  };

  return (
    <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>
  );
}
export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
}
