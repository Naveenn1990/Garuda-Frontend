import { useState } from "react";
import {
  FiX,
  FiUser,
  FiMapPin,
  FiCreditCard,
  FiPhoneCall,
  FiDollarSign,
  FiSliders,
  FiCheck,
} from "react-icons/fi";
import { useCreateCustomer } from "../../modules/customers/hooks/useCustomers";
import { useShowrooms } from "../../modules/showrooms/hooks/useShowrooms";
import { useUI } from "../../app/store/uiStore";
import "./CreatePartyModal.css";

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

const INITIAL_FORM = {
  partyType: "customer",
  partyCategory: "Retail",
  name: "",
  mobile: "",
  gstin: "",
  pan: "",
  email: "",
  openingBalance: 0,
  balanceType: "to_collect",

  // Address
  address: "",
  city: "Bangalore",
  state: "Karnataka",
  pincode: "",

  // Shipping
  shippingSame: true,
  shippingAddress: "",
  shippingCity: "",
  shippingState: "Karnataka",
  shippingPincode: "",

  // Credit
  creditLimit: 0,
  creditPeriod: 30,
  creditWarning: false,

  // Contact person
  contactName: "",
  contactMobile: "",
  contactEmail: "",
  contactDesignation: "",

  // Bank
  accountNumber: "",
  ifsc: "",
  bankName: "",
  branch: "",
  upiId: "",

  // Custom
  assignedShowroom: "",
  segment: "new",
  notes: "",
};

export function CreatePartyModal({ isOpen, onClose, onSuccess }) {
  const { closePartyModal, partyModalCallback } = useUI();
  const { data: showrooms = [] } = useShowrooms();
  const createMutation = useCreateCustomer();

  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errorMsg, setErrorMsg] = useState("");
  const [savedToast, setSavedToast] = useState(false);

  const handleClose = () => {
    if (onClose) onClose();
    else closePartyModal();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errorMsg) setErrorMsg("");
  };

  const handleSave = async (saveAndNew = false) => {
    if (!formData.name.trim()) {
      setErrorMsg("Party name is required.");
      setActiveTab("basic");
      return;
    }
    if (!formData.mobile.trim()) {
      setErrorMsg("Mobile number is required.");
      setActiveTab("basic");
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim() || undefined,
        partyType: formData.partyType,
        partyCategory: formData.partyCategory,
        gstin: formData.gstin.trim() || undefined,
        pan: formData.pan.trim() || undefined,
        openingBalance: Number(formData.openingBalance) || 0,
        balanceType: formData.balanceType,

        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        pincode: formData.pincode.trim() || undefined,

        shippingAddress: formData.shippingSame
          ? {
              address: formData.address.trim(),
              city: formData.city.trim(),
              state: formData.state.trim(),
              pincode: formData.pincode.trim(),
            }
          : {
              address: formData.shippingAddress.trim(),
              city: formData.shippingCity.trim(),
              state: formData.shippingState.trim(),
              pincode: formData.shippingPincode.trim(),
            },

        creditLimit: Number(formData.creditLimit) || 0,
        creditPeriod: Number(formData.creditPeriod) || 30,
        creditWarning: Boolean(formData.creditWarning),

        contactPerson: {
          name: formData.contactName.trim(),
          mobile: formData.contactMobile.trim(),
          email: formData.contactEmail.trim(),
          designation: formData.contactDesignation.trim(),
        },

        bankAccount: {
          accountNumber: formData.accountNumber.trim(),
          ifsc: formData.ifsc.trim(),
          bankName: formData.bankName.trim(),
          branch: formData.branch.trim(),
          upiId: formData.upiId.trim(),
        },

        assignedShowroom: formData.assignedShowroom || undefined,
        segment: formData.segment,
        notes: formData.notes.trim() || undefined,
      };

      const result = await createMutation.mutateAsync(payload);
      const createdItem = result?.item || result;

      if (onSuccess) onSuccess(createdItem);
      if (partyModalCallback) partyModalCallback(createdItem);

      if (saveAndNew) {
        setFormData(INITIAL_FORM);
        setActiveTab("basic");
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 2500);
      } else {
        handleClose();
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err.message || "Failed to create party");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="party-modal-backdrop" onClick={handleClose}>
      <div className="party-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="party-modal-header">
          <h2 className="party-modal-title">
            <span>Create New Party</span>
            {savedToast && (
              <span style={{ fontSize: "0.82rem", color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <FiCheck /> Party saved! Enter next.
              </span>
            )}
          </h2>
          <button
            type="button"
            className="party-modal-close-btn"
            onClick={handleClose}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "8px 24px", fontSize: "0.85rem", fontWeight: 600, borderBottom: "1px solid #fecaca" }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Body */}
        <div className="party-modal-body">
          {/* Left Tabs Sidebar */}
          <div className="party-tabs-sidebar">
            <button
              type="button"
              className={`party-tab-btn ${activeTab === "basic" ? "active" : ""}`}
              onClick={() => setActiveTab("basic")}
            >
              <FiUser className="party-tab-btn__icon" />
              <span>Basic Details</span>
              <span className="party-tab-btn__req">*</span>
            </button>

            <button
              type="button"
              className={`party-tab-btn ${activeTab === "address" ? "active" : ""}`}
              onClick={() => setActiveTab("address")}
            >
              <FiMapPin className="party-tab-btn__icon" />
              <span>Address</span>
            </button>

            <div className="party-tab-group-title">Advance Details</div>

            <button
              type="button"
              className={`party-tab-btn ${activeTab === "credit" ? "active" : ""}`}
              onClick={() => setActiveTab("credit")}
            >
              <FiCreditCard className="party-tab-btn__icon" />
              <span>Credit Settings</span>
            </button>

            <button
              type="button"
              className={`party-tab-btn ${activeTab === "contact" ? "active" : ""}`}
              onClick={() => setActiveTab("contact")}
            >
              <FiPhoneCall className="party-tab-btn__icon" />
              <span>Contact Person Details</span>
            </button>

            <button
              type="button"
              className={`party-tab-btn ${activeTab === "bank" ? "active" : ""}`}
              onClick={() => setActiveTab("bank")}
            >
              <FiDollarSign className="party-tab-btn__icon" />
              <span>Party Bank Account</span>
            </button>

            <button
              type="button"
              className={`party-tab-btn ${activeTab === "custom" ? "active" : ""}`}
              onClick={() => setActiveTab("custom")}
            >
              <FiSliders className="party-tab-btn__icon" />
              <span>Custom Fields</span>
            </button>
          </div>

          {/* Right Form Content */}
          <div className="party-content-area">
            {/* TAB 1: BASIC DETAILS */}
            {activeTab === "basic" && (
              <>
                <div className="party-form-row-2">
                  <div className="party-form-group">
                    <label className="party-form-label">
                      <span>Party Type</span>
                      <span className="party-form-label-req">*</span>
                    </label>
                    <div className="party-radio-pill-group">
                      <label className="party-radio-label">
                        <input
                          type="radio"
                          name="partyType"
                          value="customer"
                          checked={formData.partyType === "customer"}
                          onChange={handleChange}
                        />
                        <span>Customer</span>
                      </label>
                      <label className="party-radio-label">
                        <input
                          type="radio"
                          name="partyType"
                          value="supplier"
                          checked={formData.partyType === "supplier"}
                          onChange={handleChange}
                        />
                        <span>Supplier</span>
                      </label>
                    </div>
                  </div>

                  <div className="party-form-group">
                    <label className="party-form-label">Party Category</label>
                    <select
                      className="party-select"
                      name="partyCategory"
                      value={formData.partyCategory}
                      onChange={handleChange}
                    >
                      <option value="Retail">Retail Customer</option>
                      <option value="Wholesale">Wholesale Dealer</option>
                      <option value="Corporate">Corporate / B2B</option>
                      <option value="Distributor">Distributor / Franchise</option>
                      <option value="VIP">VIP Client</option>
                    </select>
                  </div>
                </div>

                <div className="party-form-row-2">
                  <div className="party-form-group">
                    <label className="party-form-label">
                      <span>Party Name</span>
                      <span className="party-form-label-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="party-input"
                      name="name"
                      placeholder="Enter Name"
                      value={formData.name}
                      onChange={handleChange}
                      autoFocus
                    />
                  </div>

                  <div className="party-form-group">
                    <label className="party-form-label">
                      <span>Mobile Number</span>
                      <span className="party-form-label-req">*</span>
                    </label>
                    <input
                      type="tel"
                      className="party-input"
                      name="mobile"
                      placeholder="Enter Mobile Number"
                      value={formData.mobile}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="party-form-row-2">
                  <div className="party-form-group">
                    <label className="party-form-label">GSTIN</label>
                    <input
                      type="text"
                      className="party-input"
                      name="gstin"
                      placeholder="EX: 29XXXXX94381XX"
                      value={formData.gstin}
                      onChange={handleChange}
                    />
                    <div className="party-hint-note">
                      Note: You can auto populate party details from GSTIN
                    </div>
                  </div>

                  <div className="party-form-group">
                    <label className="party-form-label">PAN Number</label>
                    <input
                      type="text"
                      className="party-input"
                      name="pan"
                      placeholder="Enter PAN Number"
                      value={formData.pan}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="party-form-row-2">
                  <div className="party-form-group">
                    <label className="party-form-label">Email</label>
                    <input
                      type="email"
                      className="party-input"
                      name="email"
                      placeholder="Enter Email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="party-form-group">
                    <label className="party-form-label">Opening Balance</label>
                    <div className="party-balance-wrap">
                      <span className="party-balance-prefix">₹</span>
                      <input
                        type="number"
                        className="party-balance-input"
                        name="openingBalance"
                        value={formData.openingBalance}
                        onChange={handleChange}
                        min="0"
                      />
                      <select
                        className="party-balance-select"
                        name="balanceType"
                        value={formData.balanceType}
                        onChange={handleChange}
                      >
                        <option value="to_collect">To Collect</option>
                        <option value="to_pay">To Pay</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: ADDRESS */}
            {activeTab === "address" && (
              <>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1c1b17", marginBottom: 2 }}>
                  Billing Address
                </div>
                <div className="party-form-group">
                  <label className="party-form-label">Building / Street Address</label>
                  <textarea
                    rows={2}
                    className="party-textarea"
                    name="address"
                    placeholder="Enter street address, building, locality"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

                <div className="party-form-row-3">
                  <div className="party-form-group">
                    <label className="party-form-label">City</label>
                    <input
                      type="text"
                      className="party-input"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="party-form-group">
                    <label className="party-form-label">State</label>
                    <select
                      className="party-select"
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

                  <div className="party-form-group">
                    <label className="party-form-label">Pincode</label>
                    <input
                      type="text"
                      className="party-input"
                      name="pincode"
                      placeholder="e.g. 560001"
                      value={formData.pincode}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid #ede6d6", margin: "10px 0" }} />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1c1b17" }}>
                    Shipping Address
                  </span>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "#4a4539", cursor: "pointer", fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      name="shippingSame"
                      checked={formData.shippingSame}
                      onChange={handleChange}
                    />
                    <span>Same as Billing Address</span>
                  </label>
                </div>

                {!formData.shippingSame && (
                  <>
                    <div className="party-form-group">
                      <label className="party-form-label">Shipping Street Address</label>
                      <textarea
                        rows={2}
                        className="party-textarea"
                        name="shippingAddress"
                        placeholder="Enter shipping address"
                        value={formData.shippingAddress}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="party-form-row-3">
                      <div className="party-form-group">
                        <label className="party-form-label">City</label>
                        <input
                          type="text"
                          className="party-input"
                          name="shippingCity"
                          value={formData.shippingCity}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="party-form-group">
                        <label className="party-form-label">State</label>
                        <select
                          className="party-select"
                          name="shippingState"
                          value={formData.shippingState}
                          onChange={handleChange}
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <div className="party-form-group">
                        <label className="party-form-label">Pincode</label>
                        <input
                          type="text"
                          className="party-input"
                          name="shippingPincode"
                          value={formData.shippingPincode}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* TAB 3: CREDIT SETTINGS */}
            {activeTab === "credit" && (
              <>
                <div className="party-form-row-2">
                  <div className="party-form-group">
                    <label className="party-form-label">Credit Limit (₹)</label>
                    <input
                      type="number"
                      className="party-input"
                      name="creditLimit"
                      placeholder="e.g. 50000"
                      value={formData.creditLimit}
                      onChange={handleChange}
                      min="0"
                    />
                    <div className="party-hint-note">Max unpaid balance allowed before alert</div>
                  </div>

                  <div className="party-form-group">
                    <label className="party-form-label">Credit Period (Days)</label>
                    <input
                      type="number"
                      className="party-input"
                      name="creditPeriod"
                      placeholder="30"
                      value={formData.creditPeriod}
                      onChange={handleChange}
                      min="0"
                    />
                    <div className="party-hint-note">Standard invoice payment due window</div>
                  </div>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem", fontWeight: 600, color: "#3b372f", marginTop: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    name="creditWarning"
                    checked={formData.creditWarning}
                    onChange={handleChange}
                  />
                  <span>Block invoice creation if credit limit is exceeded</span>
                </label>
              </>
            )}

            {/* TAB 4: CONTACT PERSON DETAILS */}
            {activeTab === "contact" && (
              <>
                <div className="party-form-row-2">
                  <div className="party-form-group">
                    <label className="party-form-label">Contact Person Name</label>
                    <input
                      type="text"
                      className="party-input"
                      name="contactName"
                      placeholder="e.g. Rajesh Kumar"
                      value={formData.contactName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="party-form-group">
                    <label className="party-form-label">Designation / Role</label>
                    <input
                      type="text"
                      className="party-input"
                      name="contactDesignation"
                      placeholder="e.g. Purchase Manager"
                      value={formData.contactDesignation}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="party-form-row-2">
                  <div className="party-form-group">
                    <label className="party-form-label">Mobile Number</label>
                    <input
                      type="tel"
                      className="party-input"
                      name="contactMobile"
                      placeholder="e.g. 9876543210"
                      value={formData.contactMobile}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="party-form-group">
                    <label className="party-form-label">Email</label>
                    <input
                      type="email"
                      className="party-input"
                      name="contactEmail"
                      placeholder="e.g. contact@business.com"
                      value={formData.contactEmail}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </>
            )}

            {/* TAB 5: PARTY BANK ACCOUNT */}
            {activeTab === "bank" && (
              <>
                <div className="party-form-row-2">
                  <div className="party-form-group">
                    <label className="party-form-label">Bank Account Number</label>
                    <input
                      type="text"
                      className="party-input"
                      name="accountNumber"
                      placeholder="Enter Bank Account Number"
                      value={formData.accountNumber}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="party-form-group">
                    <label className="party-form-label">IFSC Code</label>
                    <input
                      type="text"
                      className="party-input"
                      name="ifsc"
                      placeholder="e.g. HDFC0001234"
                      value={formData.ifsc}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="party-form-row-2">
                  <div className="party-form-group">
                    <label className="party-form-label">Bank Name</label>
                    <input
                      type="text"
                      className="party-input"
                      name="bankName"
                      placeholder="e.g. HDFC Bank"
                      value={formData.bankName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="party-form-group">
                    <label className="party-form-label">Branch & UPI ID</label>
                    <input
                      type="text"
                      className="party-input"
                      name="upiId"
                      placeholder="e.g. store@okaxis or Indiranagar Branch"
                      value={formData.upiId}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </>
            )}

            {/* TAB 6: CUSTOM FIELDS */}
            {activeTab === "custom" && (
              <>
                <div className="party-form-row-2">
                  <div className="party-form-group">
                    <label className="party-form-label">Assigned Showroom / Branch</label>
                    <select
                      className="party-select"
                      name="assignedShowroom"
                      value={formData.assignedShowroom}
                      onChange={handleChange}
                    >
                      <option value="">All Branches / Central</option>
                      {showrooms.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.code || s.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="party-form-group">
                    <label className="party-form-label">Customer Segment</label>
                    <select
                      className="party-select"
                      name="segment"
                      value={formData.segment}
                      onChange={handleChange}
                    >
                      <option value="new">New Customer</option>
                      <option value="existing">Existing Customer</option>
                      <option value="vip">VIP / High Volume</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="party-form-group">
                  <label className="party-form-label">Notes & Internal Remarks</label>
                  <textarea
                    rows={3}
                    className="party-textarea"
                    name="notes"
                    placeholder="Enter special instructions or customer preferences..."
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="party-modal-footer">
          <button type="button" className="party-btn-cancel" onClick={handleClose}>
            Cancel
          </button>

          <div className="party-footer-right">
            <button
              type="button"
              className="party-btn-save-new"
              onClick={() => handleSave(true)}
              disabled={createMutation.isPending}
            >
              Save & New
            </button>
            <button
              type="button"
              className="party-btn-primary"
              onClick={() => handleSave(false)}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatePartyModal;
