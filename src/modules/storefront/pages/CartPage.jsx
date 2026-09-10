// Cart: list items, change quantity, remove, see totals. Checkout is a Phase 2
// feature; for now "Enquire" routes to the enquiry form.
import { Link, useNavigate } from "react-router-dom";
import { FiShoppingCart, FiTrash2, FiArrowRight } from "react-icons/fi";
import { useStore } from "../store/StoreProvider";
import { imageUrl, formatINR } from "../utils";
import emptyCartImg from "../../../assets/emptycart.svg";

export function CartPage() {
  const navigate = useNavigate();
  const { cart, cartTotal, updateQty, removeFromCart, clearCart } = useStore();

  if (cart.length === 0) {
    return (
      <div className="sf-emptycart">
        <img src={emptyCartImg} alt="Empty cart" className="sf-emptycart__img" />
        <h2 className="sf-emptycart__title">Your cart is empty</h2>
        <p className="sf-emptycart__sub">
          Looks like you haven't added anything yet. Browse our range and find something you love.
        </p>
        <Link to="/shop" className="sf-btn sf-btn--dark sf-emptycart__btn">
          <FiShoppingCart /> Start Shopping
        </Link>
      </div>
    );
  }

  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div>
      <div className="sf-cart__header">
        <span className="sf-cart__header-icon">
          <FiShoppingCart />
        </span>
        <div>
          <h1 className="sf-cart__header-title">Your Cart</h1>
          <p className="sf-cart__header-sub">{itemCount} item{itemCount === 1 ? "" : "s"} ready for checkout</p>
        </div>
      </div>
      <div className="sf-cart">
        <div className="sf-cart__items">
          {cart.map((item) => (
            <div className="sf-cart__row" key={item.id}>
              {item.image ? (
                <img className="sf-cart__thumb" src={imageUrl(item.image)} alt={item.name} />
              ) : (
                <div className="sf-cart__thumb" />
              )}
              <div className="sf-cart__info">
                <Link to={`/product/${item.id}`} className="sf-cart__name">{item.name}</Link>
                <div className="sf-cart__sku">{item.sku}</div>
                <div className="sf-cart__price">{formatINR(item.price)}</div>
              </div>
              <div className="sf-qty-stepper">
                <button
                  type="button"
                  onClick={() => updateQty(item.id, Math.max(1, item.qty - 1))}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) => updateQty(item.id, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => updateQty(item.id, item.qty + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <div className="sf-cart__linetotal">
                {formatINR(item.price * item.qty)}
              </div>
              <button
                className="sf-cart__remove"
                onClick={() => removeFromCart(item.id)}
                aria-label="Remove item"
                title="Remove"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>

        <aside className="sf-summary">
          <h3 className="sf-summary__heading">Order summary</h3>
          <div className="sf-summary__row">
            <span>Items ({itemCount})</span>
            <span>{formatINR(cartTotal)}</span>
          </div>
          <div className="sf-summary__row sf-summary__total">
            <span>Total</span>
            <span>{formatINR(cartTotal)}</span>
          </div>
          <button
            className="sf-btn sf-btn--dark"
            style={{ width: "100%", marginTop: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            onClick={() => navigate("/checkout")}
          >
            Proceed to Checkout <FiArrowRight />
          </button>
          <button
            className="sf-btn sf-btn--outline"
            style={{ width: "100%", marginTop: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            onClick={clearCart}
          >
            <FiTrash2 /> Clear Cart
          </button>
        </aside>
      </div>
    </div>
  );
}
export default CartPage;