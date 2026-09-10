// Home hero banner slider, driven by admin-managed banners. Auto-rotates when there
// is more than one. Falls back to a default hero when no banners are configured.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useShopBanners } from "../hooks/useShop";
import { imageUrl } from "../utils";

export function HeroBanner() {
  const { data: banners = [], isLoading } = useShopBanners();
  const [index, setIndex] = useState(0);

  // Auto-rotate every 5s when there are multiple banners.
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  // Fallback hero if no banners are set up yet.
  if (!isLoading && banners.length === 0) {
    return (
      <section className="sf-hero">
        <h1>Garuda International</h1>
        <p>Quality home appliances and more, delivered from our showrooms to you.</p>
        <Link to="/shop" className="sf-btn">Shop Now</Link>
      </section>
    );
  }

  if (isLoading || banners.length === 0) return null;

  const active = banners[index];

  return (
    <section className="sf-banner">
      {/* Mobile: real image so the banner is exactly the image height (no letterbox). */}
      <img
        className="sf-banner__mobimg"
        src={imageUrl(active.image)}
        alt={active.title || "Banner"}
      />

      {banners.map((b, i) => (
        <div
          key={b._id}
          className={`sf-banner__slide ${i === index ? "is-active" : ""}`}
          style={{ backgroundImage: `url(${imageUrl(b.image)})` }}
          aria-hidden={i !== index}
        >
          {(b.badge || b.title || b.subtitle || b.buttonText) && (
            <div className="sf-banner__overlay">
              {b.badge && <span className="sf-banner__badge">{b.badge}</span>}
              {b.title && <h1 className="sf-banner__title">{b.title}</h1>}
              {b.subtitle && <p className="sf-banner__subtitle">{b.subtitle}</p>}
              {b.buttonText && (
                <Link to={b.buttonLink || "/shop"} className="sf-banner__btn">
                  {b.buttonText}
                </Link>
              )}
            </div>
          )}
        </div>
      ))}

      {banners.length > 1 && (
        <div className="sf-banner__dots">
          {banners.map((b, i) => (
            <button
              key={b._id}
              className={`sf-banner__dot ${i === index ? "is-active" : ""}`}
              onClick={() => setIndex(i)}
              aria-label={`Go to banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default HeroBanner;
