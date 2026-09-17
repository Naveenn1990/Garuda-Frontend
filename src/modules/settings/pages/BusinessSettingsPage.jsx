// Business Settings / Manage Business Page
// Matches the myBillBook settings layout with interactive Logo & Signature Uploads, GSTIN, and Billing Address.
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiUpload,
  FiCheck,
  FiUser,
  FiBriefcase,
  FiFileText,
  FiPrinter,
  FiUsers,
  FiClock,
  FiPieChart,
  FiDollarSign,
  FiGift,
  FiHelpCircle,
  FiLogOut,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import { useCompany } from "../../../app/store/companyStore";
import { useAuth } from "../../../app/store/authStore";
import { imageUrl } from "../../storefront/utils";
import "./BusinessSettings.css";

const INDIAN_STATES = [
  "Karnataka",
  "Maharashtra",
  "Tamil Nadu",
  "Kerala",
  "Andhra Pradesh",
  "Telangana",
  "Goa",
  "Gujarat",
  "Delhi",
  "Rajasthan",
  "Uttar Pradesh",
  "West Bengal",
  "Madhya Pradesh",
  "Punjab",
  "Haryana",
];

export function BusinessSettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { company, updateCompany, uploadImage, saving, defaultLogo } = useCompany();

  const logoInputRef = useRef(null);
  const sigInputRef = useRef(null);
  const qrInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("manage_business");
  const [formData, setFormData] = useState({ ...company });

  // When the backend finishes loading company settings, sync them into the form
  // (only if the user hasn't started editing — keyed on the loaded doc identity).
  useEffect(() => {
    setFormData({ ...company });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.gstin, company.businessName, company.logo, company.upiId, company.customQrImage]);
  const [extraKey, setExtraKey] = useState("Website");
  const [extraValue, setExtraValue] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Upload an image to the backend and set the returned URL on a field.
  async function handleImageUpload(e, field, label) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      setFormData((prev) => ({ ...prev, [field]: url }));
      showToast(`${label} uploaded!`);
    } catch {
      showToast(`Failed to upload ${label.toLowerCase()}.`);
    }
  }

  const handleLogoUpload = (e) => handleImageUpload(e, "logo", "Company logo");
  const handleSignatureUpload = (e) => handleImageUpload(e, "signature", "Signature");
  const handleQrUpload = (e) => handleImageUpload(e, "customQrImage", "Payment QR");

  const handleAddExtraDetail = () => {
    if (!extraValue.trim()) return;
    const current = Array.isArray(formData.extraDetails) ? formData.extraDetails : [];
    const updated = [...current, { key: extraKey, value: extraValue.trim() }];
    setFormData((prev) => ({ ...prev, extraDetails: updated }));
    setExtraValue("");
  };

  const handleRemoveExtraDetail = (index) => {
    const current = Array.isArray(formData.extraDetails) ? formData.extraDetails : [];
    const updated = current.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, extraDetails: updated }));
  };

  const handleSave = async () => {
    const ok = await updateCompany(formData);
    showToast(ok ? "Business profile & settings saved successfully!" : "Failed to save settings.");
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  return (
    <div className="biz-settings-layout">
      {/* 1. Left Navigation Sidebar */}
      <aside className="biz-settings-sidebar">
        <div className="biz-brand-header">
          <img src={imageUrl(formData.logo) || defaultLogo} alt="Company Logo" className="biz-brand-logo-small" />
          <div>
            <div className="biz-brand-title">{formData.businessName}</div>
            <div className="biz-brand-phone">{formData.phone}</div>
          </div>
        </div>

        <button type="button" className="biz-btn-back" onClick={() => navigate("/dashboard")}>
          <FiArrowLeft />
          <span>Back to Dashboard</span>
        </button>

        {/* <button
          type="button"
          className={`biz-nav-item ${activeTab === "account" ? "active" : ""}`}
          onClick={() => setActiveTab("account")}
        >
          <div className="biz-nav-item__left">
            <FiUser />
            <span>Account</span>
          </div>
        </button> */}

        {/* <button
          type="button"
          className={`biz-nav-item ${activeTab === "manage_business" ? "active" : ""}`}
          onClick={() => setActiveTab("manage_business")}
        >
          <div className="biz-nav-item__left">
            <FiBriefcase />
            <span>Manage Business</span>
          </div>
        </button> */}
{/* 
        <button
          type="button"
          className={`biz-nav-item ${activeTab === "invoice_settings" ? "active" : ""}`}
          onClick={() => setActiveTab("invoice_settings")}
        >
          <div className="biz-nav-item__left">
            <FiFileText />
            <span>Invoice Settings</span>
          </div>
        </button>

        <button
          type="button"
          className={`biz-nav-item ${activeTab === "print_settings" ? "active" : ""}`}
          onClick={() => setActiveTab("print_settings")}
        >
          <div className="biz-nav-item__left">
            <FiPrinter />
            <span>Print Settings</span>
          </div>
          <span className="biz-badge-new">New</span>
        </button>

        <button
          type="button"
          className={`biz-nav-item ${activeTab === "users" ? "active" : ""}`}
          onClick={() => navigate("/users")}
        >
          <div className="biz-nav-item__left">
            <FiUsers />
            <span>Manage Users</span>
          </div>
        </button>

        <button
          type="button"
          className={`biz-nav-item ${activeTab === "reminders" ? "active" : ""}`}
          onClick={() => setActiveTab("reminders")}
        >
          <div className="biz-nav-item__left">
            <FiClock />
            <span>Reminders</span>
          </div>
        </button>

        <button
          type="button"
          className={`biz-nav-item ${activeTab === "ca_reports" ? "active" : ""}`}
          onClick={() => navigate("/reports")}
        >
          <div className="biz-nav-item__left">
            <FiPieChart />
            <span>CA Reports Sharing</span>
          </div>
        </button>

        <button
          type="button"
          className={`biz-nav-item ${activeTab === "pricing" ? "active" : ""}`}
          onClick={() => setActiveTab("pricing")}
        >
          <div className="biz-nav-item__left">
            <FiDollarSign />
            <span>Pricing</span>
          </div>
        </button>

        <button
          type="button"
          className={`biz-nav-item ${activeTab === "refer" ? "active" : ""}`}
          onClick={() => setActiveTab("refer")}
        >
          <div className="biz-nav-item__left">
            <FiGift />
            <span>Refer & Earn</span>
          </div>
        </button>

        <button
          type="button"
          className={`biz-nav-item ${activeTab === "help" ? "active" : ""}`}
          onClick={() => setActiveTab("help")}
        >
          <div className="biz-nav-item__left">
            <FiHelpCircle />
            <span>Help And Support</span>
          </div>
        </button>

        <button
          type="button"
          className="biz-nav-item"
          onClick={() => logout && logout()}
          style={{ marginTop: 20, color: "#dc2626" }}
        >
          <div className="biz-nav-item__left">
            <FiLogOut />
            <span>Logout</span>
          </div>
        </button> */}
      </aside>

      {/* 2. Main Content Form */}
      <main className="biz-settings-main">
        <header className="biz-settings-header">
          <div className="biz-title-area">
            <h1>Business Settings</h1>
            <p>Edit Your Company Settings And Information</p>
          </div>

          <div className="biz-header-actions">
            {toastMessage && (
              <span style={{ fontSize: "0.86rem", color: "#16a34a", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                <FiCheck /> {toastMessage}
              </span>
            )}
            <button type="button" className="biz-btn-cancel" onClick={() => navigate("/dashboard")}>
              Cancel
            </button>
            <button type="button" className="biz-btn-save" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </header>

        <div className="biz-settings-card">
          {/* Logo & Business Name Row */}
          <div className="biz-logo-name-row">
            <div>
              <input
                type="file"
                ref={logoInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleLogoUpload}
              />
              <div
                className="biz-logo-upload-wrap"
                onClick={() => logoInputRef.current?.click()}
                title="Click to Upload Company Logo"
              >
                <img src={imageUrl(formData.logo) || defaultLogo} alt="Company Logo" className="biz-logo-img" />
                <div className="biz-logo-overlay">
                  <FiUpload style={{ fontSize: "1.2rem", marginBottom: 2 }} />
                  <span>Upload Logo</span>
                </div>
              </div>
            </div>

            <div className="biz-form-group">
              <label className="biz-label">
                <span>Business Name</span>
                <span className="biz-req">*</span>
              </label>
              <input
                type="text"
                className="biz-input"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Enter Business Name"
              />
            </div>
          </div>

          {/* Business Type, Industry Type & Registration */}
          <div className="biz-form-grid-3">
            <div className="biz-form-group">
              <label className="biz-label">Business Type</label>
              <select
                className="biz-select"
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
              >
                <option value="Distributor, Services">Distributor, Services</option>
                <option value="Retailer">Retailer (Storefront)</option>
                <option value="Wholesaler">Wholesaler</option>
                <option value="Manufacturer">Manufacturer</option>
              </select>
            </div>

            <div className="biz-form-group">
              <label className="biz-label">Industry Type</label>
              <select
                className="biz-select"
                name="industryType"
                value={formData.industryType}
                onChange={handleChange}
              >
                <option value="Information Technology">Information Technology</option>
                <option value="Consumer Electronics & Home Appliances">Consumer Electronics & Home Appliances</option>
                <option value="FMCG & Grocery">FMCG & Grocery</option>
                <option value="Furniture & Hardware">Furniture & Hardware</option>
                <option value="Automobile">Automobile</option>
              </select>
            </div>

            <div className="biz-form-group">
              <label className="biz-label">Business Registration Type</label>
              <select
                className="biz-select"
                name="registrationType"
                value={formData.registrationType}
                onChange={handleChange}
              >
                <option value="Private Limited Company">Private Limited Company</option>
                <option value="Sole Proprietorship">Sole Proprietorship</option>
                <option value="Partnership Firm">Partnership Firm</option>
                <option value="LLP">Limited Liability Partnership (LLP)</option>
                <option value="Public Limited Company">Public Limited Company</option>
              </select>
            </div>
          </div>

          {/* Phone & Email */}
          <div className="biz-form-grid-2">
            <div className="biz-form-group">
              <label className="biz-label">Company Phone Number</label>
              <input
                type="tel"
                className="biz-input"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9590926068"
              />
            </div>

            <div className="biz-form-group">
              <label className="biz-label">Company E-Mail</label>
              <input
                type="email"
                className="biz-input"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter company e-mail"
              />
            </div>
          </div>

          {/* Billing Address */}
          <div className="biz-form-group">
            <label className="biz-label">Billing Address</label>
            <textarea
              rows={2}
              className="biz-textarea"
              name="billingAddress"
              value={formData.billingAddress}
              onChange={handleChange}
              placeholder="104/1 Singapura Main Road , Vidyaranyapura Post."
            />
          </div>

          {/* State, Pincode & City */}
          <div className="biz-form-grid-3">
            <div className="biz-form-group">
              <label className="biz-label">State</label>
              <select
                className="biz-select"
                name="state"
                value={formData.state}
                onChange={handleChange}
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="biz-form-group">
              <label className="biz-label">Pincode</label>
              <input
                type="text"
                className="biz-input"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="560097"
              />
            </div>

            <div className="biz-form-group">
              <label className="biz-label">City</label>
              <input
                type="text"
                className="biz-input"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Bengaluru"
              />
            </div>
          </div>

          {/* GST Registered Radio */}
          <div className="biz-form-group">
            <label className="biz-label">Are you GST Registered?</label>
            <div className="biz-radio-group">
              <label className="biz-radio-label">
                <input
                  type="radio"
                  name="isGstRegistered"
                  checked={formData.isGstRegistered === true}
                  onChange={() => setFormData((prev) => ({ ...prev, isGstRegistered: true }))}
                />
                <span>Yes</span>
              </label>

              <label className="biz-radio-label">
                <input
                  type="radio"
                  name="isGstRegistered"
                  checked={formData.isGstRegistered === false}
                  onChange={() => setFormData((prev) => ({ ...prev, isGstRegistered: false }))}
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {/* GSTIN & e-Invoicing */}
          {formData.isGstRegistered && (
            <div className="biz-form-grid-2">
              <div className="biz-form-group">
                <label className="biz-label">
                  <span>GSTIN</span>
                  <span className="biz-req">*</span>
                </label>
                <input
                  type="text"
                  className="biz-input"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  placeholder="29AANCP7155K1ZN"
                />
              </div>

              <div className="biz-form-group" style={{ justifyContent: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", color: "#1c1b17" }}>
                  <input
                    type="checkbox"
                    name="enableEInvoicing"
                    checked={formData.enableEInvoicing}
                    onChange={handleChange}
                  />
                  <span>Enable e-Invoicing (Auto IRN generation on NIC Portal)</span>
                </label>
              </div>
            </div>
          )}

          {/* PAN Number & TDS */}
          <div className="biz-form-grid-2">
            <div className="biz-form-group">
              <label className="biz-label">PAN Number</label>
              <input
                type="text"
                className="biz-input"
                name="pan"
                value={formData.pan}
                onChange={handleChange}
                placeholder="AANCP7155K"
              />
            </div>

            <div className="biz-form-group" style={{ justifyContent: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", color: "#1c1b17" }}>
                <input
                  type="checkbox"
                  name="enableTds"
                  checked={formData.enableTds}
                  onChange={handleChange}
                />
                <span>Enable TDS Management on Invoices</span>
              </label>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #ede6d6", margin: "8px 0" }} />

          {/* Signature Box */}
          <div className="biz-form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="biz-label">Authorized Signature</label>
              <span style={{ fontSize: "0.78rem", color: "#787163", fontStyle: "italic" }}>
                Note: Details added below will be shown on your Invoices
              </span>
            </div>

            <input
              type="file"
              ref={sigInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleSignatureUpload}
            />

            {!formData.signature ? (
              <div
                className="biz-signature-dashed-box"
                onClick={() => sigInputRef.current?.click()}
              >
                <FiUpload style={{ fontSize: "1.4rem" }} />
                <span>+ Add Signature</span>
              </div>
            ) : (
              <div
                style={{
                  border: "1px solid #e5dcc4",
                  borderRadius: 12,
                  padding: 16,
                  background: "#faf7ef",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <img src={imageUrl(formData.signature)} alt="Signature" style={{ maxHeight: 60, objectFit: "contain" }} />
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    className="biz-btn-cancel"
                    onClick={() => sigInputRef.current?.click()}
                  >
                    Change Signature
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, signature: null }))}
                    style={{ background: "#fff", border: "1px solid #fee2e2", color: "#dc2626", padding: "6px 12px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bank & Payment Details for Invoices */}
          <div className="biz-form-group">
            <label className="biz-label" style={{ fontSize: "1rem", color: "#8a6016", fontWeight: 800 }}>
              Bank & Payment Details (Printed on Invoices)
            </label>
            <p style={{ margin: "0 0 10px", fontSize: "0.82rem", color: "#787163" }}>
              These bank credentials and UPI ID will be printed in the invoice footer and used to generate the UPI QR code.
            </p>

            <div className="biz-form-grid-2">
              <div className="biz-form-group">
                <label className="biz-label">Bank Name & Branch</label>
                <input
                  type="text"
                  className="biz-input"
                  name="bankName"
                  value={formData.bankName || ""}
                  onChange={handleChange}
                  placeholder="e.g. Karnataka Bank, BENGALURU-SINGAPURA"
                />
              </div>

              <div className="biz-form-group">
                <label className="biz-label">Account Holder / Business Name</label>
                <input
                  type="text"
                  className="biz-input"
                  name="accountHolder"
                  value={formData.accountHolder || ""}
                  onChange={handleChange}
                  placeholder="e.g. Garuda International"
                />
              </div>
            </div>

            <div className="biz-form-grid-2">
              <div className="biz-form-group">
                <label className="biz-label">Bank Account Number</label>
                <input
                  type="text"
                  className="biz-input"
                  name="accountNumber"
                  value={formData.accountNumber || ""}
                  onChange={handleChange}
                  placeholder="e.g. 2442000100008401"
                />
              </div>

              <div className="biz-form-group">
                <label className="biz-label">IFSC Code</label>
                <input
                  type="text"
                  className="biz-input"
                  name="ifsc"
                  value={formData.ifsc || ""}
                  onChange={handleChange}
                  placeholder="e.g. KARB0000244"
                />
              </div>
            </div>

            <div className="biz-form-group">
              <label className="biz-label">UPI ID (VPA)</label>
              <input
                type="text"
                className="biz-input"
                name="upiId"
                value={formData.upiId || ""}
                onChange={handleChange}
                placeholder="e.g. garuda@kbl"
              />
              <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "#787163" }}>
                A UPI QR code is generated automatically from this ID on invoices. To use
                your own QR image instead, upload one below.
              </p>
            </div>

            {/* Custom Payment QR (optional) */}
            <div className="biz-form-group">
              <label className="biz-label">Custom Payment QR (optional)</label>
              <input
                type="file"
                ref={qrInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleQrUpload}
              />
              {!formData.customQrImage ? (
                <div className="biz-signature-dashed-box" onClick={() => qrInputRef.current?.click()}>
                  <FiUpload style={{ fontSize: "1.4rem" }} />
                  <span>+ Upload QR Image</span>
                </div>
              ) : (
                <div style={{ border: "1px solid #e5dcc4", borderRadius: 12, padding: 16, background: "#faf7ef", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <img src={imageUrl(formData.customQrImage)} alt="Payment QR" style={{ maxHeight: 90, objectFit: "contain" }} />
                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="button" className="biz-btn-cancel" onClick={() => qrInputRef.current?.click()}>
                      Change QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, customQrImage: "" }))}
                      style={{ background: "#fff", border: "1px solid #fee2e2", color: "#dc2626", padding: "6px 12px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}>
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #ede6d6", margin: "8px 0" }} />

          {/* Add Business Details (Extra Key-Value fields) */}
          <div className="biz-form-group">
            <label className="biz-label">Add Business Details</label>
            <p style={{ margin: "0 0 8px", fontSize: "0.82rem", color: "#787163" }}>
              Add additional business information such as MSME number, Website, CIN etc.
            </p>

            <div className="biz-extra-row">
              <select
                className="biz-select"
                value={extraKey}
                onChange={(e) => setExtraKey(e.target.value)}
              >
                <option value="Website">Website</option>
                <option value="MSME Number">MSME Number</option>
                <option value="CIN">CIN Number</option>
                <option value="FSSAI">FSSAI License</option>
              </select>

              <input
                type="text"
                className="biz-input"
                placeholder={`Enter ${extraKey}`}
                value={extraValue}
                onChange={(e) => setExtraValue(e.target.value)}
              />

              <button
                type="button"
                className="biz-btn-save"
                onClick={handleAddExtraDetail}
                style={{ padding: "10px 18px", whiteSpace: "nowrap" }}
              >
                Add
              </button>
            </div>

            {/* List of Extra Details */}
            {Array.isArray(formData.extraDetails) && formData.extraDetails.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                {formData.extraDetails.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "#faf7ef",
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "1px solid #e5dcc4",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "0.86rem", color: "#3b372f" }}>
                      {item.key}: <span style={{ fontWeight: 500, color: "#1c1b17" }}>{item.value}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExtraDetail(idx)}
                      style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default BusinessSettingsPage;
