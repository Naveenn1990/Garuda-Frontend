// Reviews tab: shows average + list of reviews, and (for a logged-in customer who
// purchased the product and hasn't reviewed yet) a form with star rating, text, and
// image upload. Reading is public; writing is verified-purchase only.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiStar } from "react-icons/fi";
import { api } from "../../../services";
import { useCustomerAuth } from "../store/CustomerAuthProvider";
import { imageUrl } from "../utils";

function Stars({ value, onChange, size = 18 }) {
  return (
    <span className="sf-stars" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`sf-star ${n <= value ? "is-on" : ""} ${onChange ? "is-btn" : ""}`}
          onClick={onChange ? () => onChange(n) : undefined}
          disabled={!onChange}
          aria-label={`${n} star`}
        >
          <FiStar />
        </button>
      ))}
    </span>
  );
}

export function ReviewsTab({ productId, onCountChange }) {
  const { isLoggedIn, token, submitReview, uploadReviewImage } = useCustomerAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      // Pass the customer token (if any) so the server can tell us canReview.
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await api.get(`/shop/products/${productId}/reviews`, { headers });
      setData(res.data);
      onCountChange?.(res.data.count);
    } catch {
      setData({ reviews: [], count: 0, average: 0, canReview: false });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [productId, token]); // eslint-disable-line

  async function handleImagePick(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const urls = [];
      for (const f of files) urls.push(await uploadReviewImage(f));
      setImages((prev) => [...prev, ...urls]);
    } catch (err) {
      setError(err.response?.data?.message || "Image upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!rating) return setError("Please select a star rating.");
    setSubmitting(true);
    try {
      await submitReview(productId, { rating, text, images });
      setRating(0);
      setText("");
      setImages([]);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit your review.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="sf-tabs__muted">Loading reviews...</p>;

  const { reviews = [], count = 0, average = 0, canReview, alreadyReviewed } = data || {};

  return (
    <div className="sf-reviews">
      {/* Summary */}
      <div className="sf-reviews__summary">
        <div className="sf-reviews__avg">{average.toFixed(1)}</div>
        <div>
          <Stars value={Math.round(average)} />
          <div className="sf-reviews__count">{count} review{count === 1 ? "" : "s"}</div>
        </div>
      </div>

      {/* Write form / prompts */}
      {canReview ? (
        <form className="sf-reviewform" onSubmit={handleSubmit}>
          <h4>Write a review</h4>
          <div className="sf-reviewform__rate">
            <span>Your rating:</span>
            <Stars value={rating} onChange={setRating} size={24} />
          </div>
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your experience with this product..."
          />
          <div className="sf-reviewform__images">
            {images.map((url) => (
              <img key={url} src={imageUrl(url)} alt="review" />
            ))}
            <label className="sf-reviewform__add">
              {uploading ? "..." : "+ Photo"}
              <input type="file" accept="image/*" multiple hidden onChange={handleImagePick} />
            </label>
          </div>
          {error && <p className="sf-auth__error">{error}</p>}
          <button className="sf-btn sf-btn--dark" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      ) : alreadyReviewed ? (
        <p className="sf-tabs__muted">You've already reviewed this product. Thank you!</p>
      ) : isLoggedIn ? (
        <p className="sf-tabs__muted">Only customers who purchased this product can review it.</p>
      ) : (
        <p className="sf-tabs__muted">
          <Link to="/account/login">Log in</Link> and purchase this product to leave a review.
        </p>
      )}

      {/* List */}
      {reviews.length === 0 ? (
        <div className="sf-reviews-empty">
          <FiStar />
          <p>No reviews yet. Be the first to review this product.</p>
        </div>
      ) : (
        <div className="sf-reviews__list">
          {reviews.map((r) => (
            <div className="sf-review" key={r._id}>
              <div className="sf-review__head">
                <span className="sf-review__name">{r.customerName || "Customer"}</span>
                {r.verifiedPurchase && <span className="sf-review__verified">Verified Purchase</span>}
              </div>
              <Stars value={r.rating} size={14} />
              {r.text && <p className="sf-review__text">{r.text}</p>}
              {r.images?.length > 0 && (
                <div className="sf-review__images">
                  {r.images.map((url) => (
                    <img key={url} src={imageUrl(url)} alt="review" />
                  ))}
                </div>
              )}
              <span className="sf-review__date">
                {new Date(r.createdAt).toLocaleDateString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewsTab;
