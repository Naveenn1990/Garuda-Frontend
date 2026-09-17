// About Us — dynamic storefront page. Content (images + text) is admin-editable
// via the CMS; live stats (products, brands, showrooms) come from the shop API.
import { Link } from "react-router-dom";
import {
  FiTruck, FiShield, FiAward, FiHeadphones, FiTag, FiRefreshCw,
  FiMapPin, FiPackage, FiShoppingBag, FiTarget, FiEye, FiCalendar,
} from "react-icons/fi";
import {
  useShopProducts, useShopBrands, useShopCategories, useStoreLocations,
  useAboutContent,
} from "../hooks/useShop";
import { imageUrl } from "../utils";
import "../components/storefront.css";

const FEATURES = [
  { icon: FiTruck,      title: "On-Time Delivery",          text: "Fast, reliable doorstep delivery with real-time tracking. Your appliances arrive when promised — safely and on schedule." },
  { icon: FiShield,     title: "100% Secure Payments",      text: "Every transaction is encrypted and processed through PCI-compliant gateways. Shop with total peace of mind." },
  { icon: FiAward,      title: "Genuine Products",          text: "Only authentic products from authorised brand partners, each backed by full manufacturer warranty." },
  { icon: FiTag,        title: "Fair, Transparent Pricing", text: "No hidden charges, ever. Honest prices with regular offers and coupons so you always get the best value." },
  { icon: FiRefreshCw,  title: "Easy Returns",              text: "Not satisfied? Our hassle-free 7-day return policy makes exchanges and refunds simple and quick." },
  { icon: FiHeadphones, title: "Dedicated Support",         text: "A knowledgeable team ready to help you choose the right product and assist you long after purchase." },
];

// Fallback content when the admin hasn't set anything yet.
const FALLBACK = {
  aboutTitle: "Welcome to Garuda International",
  aboutBody:
    "A trusted retailer of home appliances — from small essentials like grinders, kettles and pressure cookers, to large appliances like refrigerators, televisions and washing machines.\n\nQuality products from leading brands, fair and transparent pricing, and a shopping experience that's simple whether you visit a showroom or shop online.",
  aboutImage: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80",
  storyHeading: "15+ Years of Trust",
  storyBadge: "Established 2000",
  storyBody:
    "Garuda International began in 2000 as a single neighbourhood appliance store with one simple belief — that every home deserves quality products at honest prices, backed by service you can rely on.\n\nOver 15+ years, we've grown into multiple showrooms and a thriving online store, serving thousands of happy families across the region.",
  storyImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80",
  vision:
    "To be the region's most trusted name in home appliances — the first choice for every family looking for quality, value and dependable service.",
  mission:
    "To make premium home appliances accessible to everyone through fair pricing, genuine products, seamless delivery and a customer experience that earns trust and lasts a lifetime.",
};

// Render a multi-paragraph string (blank line = new paragraph).
function Paragraphs({ text, className }) {
  return (text || "")
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((p, i) => (
      <p key={i} className={className}>{p.trim()}</p>
    ));
}

export function AboutPage() {
  const { data: productData } = useShopProducts({ limit: 1 });
  const { data: brands = [] } = useShopBrands();
  const { data: categories = [] } = useShopCategories();
  const { data: stores = [] } = useStoreLocations();
  const { data: cms } = useAboutContent();

  // Merge CMS content over fallbacks (use fallback when a field is empty).
  const c = { ...FALLBACK };
  if (cms) {
    for (const k of Object.keys(FALLBACK)) {
      if (cms[k]) c[k] = cms[k];
    }
  }

  const productCount = productData?.total ?? 0;
  const stats = [
    { icon: FiPackage,     value: productCount,      suffix: "+", label: "Products" },
    { icon: FiShoppingBag, value: brands.length,      suffix: "+", label: "Trusted Brands" },
    { icon: FiTag,         value: categories.length,  suffix: "",  label: "Categories" },
    { icon: FiMapPin,      value: stores.length,      suffix: "",  label: "Showrooms" },
  ];

  return (
    <div className="sf-about">

      {/* About Us: image left, content right */}
      <section className="sf-about__split">
        <div className="sf-about__split-img">
          <img src={imageUrl(c.aboutImage)} alt="About Garuda International" loading="lazy" />
        </div>
        <div className="sf-about__split-body">
          <span className="sf-about__eyebrow">About Us</span>
          <h1 className="sf-about__title">{c.aboutTitle}</h1>
          <Paragraphs text={c.aboutBody} className="sf-about__lead" />
          <div className="sf-about__cta-btns" style={{ justifyContent: "flex-start", marginTop: 18 }}>
            <Link to="/shop" className="sf-btn sf-btn--dark">Browse Products</Link>
            <Link to="/stores" className="sf-btn sf-btn--outline">Find a Showroom</Link>
          </div>
        </div>
      </section>

      {/* Live stats */}
      <section className="sf-about__stats">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div className="sf-about__stat" key={s.label}>
              <div className="sf-about__stat-icon"><Icon /></div>
              <div className="sf-about__stat-value">{s.value}{s.suffix}</div>
              <div className="sf-about__stat-label">{s.label}</div>
            </div>
          );
        })}
      </section>

      {/* Why Garuda */}
      <section className="sf-about__why">
        <div className="sf-about__section-head">
          <span className="sf-about__eyebrow">Why Choose Us</span>
          <h2>Why Garuda International?</h2>
          <p>Everything we do is built around making your appliance shopping simple, safe and satisfying.</p>
        </div>
        <div className="sf-about__features">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div className="sf-about__feature" key={f.title}>
                <div className="sf-about__feature-icon"><Icon /></div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Our Story: image left, content right */}
      <section className="sf-about__split sf-about__split--alt">
        <div className="sf-about__split-img">
          <img src={imageUrl(c.storyImage)} alt="Our journey" loading="lazy" />
        </div>
        <div className="sf-about__split-body">
          <span className="sf-about__eyebrow">Our Story</span>
          <h2 className="sf-about__title" style={{ fontSize: "1.9rem" }}>{c.storyHeading}</h2>
          {c.storyBadge && (
            <div className="sf-about__story-badge">
              <FiCalendar /> {c.storyBadge}
            </div>
          )}
          <Paragraphs text={c.storyBody} className="sf-about__lead" />
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="sf-about__vm">
        <div className="sf-about__vm-card">
          <div className="sf-about__vm-icon"><FiEye /></div>
          <h3>Our Vision</h3>
          <p>{c.vision}</p>
        </div>
        <div className="sf-about__vm-card">
          <div className="sf-about__vm-icon"><FiTarget /></div>
          <h3>Our Mission</h3>
          <p>{c.mission}</p>
        </div>
      </section>

      {/* CTA */}
      <section className="sf-about__cta">
        <h2>Ready to find your next appliance?</h2>
        <p>Browse our full range online or visit your nearest showroom today.</p>
        <div className="sf-about__cta-btns">
          <Link to="/shop" className="sf-btn sf-btn--dark">Browse Products</Link>
          <Link to="/stores" className="sf-btn sf-btn--outline">Find a Showroom</Link>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
