// Central Company / Business Settings store, persisted to the backend
// (CompanySettings singleton) with a localStorage cache for instant first paint.
// Stores Company Logo, GSTIN, Billing Address, PAN, Phone, Signature, Bank/UPI, etc.
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import defaultLogo from "../../assets/logo.png";
import { api } from "../../services";

const COMPANY_STORAGE_KEY = "garuda_company_settings_v2";

const DEFAULT_COMPANY_SETTINGS = {
  logo: "",
  businessName: "Garuda International",
  phone: "",
  email: "",
  billingAddress: "",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "",
  isGstRegistered: false,
  gstin: "",
  pan: "",
  businessType: "",
  industryType: "",
  registrationType: "",
  enableEInvoicing: false,
  enableTds: false,
  signature: "",
  extraDetails: [],
  bankName: "",
  accountNumber: "",
  ifsc: "",
  branch: "",
  accountHolder: "",
  upiId: "",
  customQrImage: "",
  invoicePrefix: "INV",
  invoiceTerms: "",
};

const CompanyContext = createContext(null);

function normalize(doc = {}) {
  const merged = { ...DEFAULT_COMPANY_SETTINGS };
  for (const k of Object.keys(DEFAULT_COMPANY_SETTINGS)) {
    if (doc[k] !== undefined && doc[k] !== null) merged[k] = doc[k];
  }
  return merged;
}

export function CompanyProvider({ children }) {
  // Seed synchronously from localStorage cache for instant render.
  const [company, setCompany] = useState(() => {
    try {
      const stored = localStorage.getItem(COMPANY_STORAGE_KEY);
      if (stored) return { ...DEFAULT_COMPANY_SETTINGS, ...JSON.parse(stored) };
    } catch {
      /* ignore */
    }
    return DEFAULT_COMPANY_SETTINGS;
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cache to localStorage whenever company changes (fast subsequent loads).
  useEffect(() => {
    try {
      localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(company));
    } catch {
      /* ignore */
    }
  }, [company]);

  // Fetch the authoritative settings from the backend on mount.
  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/company-settings");
      if (data?.item) setCompany(normalize(data.item));
    } catch {
      // Not logged in / no permission / offline — keep cached values.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Save a patch to the backend, updating local state optimistically.
  const updateCompany = useCallback(async (updates) => {
    setCompany((prev) => ({ ...prev, ...updates }));
    setSaving(true);
    try {
      const { data } = await api.put("/company-settings", updates);
      if (data?.item) setCompany(normalize(data.item));
      return true;
    } catch (e) {
      console.error("Failed to save company settings", e);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  // Upload an image (logo / signature / qr) to the backend, returns the URL.
  const uploadImage = useCallback(async (file) => {
    const fd = new FormData();
    fd.append("image", file);
    const { data } = await api.post("/company-settings/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.url;
  }, []);

  // Convenience wrappers used by the settings page.
  const updateLogo = useCallback((url) => updateCompany({ logo: url }), [updateCompany]);
  const updateSignature = useCallback((url) => updateCompany({ signature: url }), [updateCompany]);

  return (
    <CompanyContext.Provider
      value={{
        company,
        loading,
        saving,
        refresh,
        updateCompany,
        uploadImage,
        updateLogo,
        updateSignature,
        defaultLogo,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within a CompanyProvider");
  return ctx;
}

export default useCompany;
