// Live search box with a suggestions dropdown. Typing shows matching products
// (thumbnail + name + brand + price); clicking one opens its product page.
// Matching happens server-side against product name/model/code plus brand and
// category names, so "wash" or "toshiba" both work.
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX } from "react-icons/fi";
import { useProductSearch } from "../hooks/useShop";
import { imageUrl, formatINR, displayPrice } from "../utils";

export default function SearchSuggestions() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  // Debounce so we don't fire a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  // Only queries once there's a term (the hook is disabled while empty).
  const { data: results = [], isFetching } = useProductSearch(debounced);

  // Close the dropdown on an outside click.
  useEffect(() => {
    function onDocClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function submit(e) {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
  }

  function pick(product) {
    setOpen(false);
    setQ("");
    navigate(`/product/${product._id}`);
  }

  const showDropdown = open && debounced.length > 0;

  return (
    <div className="sf-search" ref={boxRef}>
      <form className="sf-nav__search" onSubmit={submit} role="search">
        <FiSearch className="sf-nav__search-icon" aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search products..."
          aria-label="Search products"
          aria-expanded={showDropdown}
          aria-controls="sf-search-results"
        />
        {q && (
          <button
            type="button"
            className="sf-search__clear"
            onClick={() => {
              setQ("");
              setOpen(false);
            }}
            aria-label="Clear search"
          >
            <FiX />
          </button>
        )}
      </form>

      {showDropdown && (
        <div className="sf-search__panel" id="sf-search-results" role="listbox">
          {results.length > 0 ? (
            <>
              {results.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  className="sf-search__item"
                  onClick={() => pick(p)}
                  role="option"
                >
                  <span className="sf-search__thumb">
                    {p.images?.[0] ? (
                      <img src={imageUrl(p.images[0])} alt="" />
                    ) : (
                      <FiSearch />
                    )}
                  </span>
                  <span className="sf-search__meta">
                    <span className="sf-search__name">{p.name}</span>
                    {p.brand?.name && (
                      <span className="sf-search__brand">{p.brand.name}</span>
                    )}
                  </span>
                  <span className="sf-search__price">
                    {formatINR(displayPrice(p))}
                  </span>
                </button>
              ))}
              <button
                type="button"
                className="sf-search__all"
                onClick={() => {
                  setOpen(false);
                  navigate(`/shop?q=${encodeURIComponent(debounced)}`);
                }}
              >
                See all results for “{debounced}”
              </button>
            </>
          ) : (
            <div className="sf-search__empty">
              {isFetching ? "Searching..." : `No products match “${debounced}”`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
