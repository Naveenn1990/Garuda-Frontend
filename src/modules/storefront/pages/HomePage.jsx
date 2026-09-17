// Storefront home: admin-managed hero banner, category chips, featured, new arrivals
// and bestsellers.
import { Link } from "react-router-dom";
import { FiArrowRight, FiStar, FiZap, FiTrendingUp, FiClock, FiMessageCircle } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { useShopProducts, useShopCategories, useShopTestimonials } from "../hooks/useShop";
import ProductCard from "../components/ProductCard";
import HeroBanner from "../components/HeroBanner";
import { imageUrl } from "../utils";

// Section identity map — same as the mobile app
const SECTION_META = {
  "Featured":          { icon: FiStar,          tag: "HANDPICKED",     tagColor: "#b58a2e", tagBg: "#fff6dc" },
  "New Arrivals":      { icon: FiZap,           tag: "JUST IN",        tagColor: "#1a7f4e", tagBg: "#e6f7ec" },
  "Bestsellers":       { icon: FiTrendingUp,    tag: "TOP SELLING",    tagColor: "#c0392b", tagBg: "#fdecea" },
  "Latest Products":   { icon: FiClock,         tag: "RECENTLY ADDED", tagColor: "#1a5fa8", tagBg: "#e8f0fe" },
  "What Our Customers Say": { icon: FiMessageCircle, tag: "REVIEWS",   tagColor: "#6b4fa8", tagBg: "#f0ebff" },
};

// Descriptive tags + tagline per category (for the category cards). Falls back to
// generic labels for any category not listed, so it stays dynamic.
function categoryMeta(name) {
  const key = (name || "").toLowerCase();
  const map = {
    "air conditoner": { tagA: "Inverter Series", tagB: "Up to 45% Off", tagline: "Whisper-quiet cooling" },
    "air conditioner": { tagA: "Inverter Series", tagB: "Up to 45% Off", tagline: "Whisper-quiet cooling" },
    mattress: { tagA: "100-Night Trial", tagB: "Ortho Care", tagline: "Engineered for better sleep" },
    refrigerator: { tagA: "Frost Free", tagB: "White-Glove Delivery", tagline: "Dual cooling zones" },
    tv: { tagA: "4K & QLED", tagB: "Smart TV", tagline: "Cinematic picture quality" },
    "washing machine": { tagA: "Front & Top Load", tagB: "Inverter Motor", tagline: "Powerful, gentle wash" },
  };
  return map[key] || { tagA: "Best Sellers", tagB: "New Arrivals", tagline: "Explore the collection" };
}

function SectionHead({ title, viewAllTo }) {
  const meta = SECTION_META[title] || { icon: FiStar, tag: "", tagColor: "#b58a2e", tagBg: "#fff6dc" };
  const Icon = meta.icon;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
      {/* Left: icon bubble + badge + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Icon bubble */}
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          backgroundColor: meta.tagBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon size={20} color={meta.tagColor} />
        </div>

        <div>
          {/* Badge tag */}
          {meta.tag && (
            <div style={{
              display: "inline-block",
              backgroundColor: meta.tagBg,
              color: meta.tagColor,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              padding: "2px 8px",
              borderRadius: 4,
              marginBottom: 4,
              textTransform: "uppercase",
            }}>
              {meta.tag}
            </div>
          )}
          {/* Title */}
          <h2 style={{
            margin: 0,
            fontSize: "1.35rem",
            fontWeight: 800,
            color: "#16130e",
            lineHeight: 1.2,
          }}>
            {title}
          </h2>
        </div>
      </div>

      {/* View all button */}
      {viewAllTo && (
        <Link
          to={viewAllTo}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px",
            borderRadius: 999,
            backgroundColor: "#16130e",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          View all <FiArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

function ProductRow({ title, params, viewAllTo }) {
  const { data, isLoading } = useShopProducts({ limit: 8, ...params });
  const items = data?.items || [];
  if (!isLoading && items.length === 0) return null;
  return (
    <section className="sf-section">
      <SectionHead title={title} viewAllTo={viewAllTo} />
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="sf-grid">
          {items.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}

export function HomePage() {
  const { data: categories = [] } = useShopCategories();
  const { data: testimonials = [] } = useShopTestimonials();
  const topCategories = categories.filter((c) => !c.parent).slice(0, 12);

  return (
    <div>
      <HeroBanner />

      {topCategories.length > 0 && (
        <section className="py-10 mb-6">
          {/* Heading centered, with Explore All pushed to the right */}
          <div className="relative mb-10 flex flex-col items-center text-center">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-amber-600">
              <HiSparkles /> Explore Departments <HiSparkles />
            </span>

            <h2 className="mt-3 flex flex-wrap items-center justify-center gap-x-3 text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl">
              Shop by{" "}
              <span className="bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent">
                Category
              </span>
            </h2>

            {/* decorative underline with a dot */}
            <span className="mx-auto mt-4 flex items-center gap-2">
              <span className="block h-1 w-10 rounded-full bg-gradient-to-r from-transparent to-amber-400" />
              <span className="block h-2 w-2 rounded-full bg-amber-500" />
              <span className="block h-1 w-10 rounded-full bg-gradient-to-l from-transparent to-amber-400" />
            </span>

            <p className="mx-auto mt-4 max-w-xl text-neutral-500">
              Browse our full range, from small appliances to large home essentials.
            </p>

            {/* Explore All - top right on larger screens */}
            <Link
              to="/shop"
              className="group mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-900 hover:text-white md:absolute md:right-0 md:top-14 md:mt-0"
            >
              Explore All
              <FiArrowRight className="transition group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Compact icon cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {topCategories.map((c) => {
              const meta = categoryMeta(c.name);
              return (
                <Link
                  key={c._id}
                  to={`/shop?category=${c._id}`}
                  className="group flex flex-col items-center rounded-2xl border border-neutral-100 bg-white px-3 py-6 text-center transition hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg"
                >
                  <div className="mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-neutral-50 ring-1 ring-neutral-100 transition group-hover:ring-amber-200">
                    {c.image ? (
                      <img
                        src={imageUrl(c.image)}
                        alt={c.name}
                        loading="lazy"
                        className="h-full w-full object-contain p-2.5 transition duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-amber-500">{c.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold leading-tight text-neutral-900">{c.name}</span>
                  <span className="mt-0.5 text-[11px] leading-tight text-neutral-400">{meta.tagline}</span>
                </Link>
              );
            })}
          </div>

        </section>
      )}

      <ProductRow title="Featured" params={{ featured: true }} viewAllTo="/shop?featured=true" />
      <ProductRow title="New Arrivals" params={{ newArrival: true }} viewAllTo="/shop?newArrival=true" />
      <ProductRow title="Bestsellers" params={{ bestseller: true }} viewAllTo="/shop?bestseller=true" />
      <ProductRow title="Latest Products" params={{ sort: "newest" }} viewAllTo="/shop" />

      {testimonials.length > 0 && (
        <section className="sf-section">
          <SectionHead title="What Our Customers Say" />
          <div className="sf-testimonials">
            {testimonials.map((t) => (
              <div className="sf-testimonial" key={t._id}>
                <div className="sf-testimonial__stars">{"★".repeat(t.rating || 5)}</div>
                <p className="sf-testimonial__msg">"{t.message}"</p>
                <div className="sf-testimonial__who">
                  {t.photo ? (
                    <img src={imageUrl(t.photo)} alt={t.name} />
                  ) : (
                    <span className="sf-testimonial__avatar">{t.name.charAt(0)}</span>
                  )}
                  <div>
                    <div className="sf-testimonial__name">{t.name}</div>
                    {t.role && <div className="sf-testimonial__role">{t.role}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default HomePage;
