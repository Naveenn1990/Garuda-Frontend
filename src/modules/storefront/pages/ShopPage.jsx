// Shop / catalogue. Accordion filter groups (category, brand, price, rating) driven by
// URL query params. On small screens the sidebar collapses into a "Filters" button
// that opens the filters in a bottom drawer.
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiChevronDown, FiChevronUp, FiSliders, FiX } from "react-icons/fi";
import { useShopProducts, useShopCategories, useShopBrands } from "../hooks/useShop";
import ProductCard from "../components/ProductCard";

// A collapsible filter group with a chevron header.
function FilterGroup({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sf-fgroup">
      <button className="sf-fgroup__head" onClick={() => setOpen((v) => !v)}>
        <span>{title}</span>
        {open ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      {open && <div className="sf-fgroup__body">{children}</div>}
    </div>
  );
}

// A single checkbox-style option row.
function CheckOption({ checked, onChange, children }) {
  return (
    <label className={`sf-checkopt ${checked ? "is-checked" : ""}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="sf-checkopt__box" aria-hidden="true" />
      <span className="sf-checkopt__label">{children}</span>
    </label>
  );
}

export function ShopPage() {
  const [params, setParams] = useSearchParams();
  const { data: categories = [] } = useShopCategories();
  const { data: brands = [] } = useShopBrands();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const query = {
    q: params.get("q") || undefined,
    category: params.get("category") || undefined,
    brand: params.get("brand") || undefined,
    minPrice: params.get("minPrice") || undefined,
    maxPrice: params.get("maxPrice") || undefined,
    minRating: params.get("minRating") || undefined,
    sort: params.get("sort") || "newest",
    limit: 24,
  };

  const { data, isLoading, isError } = useShopProducts(query);
  const items = data?.items || [];
  const activeFilters = ["category", "brand", "minPrice", "maxPrice", "minRating"].filter((k) => params.get(k)).length;

  function setParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }
  // Toggle a single-select param (click same value again to clear).
  function toggleParam(key, value) {
    setParam(key, query[key] === value ? "" : value);
  }

  const PRICE_BANDS = [
    { label: "Under ₹15,000", min: "", max: "15000" },
    { label: "₹15,000 – ₹30,000", min: "15000", max: "30000" },
    { label: "₹30,000 – ₹60,000", min: "30000", max: "60000" },
    { label: "Over ₹60,000", min: "60000", max: "" },
  ];
  function setBand(band) {
    const next = new URLSearchParams(params);
    band.min ? next.set("minPrice", band.min) : next.delete("minPrice");
    band.max ? next.set("maxPrice", band.max) : next.delete("maxPrice");
    setParams(next);
  }
  const bandActive = (b) => (query.minPrice || "") === b.min && (query.maxPrice || "") === b.max;

  // Shared filter content (used by both the desktop sidebar and mobile drawer).
  const filterContent = (
    <>
      <FilterGroup title="Category">
        {categories.filter((c) => !c.parent).map((c) => (
          <CheckOption
            key={c._id}
            checked={query.category === c._id}
            onChange={() => toggleParam("category", c._id)}
          >
            {c.name}
          </CheckOption>
        ))}
      </FilterGroup>

      <FilterGroup title="Brand">
        {brands.map((b) => (
          <CheckOption
            key={b._id}
            checked={query.brand === b._id}
            onChange={() => toggleParam("brand", b._id)}
          >
            {b.name}
          </CheckOption>
        ))}
      </FilterGroup>

      <FilterGroup title="Price">
        {PRICE_BANDS.map((b) => (
          <CheckOption key={b.label} checked={bandActive(b)} onChange={() => setBand(bandActive(b) ? { min: "", max: "" } : b)}>
            {b.label}
          </CheckOption>
        ))}
        <div className="sf-fprice">
          <input type="number" placeholder="Min" value={query.minPrice || ""} onChange={(e) => setParam("minPrice", e.target.value)} />
          <span>to</span>
          <input type="number" placeholder="Max" value={query.maxPrice || ""} onChange={(e) => setParam("maxPrice", e.target.value)} />
        </div>
      </FilterGroup>

      <FilterGroup title="Customer Ratings">
        {[4, 3, 2].map((r) => (
          <CheckOption key={r} checked={query.minRating === String(r)} onChange={() => toggleParam("minRating", String(r))}>
            <span className="sf-frating__stars">{"★".repeat(r)}</span> &amp; above
          </CheckOption>
        ))}
      </FilterGroup>
    </>
  );

  return (
    <div className="sf-shop">
      {/* Desktop sidebar */}
      <aside className="sf-filters">
        <div className="sf-filters__head">
          <h3>Filters</h3>
          {activeFilters > 0 && (
            <button className="sf-filters__clear" onClick={() => setParams(new URLSearchParams())}>
              Clear all
            </button>
          )}
        </div>
        {filterContent}
      </aside>

      <div>
        <div className="sf-shop__topbar">
          <span className="sf-shop__count">
            {query.q ? `Results for "${query.q}" · ` : ""}
            <strong>{data?.total ?? 0}</strong> products
          </span>
          <div className="sf-shop__topright">
            {/* Mobile filter button */}
            <button className="sf-shop__filterbtn" onClick={() => setDrawerOpen(true)}>
              <FiSliders /> Filters{activeFilters > 0 ? ` (${activeFilters})` : ""}
            </button>
            <select value={query.sort} onChange={(e) => setParam("sort", e.target.value)}>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <p>Loading products...</p>
        ) : isError ? (
          <p style={{ color: "#c0392b" }}>Failed to load products.</p>
        ) : items.length === 0 ? (
          <div className="sf-empty">No products match your filters.</div>
        ) : (
          <div className="sf-grid">
            {items.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="sf-fdrawer">
          <div className="sf-fdrawer__overlay" onClick={() => setDrawerOpen(false)} />
          <div className="sf-fdrawer__panel">
            <div className="sf-fdrawer__head">
              <h3>Filters</h3>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close"><FiX /></button>
            </div>
            <div className="sf-fdrawer__body">{filterContent}</div>
            <div className="sf-fdrawer__foot">
              <button
                className="sf-fdrawer__clear"
                onClick={() => { setParams(new URLSearchParams()); }}
              >
                Clear all
              </button>
              <button className="sf-btn sf-btn--dark sf-fdrawer__apply" onClick={() => setDrawerOpen(false)}>
                Show {data?.total ?? 0} products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShopPage;
