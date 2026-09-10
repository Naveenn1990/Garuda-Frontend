// Product detail page. Layout: breadcrumb, gallery (main + thumbs + prev/next),
// info column (category, title, price, description, qty stepper, Add to Cart / Buy Now
// / wishlist, SKU + tags), a specifications section, and related products.
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FiHeart, FiShoppingCart, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useShopProduct, useSubmitEnquiry } from "../hooks/useShop";
import { useStore } from "../store/StoreProvider";
import { useCustomerAuth } from "../store/CustomerAuthProvider";
import ProductCard from "../components/ProductCard";
import ReviewsTab from "../components/ReviewsTab";
import { imageUrl, formatINR, displayPrice } from "../utils";

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useShopProduct(id);
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const { customer } = useCustomerAuth();
  const submitEnquiry = useSubmitEnquiry();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("description");
  const [reviewCount, setReviewCount] = useState(0);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({ name: "", mobile: "", message: "" });
  const [enquiryDone, setEnquiryDone] = useState(false);
  const [enquiryErr, setEnquiryErr] = useState("");

  if (isLoading) return <p style={{ padding: 40 }}>Loading...</p>;
  if (isError || !data?.item) return <div className="sf-empty">Product not found.</div>;

  const product = data.item;
  const related = data.related || [];
  const price = displayPrice(product);
  const hasDiscount = product.mrp && product.sellingPrice && product.mrp > product.sellingPrice;
  const offPct = hasDiscount
    ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
    : 0;

  const images = product.images?.length ? product.images : [];
  const hasImages = images.length > 0;
  const cartItem = {
    id: product._id,
    name: product.name,
    sku: product.sku,
    price,
    image: images[0] || "",
  };

  const prevImg = () => setActiveImg((i) => (i - 1 + images.length) % images.length);
  const nextImg = () => setActiveImg((i) => (i + 1) % images.length);

  function handleAdd() {
    addToCart(cartItem, qty);
  }

  function openEnquiry() {
    setEnquiryDone(false);
    setEnquiryErr("");
    setEnquiryForm({
      name: customer?.name && customer.name !== "Guest" ? customer.name : "",
      mobile: customer?.mobile || "",
      message: `I'm interested in ${product.name}.`,
    });
    setEnquiryOpen(true);
  }

  async function handleEnquirySubmit(e) {
    e.preventDefault();
    setEnquiryErr("");
    if (!enquiryForm.name || !enquiryForm.mobile) {
      return setEnquiryErr("Please enter your name and mobile.");
    }
    try {
      await submitEnquiry.mutateAsync({
        name: enquiryForm.name,
        mobile: enquiryForm.mobile,
        product: product._id,
        message: enquiryForm.message,
      });
      setEnquiryDone(true);
    } catch (err) {
      setEnquiryErr(err.response?.data?.message || "Could not submit enquiry.");
    }
  }

  return (
    <div className="sf-pdp2">
      {/* Breadcrumb */}
      <nav className="sf-crumb">
        <Link to="/">Home</Link> <span>/</span>
        <Link to="/shop">Shop</Link> <span>/</span>
        {product.category?.name && (
          <>
            <Link to={`/shop?category=${product.category._id}`}>{product.category.name}</Link>
            <span>/</span>
          </>
        )}
        <span className="sf-crumb__current">{product.name}</span>
      </nav>

      <div className="sf-pdp2__top">
        {/* Gallery */}
        <div className="sf-pdp2__gallery">
          <div className="sf-pdp2__stage">
            {hasImages ? (
              <img src={imageUrl(images[activeImg])} alt={product.name} />
            ) : (
              <div className="sf-card__noimg">No image</div>
            )}
            {images.length > 1 && (
              <>
                <button className="sf-pdp2__arrow sf-pdp2__arrow--l" onClick={prevImg} aria-label="Previous">
                  <FiChevronLeft />
                </button>
                <button className="sf-pdp2__arrow sf-pdp2__arrow--r" onClick={nextImg} aria-label="Next">
                  <FiChevronRight />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="sf-pdp2__thumbs">
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`sf-pdp2__thumb ${i === activeImg ? "is-active" : ""}`}
                  onClick={() => setActiveImg(i)}
                >
                  <img src={imageUrl(img)} alt={`${product.name} ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="sf-pdp2__info">
          {product.category?.name && <span className="sf-pdp2__cat">{product.category.name}</span>}
          <h1 className="sf-pdp2__title">{product.name}</h1>
          {product.brand?.name && <div className="sf-pdp2__brand">by {product.brand.name}</div>}

          <div className="sf-pdp2__price">
            <span className="sf-pdp2__now">{formatINR(price)}</span>
            {hasDiscount && <span className="sf-pdp2__mrp">{formatINR(product.mrp)}</span>}
            {hasDiscount && <span className="sf-pdp2__off">{offPct}% off</span>}
          </div>

          {product.model && <p className="sf-pdp2__model">Model: {product.model}</p>}

          <div className="sf-pdp2__buy">
            <div className="sf-qtystep">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty((q) => q + 1)}>+</button>
            </div>
            <button className="sf-btn sf-btn--dark" onClick={handleAdd}>
              <FiShoppingCart /> Add to Cart
            </button>
            <button className="sf-btn sf-btn--gold" onClick={openEnquiry}>
              Enquiry
            </button>
            <button
              className={`sf-pdp2__wish ${isWishlisted(product._id) ? "is-active" : ""}`}
              onClick={() => toggleWishlist(cartItem)}
              aria-label="Wishlist"
            >
              <FiHeart />
            </button>
          </div>

          <div className="sf-pdp2__meta">
            {product.sku && <div><strong>SKU:</strong> {product.sku}</div>}
            {product.hsn && <div><strong>HSN:</strong> {product.hsn}</div>}
            {product.category?.name && <div><strong>Category:</strong> {product.category.name}</div>}
          </div>
        </div>
      </div>

      {/* Tabs: Description | Specifications | Reviews */}
      {(() => {
        const specs = (product.specifications || []).filter((s) => s.key && s.value);
        return (
          <section className="sf-tabs">
            <div className="sf-tabs__bar">
              <button
                className={`sf-tabs__tab ${tab === "description" ? "is-active" : ""}`}
                onClick={() => setTab("description")}
              >
                Description
              </button>
              <button
                className={`sf-tabs__tab ${tab === "specs" ? "is-active" : ""}`}
                onClick={() => setTab("specs")}
              >
                Specifications
              </button>
              <button
                className={`sf-tabs__tab ${tab === "reviews" ? "is-active" : ""}`}
                onClick={() => setTab("reviews")}
              >
                Reviews ({reviewCount})
              </button>
            </div>

            <div className="sf-tabs__body">
              {tab === "description" && (
                <div>
                  <h3 className="sf-tabs__heading">Product Description</h3>
                  {product.description ? (
                    <p className="sf-tabs__desc">{product.description}</p>
                  ) : (
                    <p className="sf-tabs__muted">No description available for this product.</p>
                  )}
                </div>
              )}

              {tab === "specs" && (
                specs.length > 0 ? (
                  <table className="sf-specs sf-specs--striped">
                    <tbody>
                      {specs.map((s, i) => (
                        <tr key={i}>
                          <td>{s.key}</td>
                          <td>{s.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="sf-tabs__muted">No specifications added for this product.</p>
                )
              )}

              {tab === "reviews" && (
                <ReviewsTab productId={product._id} onCountChange={setReviewCount} />
              )}
            </div>
          </section>
        );
      })()}

      {/* Related */}
      {related.length > 0 && (
        <section className="sf-section" style={{ marginTop: 44 }}>
          <div className="sf-section__head">
            <h2>Related Products</h2>
            <Link to="/shop">View all →</Link>
          </div>
          <div className="sf-grid">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Enquiry modal -> creates a CRM lead */}
      {enquiryOpen && (
        <div className="sf-modal" onClick={() => setEnquiryOpen(false)}>
          <div className="sf-modal__box" onClick={(e) => e.stopPropagation()}>
            <button className="sf-modal__close" onClick={() => setEnquiryOpen(false)}>×</button>
            {enquiryDone ? (
              <div className="sf-empty" style={{ padding: "20px 0" }}>
                <h3>Thank you!</h3>
                <p>Your enquiry for <strong>{product.name}</strong> has been received. Our team will contact you shortly.</p>
              </div>
            ) : (
              <form className="sf-auth__form" onSubmit={handleEnquirySubmit} style={{ maxWidth: "none" }}>
                <h3 style={{ margin: "0 0 4px" }}>Enquire about this product</h3>
                <p className="sf-auth__sub">{product.name}</p>
                <label>Name *</label>
                <input value={enquiryForm.name} onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })} required />
                <label>Mobile *</label>
                <input value={enquiryForm.mobile} onChange={(e) => setEnquiryForm({ ...enquiryForm, mobile: e.target.value })} required />
                <label>Message</label>
                <textarea rows={3} value={enquiryForm.message} onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })} />
                {enquiryErr && <p className="sf-auth__error">{enquiryErr}</p>}
                <button className="sf-btn sf-btn--dark" type="submit" disabled={submitEnquiry.isPending}>
                  {submitEnquiry.isPending ? "Sending..." : "Submit Enquiry"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetailPage;
