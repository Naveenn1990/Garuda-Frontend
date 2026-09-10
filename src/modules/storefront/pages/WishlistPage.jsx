// Wishlist: saved products shown as premium cards. Move to cart or remove.
import { Link } from "react-router-dom";
import { FiHeart, FiX } from "react-icons/fi";
import { useStore } from "../store/StoreProvider";
import { imageUrl, formatINR } from "../utils";
import emptyImg from "../../../assets/emptycart.svg";

export function WishlistPage() {
  const { wishlist, removeFromWishlist, addToCart } = useStore();

  if (wishlist.length === 0) {
    return (
      <div className="sf-emptycart">
        <img src={emptyImg} alt="Empty wishlist" className="sf-emptycart__img" />
        <h2 className="sf-emptycart__title">Your wishlist is empty</h2>
        <p className="sf-emptycart__sub">
          Tap the heart on any product to save it here for later.
        </p>
        <Link to="/shop" className="sf-btn sf-btn--dark sf-emptycart__btn">
          <FiHeart /> Discover Products
        </Link>
      </div>
    );
  }

  return (
    <div className="sf-wishwrap">
      <h1 className="sf-wish__title">
        My Wishlist <span>{wishlist.length} item{wishlist.length === 1 ? "" : "s"}</span>
      </h1>

      <div className="sf-wishgrid">
        {wishlist.map((item) => {
          const hasMrp = item.mrp && item.mrp > item.price;
          const off = hasMrp ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;
          return (
            <div className="sf-wishcard" key={item.id}>
              <button
                className="sf-wishcard__x"
                onClick={() => removeFromWishlist(item.id)}
                aria-label="Remove from wishlist"
              >
                <FiX />
              </button>

              <Link to={`/product/${item.id}`} className="sf-wishcard__media">
                {item.image ? (
                  <img src={imageUrl(item.image)} alt={item.name} loading="lazy" />
                ) : (
                  <span className="sf-wishcard__noimg">{item.name.charAt(0)}</span>
                )}
              </Link>

              <div className="sf-wishcard__body">
                <Link to={`/product/${item.id}`} className="sf-wishcard__name">
                  {item.name}
                </Link>
                <div className="sf-wishcard__prices">
                  <span className="sf-wishcard__now">{formatINR(item.price)}</span>
                  {hasMrp && <span className="sf-wishcard__mrp">{formatINR(item.mrp)}</span>}
                  {hasMrp && <span className="sf-wishcard__off">({off}% OFF)</span>}
                </div>
              </div>

              <button
                className="sf-wishcard__move"
                onClick={() => { addToCart(item); removeFromWishlist(item.id); }}
              >
                MOVE TO CART
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WishlistPage;
