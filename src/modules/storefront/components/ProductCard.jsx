// Product card: centered image, wishlist heart, 2-line name, brand, price with
// strikethrough MRP + red "% off", a red cash-back line, and an always-visible
// black "Add to Cart" button.
import { Link } from "react-router-dom";
import { FiHeart } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { useStore } from "../store/StoreProvider";
import { imageUrl, formatINR, displayPrice } from "../utils";

export function ProductCard({ product }) {
  const { addToCart, updateQty, removeFromCart, getCartQty, toggleWishlist, isWishlisted } = useStore();
  const price = displayPrice(product);
  const qtyInCart = getCartQty(product._id);

  function decrease() {
    if (qtyInCart <= 1) removeFromCart(product._id);
    else updateQty(product._id, qtyInCart - 1);
  }
  const hasDiscount = product.mrp && product.sellingPrice && product.mrp > product.sellingPrice;
  const offPct = hasDiscount
    ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
    : 0;
  const img = imageUrl(product.images?.[0]);

  const cartItem = {
    id: product._id,
    name: product.name,
    sku: product.sku,
    price,
    image: product.images?.[0] || "",
  };

  return (
    <div className="sf-card">
      <button
        className={`sf-card__wish ${isWishlisted(product._id) ? "is-active" : ""}`}
        onClick={() => toggleWishlist(cartItem)}
        aria-label="Toggle wishlist"
      >
        {isWishlisted(product._id) ? <FaHeart /> : <FiHeart />}
      </button>

      <Link to={`/product/${product._id}`} className="sf-card__media">
        {img ? (
          <img src={img} alt={product.name} loading="lazy" />
        ) : (
          <div className="sf-card__noimg">No image</div>
        )}
      </Link>

      <div className="sf-card__body">
        <Link to={`/product/${product._id}`} className="sf-card__name">
          {product.name}
        </Link>
        {product.brand?.name && (
          <span className="sf-card__brand">
            <span className="sf-card__brand-label">Brand:</span> {product.brand.name}
          </span>
        )}

        <div className="sf-card__price">
          <span className="sf-card__now">{formatINR(price)}</span>
          {hasDiscount && <span className="sf-card__mrp">{formatINR(product.mrp)}</span>}
          {hasDiscount && <span className="sf-card__off">{offPct}% off</span>}
        </div>

        {qtyInCart > 0 ? (
          <div className="sf-card__qty">
            <button type="button" onClick={decrease} aria-label="Decrease quantity">
              −
            </button>
            <span>{qtyInCart} in cart</span>
            <button
              type="button"
              onClick={() => updateQty(product._id, qtyInCart + 1)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        ) : (
          <button className="sf-card__add" onClick={() => addToCart(cartItem)}>
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
