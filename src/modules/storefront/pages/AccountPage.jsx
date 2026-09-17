// My Account: view/edit profile + saved address, and order history. Requires a
// logged-in customer; redirects to the login page otherwise.
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiMapPin, FiLogOut, FiPackage, FiCheckCircle, FiShield, FiFileText, FiTrash2, FiAlertTriangle } from "react-icons/fi";
import { useCustomerAuth } from "../store/CustomerAuthProvider";
import { useGooglePlaces } from "../hooks/useGooglePlaces";
import { formatINR, imageUrl } from "../utils";
import { FiShoppingBag } from "react-icons/fi";
import "../components/storefront.css";

const STATUS_LABEL = {
  new: "Placed",
  confirmed: "Confirmed",
  processing: "Processing",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function AccountPage() {
  const navigate = useNavigate();
  const { isLoggedIn, customer, updateProfile, fetchOrders, logout } = useCustomerAuth();
  const { ready, hasKey, attachAutocomplete, detectLocation } = useGooglePlaces();

  const [tab, setTab] = useState("profile");
  const [form, setForm] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteErr, setDeleteErr] = useState("");
  const [deleting, setDeleting] = useState(false);
  const addressRef = useRef(null);

  // Guard: must be logged in.
  useEffect(() => {
    if (!isLoggedIn) navigate("/account/login", { replace: true });
  }, [isLoggedIn, navigate]);

  // Seed the edit form from the current customer.
  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name === "Guest" ? "" : customer.name || "",
        email: customer.email || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        pincode: customer.pincode || "",
        lat: null,
        lng: null,
      });
    }
  }, [customer]);

  // Load orders once on mount (so the count shows in the nav even on the profile tab).
  useEffect(() => {
    if (!isLoggedIn) return;
    setOrdersLoading(true);
    fetchOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [isLoggedIn]); // eslint-disable-line

  // Google autocomplete on the address field (profile tab).
  useEffect(() => {
    if (tab === "profile" && ready && addressRef.current) {
      attachAutocomplete(addressRef.current, (place) =>
        setForm((f) => ({ ...f, ...place }))
      );
    }
  }, [tab, ready, attachAutocomplete]);

  if (!form) return null;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleDetect() {
    setError("");
    try {
      const place = await detectLocation();
      setForm((f) => ({ ...f, ...place }));
    } catch {
      setError("Couldn't detect your location. Please type your address.");
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    if (!form.name.trim()) return setError("Name cannot be empty.");
    setSaving(true);
    try {
      await updateProfile(form);
      setMsg("Your details have been updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") {
      setDeleteErr('Please type DELETE to confirm.');
      return;
    }
    setDeleting(true);
    setDeleteErr("");
    try {
      await logout();
      navigate("/");
    } catch {
      setDeleteErr("Could not delete account. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="sf-account">
      <aside className="sf-account__side">
        <div className="sf-account__who">
          <div className="sf-account__avatar">{(customer?.name || "G").charAt(0).toUpperCase()}</div>
          <div>
            <div className="sf-account__name">{customer?.name || "Guest"}</div>
            <div className="sf-account__phone">+91 {customer?.mobile}</div>
          </div>
        </div>
        <div className="sf-account__nav">
          <button
            className={`sf-account__navbtn ${tab === "profile" ? "is-active" : ""}`}
            onClick={() => setTab("profile")}
          >
            <FiUser /> My Profile
          </button>
          <button
            className={`sf-account__navbtn ${tab === "orders" ? "is-active" : ""}`}
            onClick={() => setTab("orders")}
          >
            <FiPackage /> My Orders
            {orders.length > 0 && <span className="sf-account__count">{orders.length}</span>}
          </button>

          {/* Desktop-only legal + danger section */}
          <div className="sf-account__nav-divider" />
          <button
            className={`sf-account__navbtn sf-account__navbtn--desktop ${tab === "privacy" ? "is-active" : ""}`}
            onClick={() => setTab("privacy")}
          >
            <FiShield /> Privacy Policy
          </button>
          <button
            className={`sf-account__navbtn sf-account__navbtn--desktop ${tab === "terms" ? "is-active" : ""}`}
            onClick={() => setTab("terms")}
          >
            <FiFileText /> Terms &amp; Conditions
          </button>
          <button
            className={`sf-account__navbtn sf-account__navbtn--danger sf-account__navbtn--desktop ${tab === "delete" ? "is-active-danger" : ""}`}
            onClick={() => setTab("delete")}
          >
            <FiTrash2 /> Delete Account
          </button>

          <button
            className="sf-account__navbtn sf-account__navbtn--logout"
            onClick={() => { logout(); navigate("/"); }}
          >
            <FiLogOut /> Log Out
          </button>
        </div>
      </aside>

      <section className="sf-account__main">
        {tab === "profile" && (
          <>
            <div className="sf-account__head">
              <h1>Profile & Address</h1>
              <p className="sf-account__head-sub">Keep your details up to date for faster checkout.</p>
            </div>
            <hr className="sf-account__rule" />
            <form className="sf-account__form" onSubmit={handleSave}>
              <div className="sf-account__form-row">
                <div>
                  <label>Name *</label>
                  <div className="sf-auth__field">
                    <FiUser className="sf-auth__field-icon" />
                    <input value={form.name} onChange={set("name")} required />
                  </div>
                </div>
                <div>
                  <label>Email</label>
                  <div className="sf-auth__field">
                    <FiMail className="sf-auth__field-icon" />
                    <input type="email" value={form.email} onChange={set("email")} />
                  </div>
                </div>
              </div>

              <div className="sf-auth__addrhead">
                <label>Address</label>
                {hasKey && (
                  <button type="button" className="sf-auth__detect" onClick={handleDetect}>
                    <FiMapPin /> Detect my location
                  </button>
                )}
              </div>
              <div className="sf-auth__field">
                <FiMapPin className="sf-auth__field-icon" />
                <input
                  ref={addressRef}
                  value={form.address}
                  onChange={set("address")}
                  placeholder={hasKey ? "Start typing your address..." : "Enter your address"}
                />
              </div>

              <div className="sf-auth__row">
                <input value={form.city} onChange={set("city")} placeholder="City" />
                <input value={form.state} onChange={set("state")} placeholder="State" />
                <input value={form.pincode} onChange={set("pincode")} placeholder="Pincode" />
              </div>

              {error && <p className="sf-auth__error">{error}</p>}
              {msg && <p className="sf-account__ok"><FiCheckCircle /> {msg}</p>}

              <button className="sf-authbtn" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </>
        )}

        {tab === "orders" && (
          <>
            <div className="sf-account__head">
              <h1>My Orders</h1>
              <p className="sf-account__head-sub">Track and review your past purchases.</p>
            </div>
            <hr className="sf-account__rule" />

            {ordersLoading ? (
              <div className="sf-account__loading">
                <div className="sf-order-skel" />
                <div className="sf-order-skel" />
                <div className="sf-order-skel" />
              </div>
            ) : orders.length === 0 ? (
              <div className="sf-empty">
                <p>You haven't placed any orders yet.</p>
                <Link to="/shop" className="sf-btn">Start Shopping</Link>
              </div>
            ) : (
              <div className="sf-orders">
                {orders.map((o) => (
                  <div className="sf-order" key={o._id}>
                    {/* Thumbnail */}
                    <div className="sf-order__thumb">
                      {o.thumb ? (
                        <img src={imageUrl(o.thumb)} alt="" />
                      ) : (
                        <FiShoppingBag />
                      )}
                    </div>

                    {/* Details */}
                    <div className="sf-order__main">
                      <div className="sf-order__row1">
                        <span className="sf-order__no">#{o.number || o._id.slice(-6)}</span>
                        <span className={`sf-order__status sf-order__status--${o.status}`}>
                          {STATUS_LABEL[o.status] || o.status}
                        </span>
                      </div>
                      {o.itemNames?.length > 0 && (
                        <div className="sf-order__names">
                          {o.itemNames.slice(0, 2).join(", ")}
                          {o.itemNames.length > 2 ? ` +${o.itemNames.length - 2} more` : ""}
                        </div>
                      )}
                      <div className="sf-order__meta">
                        <span>{new Date(o.createdAt).toLocaleDateString("en-IN")}</span>
                        <span>{o.items?.length || 0} item(s)</span>
                        <span className="sf-order__pay">Payment: {o.paymentStatus}</span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="sf-order__total">{formatINR(o.grandTotal)}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {tab === "privacy" && (
          <>
            <div className="sf-account__head">
              <h1><FiShield style={{verticalAlign:"middle",marginRight:8,color:"#b58a2e"}}/>Privacy Policy</h1>
              <p className="sf-account__head-sub">Last updated: January 2025</p>
            </div>
            <hr className="sf-account__rule" />
            <div className="sf-legal">
              <h3>1. Information We Collect</h3>
              <p>We collect information you provide directly to us, such as your name, mobile number, email address, and delivery address when you register or place an order. We also collect transaction data including order history and payment status.</p>

              <h3>2. How We Use Your Information</h3>
              <p>Your information is used to process orders, send order confirmations and updates, provide customer support, and improve our services. We do not sell your personal information to third parties.</p>

              <h3>3. Data Security</h3>
              <p>We implement appropriate technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction. All payments are processed through secure, PCI-compliant payment gateways.</p>

              <h3>4. Cookies</h3>
              <p>Our website uses cookies to enhance your browsing experience, remember your preferences, and analyse site traffic. You may disable cookies through your browser settings, though this may affect certain features.</p>

              <h3>5. Third-Party Services</h3>
              <p>We use trusted third-party services for payment processing, logistics, and analytics. These partners are bound by their own privacy policies and are not permitted to use your data for purposes beyond our service agreement.</p>

              <h3>6. Your Rights</h3>
              <p>You have the right to access, correct, or delete the personal data we hold about you. To exercise these rights, please contact us at <strong>privacy@garuda.com</strong>.</p>

              <h3>7. Changes to This Policy</h3>
              <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on our website or by email.</p>

              <h3>8. Contact Us</h3>
              <p>If you have any questions about this Privacy Policy, please contact us at <strong>privacy@garuda.com</strong> or write to: Garuda Electronics, 104/150, Singapura Main Rd, Bengaluru, Karnataka 560097.</p>
            </div>
          </>
        )}

        {tab === "terms" && (
          <>
            <div className="sf-account__head">
              <h1><FiFileText style={{verticalAlign:"middle",marginRight:8,color:"#b58a2e"}}/>Terms &amp; Conditions</h1>
              <p className="sf-account__head-sub">Last updated: January 2025</p>
            </div>
            <hr className="sf-account__rule" />
            <div className="sf-legal">
              <h3>1. Acceptance of Terms</h3>
              <p>By accessing or using the Garuda website and services, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>

              <h3>2. Eligibility</h3>
              <p>You must be at least 18 years of age and capable of entering into a legally binding agreement to use our services. By registering, you confirm that all information provided is accurate and truthful.</p>

              <h3>3. Orders and Pricing</h3>
              <p>All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes. We reserve the right to modify prices at any time. An order is confirmed only after you receive an order confirmation email or SMS.</p>

              <h3>4. Payment</h3>
              <p>We accept payments via credit/debit cards, UPI, net banking, and other methods displayed at checkout. All transactions are encrypted and processed securely. We do not store your payment card details.</p>

              <h3>5. Shipping and Delivery</h3>
              <p>Delivery timelines are estimates and may vary based on your location and product availability. Garuda is not liable for delays caused by third-party logistics partners, natural disasters, or other events beyond our control.</p>

              <h3>6. Returns and Refunds</h3>
              <p>Products may be returned within 7 days of delivery in their original condition and packaging. Refunds are processed within 5–7 business days after we receive and inspect the returned item. Certain products (opened electronics, consumables) are non-returnable.</p>

              <h3>7. Intellectual Property</h3>
              <p>All content on this website, including logos, images, and text, is the property of Garuda Electronics and is protected by applicable intellectual property laws. Unauthorised use is strictly prohibited.</p>

              <h3>8. Limitation of Liability</h3>
              <p>To the maximum extent permitted by law, Garuda shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services.</p>

              <h3>9. Governing Law</h3>
              <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka.</p>

              <h3>10. Contact</h3>
              <p>For any queries regarding these Terms, contact us at <strong>legal@garuda.com</strong>.</p>
            </div>
          </>
        )}

        {tab === "delete" && (
          <>
            <div className="sf-account__head">
              <h1 style={{color:"#c0392b"}}><FiAlertTriangle style={{verticalAlign:"middle",marginRight:8}}/>Delete Account</h1>
              <p className="sf-account__head-sub">This action is permanent and cannot be undone.</p>
            </div>
            <hr className="sf-account__rule" />
            <div className="sf-delete-account">
              <div className="sf-delete-account__warning">
                <FiAlertTriangle size={22} />
                <div>
                  <strong>Warning: This will permanently delete your account.</strong>
                  <p>All your data — including your profile, order history, saved address, and wishlist — will be permanently removed from our systems. This action <u>cannot</u> be reversed.</p>
                </div>
              </div>

              <div className="sf-delete-account__what">
                <p><strong>What will be deleted:</strong></p>
                <ul>
                  <li>Your profile and contact details</li>
                  <li>All order history and invoices</li>
                  <li>Saved delivery address</li>
                  <li>Wishlist items</li>
                  <li>All account preferences</li>
                </ul>
              </div>

              <div className="sf-delete-account__confirm">
                <label>Type <strong>DELETE</strong> to confirm</label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={e => { setDeleteConfirm(e.target.value); setDeleteErr(""); }}
                  placeholder="Type DELETE here"
                  className="sf-delete-account__input"
                />
                {deleteErr && <p className="sf-auth__error">{deleteErr}</p>}
                <button
                  className="sf-delete-account__btn"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? "Deleting…" : "Permanently Delete My Account"}
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default AccountPage;