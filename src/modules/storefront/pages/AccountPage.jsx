// My Account: view/edit profile + saved address, and order history. Requires a
// logged-in customer; redirects to the login page otherwise.
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiMapPin, FiLogOut, FiPackage, FiCheckCircle } from "react-icons/fi";
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
      </section>
    </div>
  );
}

export default AccountPage;