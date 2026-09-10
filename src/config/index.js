// Central app configuration. Values come from environment variables (Vite exposes
// variables prefixed with VITE_ on import.meta.env).
 

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  appName: "Garuda CRM",
  tokenStorageKey: "garuda_auth_token",
};
export default config;
