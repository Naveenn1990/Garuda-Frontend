// Checkout: review items, choose delivery address (saved or a new one via Google
// search + detect location), then pay (dummy gateway) which creates the order.
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMapPin, FiShoppingBag, FiLock, FiCrosshair } from "react-icons/fi";
import Lottie from "lottie-react";
import { useStore } from "../store/StoreProvider";
import { useCustomerAuth } from "../store/CustomerAuthProvider";
import { useGooglePlaces } from "../hooks/useGooglePlaces";
import { imageUrl, formatINR } from "../utils";
import orderConfirmedAnim from "../../../assets/Order Confirmed.json";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useStore();
  const { isLoggedIn, customer, checkout } = useCustomerAuth();
  const { ready, hasKey, attachAutocomplete, detectLocation, renderMap } = useGooglePlaces();

  const [mode, setMode] = useState("saved"); // "saved" | "other"
  const [other, setOther] = useState({ address: "", city: "", state: "", pincode: "", lat: null, lng: null });
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null); // { number, total }
  const addressRef = useRef(null);
  const mapRef = useRef(null);       // map container div
  const mapCtrl = useRef(null);      // map controller from renderMap

  // Must be logged in to check out.
  useEffect(() => {
    if (!isLoggedIn) navigate("/account/login", { replace: true });
  }, [isLoggedIn, navigate]);

  // Google autocomplete for the "other address" input.
  useEffect(() => {
    if (mode === "other" && ready && addressRef.current) {
      attachAutocomplete(addressRef.current, (place) => setOther((o) => ({ ...o, ...place })));
    }
  }, [mode, ready, attachAutocomplete]);

  // Show/update the map with a red draggable marker once we have coordinates.
  useEffect(() => {
    if (mode !== "other" || !ready || !other.lat || !mapRef.current) return;
    if (!mapCtrl.current) {
      mapCtrl.current = renderMap(
        mapRef.current,
        { lat: other.lat, lng: other.lng },
        // Dragging the marker updates the address fields.
        (place) => setOther((o) => ({ ...o, ...place }))
      );
    } else {
      mapCtrl.current.setCenter({ lat: other.lat, lng: other.lng });
    }
  }, [mode, ready, other.lat, other.lng, renderMap]);

  // Reset the map controller when leaving "other" mode so it re-inits next time.
  useEffect(() => {
    if (mode !== "other") mapCtrl.current = null;
  }, [mode]);

  const hasSaved = Boolean(customer?.address);

  async function handleDetect() {
    setError("");
    try {
      const place = await detectLocation();
      setOther((o) => ({ ...o, ...place }));
    } catch {
      setError("Couldn't detect your location. Please type the address.");
    }
  }

  async function handlePay() {
    setError("");
    // Resolve the delivery address.
    let deliveryAddress;
    if (mode === "saved") {
      if (!hasSaved) return setError("No saved address. Please add a delivery address.");
      deliveryAddress = {
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
      };
    } else {
      if (!other.address.trim()) return setError("Please enter a delivery address.");
      deliveryAddress = other;
    }

    setPlacing(true);
    try {
      const res = await checkout({
        items: cart.map((i) => ({ product: i.id, quantity: i.qty })),
        deliveryAddress,
        paymentMethod: "online",
      });
      clearCart();
      setDone({ number: res.number, total: res.total });
    } catch (err) {
      setError(err.response?.data?.message || "Checkout failed. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  if (done) {
    return (
      <div className="sf-empty" style={{ padding: "40px 20px 60px" }}>
        <Lottie
          animationData={orderConfirmedAnim}
          loop={false}
          style={{ width: 220, height: 220, margin: "0 auto" }}
        />
        <h2>Order placed successfully!</h2>
        <p>Your order <strong>#{done.number}</strong> for {formatINR(done.total)} is confirmed.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 16 }}>
          <Link to="/account" className="sf-btn sf-btn--dark">View My Orders</Link>
          <Link to="/shop" className="sf-btn sf-btn--outline">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="sf-empty">
        <h2>Your cart is empty</h2>
        <Link to="/shop" className="sf-btn">Go to Shop</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="sf-cart__header">
        <span className="sf-cart__header-icon">
          <FiMapPin />
        </span>
        <div>
          <h1 className="sf-cart__header-title">Checkout</h1>
          <p className="sf-cart__header-sub">Confirm your delivery address and place your order</p>
        </div>
      </div>
      <div className="sf-cart">
        <div>
          {/* Delivery address */}
          <div className="sf-checkout__section">
            <h3 className="sf-checkout__h3"><FiMapPin /> Delivery Address</h3>

            {hasSaved && (
              <label className={`sf-addropt ${mode === "saved" ? "is-active" : ""}`}>
                <input type="radio" checked={mode === "saved"} onChange={() => setMode("saved")} />
                <span className="sf-addropt__text">
                  <span className="sf-addropt__name">{customer.name} · {customer.mobile}</span>
                  <span className="sf-addropt__addr">
                    {customer.address}
                    {[customer.city, customer.state, customer.pincode].filter(Boolean).join(", ") &&
                      `, ${[customer.city, customer.state, customer.pincode].filter(Boolean).join(", ")}`}
                  </span>
                </span>
              </label>
            )}

            <label className={`sf-addropt ${mode === "other" ? "is-active" : ""}`}>
              <input type="radio" checked={mode === "other"} onChange={() => setMode("other")} />
              <span className="sf-addropt__text">
                <span className="sf-addropt__name">Deliver to a different address</span>
              </span>
            </label>

            {mode === "other" && (
              <div className="sf-checkout__other">
                <div className="sf-checkout__labelrow">
                  <label>Address</label>
                  {hasKey && (
                    <button type="button" className="sf-checkout__detect" onClick={handleDetect}>
                      <FiCrosshair /> Detect my location
                    </button>
                  )}
                </div>
                <input
                  ref={addressRef}
                  value={other.address}
                  onChange={(e) => setOther({ ...other, address: e.target.value })}
                  placeholder={hasKey ? "Search your address..." : "Enter address"}
                  className="sf-checkout__input"
                />
                <div className="sf-checkout__grid3">
                  <input value={other.city} onChange={(e) => setOther({ ...other, city: e.target.value })} placeholder="City" />
                  <input value={other.state} onChange={(e) => setOther({ ...other, state: e.target.value })} placeholder="State" />
                  <input value={other.pincode} onChange={(e) => setOther({ ...other, pincode: e.target.value })} placeholder="Pincode" />
                </div>

                {/* Map preview with red draggable marker */}
                {other.lat ? (
                  <div className="sf-checkout__mapwrap">
                    <div ref={mapRef} className="sf-checkout__map" />
                    <p className="sf-checkout__maphint">
                      <FiMapPin /> Drag the red pin to set the exact delivery location.
                    </p>
                  </div>
                ) : (
                  hasKey && (
                    <div className="sf-checkout__mapempty">
                      <FiMapPin />
                      <span>Search an address or detect your location to preview it on the map.</span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="sf-checkout__section">
            <h3 className="sf-checkout__h3"><FiShoppingBag /> Order Items</h3>
            <div className="sf-cart__items">
              {cart.map((item) => (
                <div className="sf-cart__row" key={item.id}>
                  {item.image ? (
                    <img className="sf-cart__thumb" src={imageUrl(item.image)} alt={item.name} />
                  ) : (
                    <div className="sf-cart__thumb" />
                  )}
                  <div className="sf-cart__info">
                    <span className="sf-cart__name">{item.name}</span>
                    <div className="sf-cart__sku">Qty: {item.qty}</div>
                  </div>
                  <div className="sf-cart__linetotal">{formatINR(item.price * item.qty)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary + pay */}
        <aside className="sf-summary">
          <h3 className="sf-summary__heading">Order Summary</h3>
          <div className="sf-summary__row">
            <span>Items ({cart.reduce((s, i) => s + i.qty, 0)})</span>
            <span>{formatINR(cartTotal)}</span>
          </div>
          <div className="sf-summary__row">
            <span>Delivery</span>
            <span className="sf-summary__free">FREE</span>
          </div>
          <div className="sf-summary__row sf-summary__total">
            <span>Total</span>
            <span>{formatINR(cartTotal)}</span>
          </div>

          {error && <p className="sf-auth__error">{error}</p>}

          <button
            className="sf-summary__pay"
            onClick={handlePay}
            disabled={placing}
          >
            {placing ? "Placing order..." : `Pay ${formatINR(cartTotal)}`}
          </button>

          <div className="sf-checkout__secure">
            <FiLock /> Secure online payment · test mode
          </div>
        </aside>
      </div>
    </div>
  );
}
export default CheckoutPage;
