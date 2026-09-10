// Cart + Wishlist state for the storefront, persisted to localStorage so it survives
// refreshes. No customer login is needed in Phase 1; this is entirely client-side.
import { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";
import { FiShoppingCart, FiCheck } from "react-icons/fi";
import { FaHeart, FaRegHeart } from "react-icons/fa";

const CART_KEY = "garuda_cart";
const WISHLIST_KEY = "garuda_wishlist";

const StoreContext = createContext(null);

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }) {
  // cart items: [{ id, name, sku, price, image, qty }]
  const [cart, setCart] = useState(() => load(CART_KEY, []));
  // wishlist items: [{ id, name, sku, price, image }]
  const [wishlist, setWishlist] = useState(() => load(WISHLIST_KEY, []));

  // ---- Toasts ----
  const [toasts, setToasts] = useState([]); // [{ id, message, icon }]
  const toastId = useRef(0);
  // icon: "cart" | "wish" | "wish-off" | "check"
  function showToast(message, icon = "check") {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  // ---- Cart ----
  function addToCart(product, qty = 1) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { ...product, qty }];
    });
    showToast("Added to cart", "cart");
  }

  // Quantity of a given product currently in the cart (0 if not added).
  function getCartQty(id) {
    return cart.find((i) => i.id === id)?.qty || 0;
  }

  function updateQty(id, qty) {
    const q = Math.max(1, Number(qty) || 1);
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty: q } : i)));
  }

  function removeFromCart(id) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  function clearCart() {
    setCart([]);
  }

  // ---- Wishlist ----
  function toggleWishlist(product) {
    // Decide the action outside the state updater (updaters must be pure; StrictMode
    // runs them twice which would fire the toast twice).
    const exists = wishlist.some((i) => i.id === product.id);
    if (exists) {
      setWishlist((prev) => prev.filter((i) => i.id !== product.id));
      showToast("Removed from wishlist", "wish-off");
    } else {
      setWishlist((prev) => [...prev, product]);
      showToast("Added to wishlist", "wish");
    }
  }

  function isWishlisted(id) {
    return wishlist.some((i) => i.id === id);
  }

  function removeFromWishlist(id) {
    setWishlist((prev) => prev.filter((i) => i.id !== id));
  }

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const cartTotal = cart.reduce((sum, i) => sum + (Number(i.price) || 0) * i.qty, 0);

  const value = useMemo(
    () => ({
      cart,
      cartCount,
      cartTotal,
      addToCart,
      updateQty,
      removeFromCart,
      clearCart,
      getCartQty,
      wishlist,
      wishlistCount: wishlist.length,
      toggleWishlist,
      isWishlisted,
      removeFromWishlist,
      showToast,
    }),
    [cart, wishlist, cartCount, cartTotal]
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
      {/* Toast notifications (top center) */}
      <div className="sf-toasts">
        {toasts.map((t) => (
          <div key={t.id} className="sf-toast">
            <span className={`sf-toast__icon sf-toast__icon--${t.icon}`}>
              {t.icon === "cart" && <FiShoppingCart />}
              {t.icon === "wish" && <FaHeart />}
              {t.icon === "wish-off" && <FaRegHeart />}
              {t.icon === "check" && <FiCheck />}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
