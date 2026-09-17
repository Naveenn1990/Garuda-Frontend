// Public storefront shell: header (logo, search, nav, wishlist, cart) + footer.
// Wraps all storefront routes and provides the cart/wishlist store.
import { useState, useEffect } from "react";
import { NavLink, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiShoppingBag, FiMapPin, FiMail, FiShoppingCart, FiHeart, FiUser, FiLogOut, FiInfo, FiPhone, FiMenu, FiX, FiArrowLeft, FiFacebook, FiInstagram, FiTwitter, FiYoutube } from "react-icons/fi";
import { StoreProvider, useStore } from "../store/StoreProvider";
import { CustomerAuthProvider, useCustomerAuth } from "../store/CustomerAuthProvider";
import SearchSuggestions from "./SearchSuggestions";
import logo from "../../../assets/logo.png";
import "./storefront.css";

const NAV_LINKS = [
  { to: "/", label: "Home", icon: FiHome, end: true },
  { to: "/shop", label: "Shop", icon: FiShoppingBag },
  { to: "/stores", label: "Stores", icon: FiMapPin },
  { to: "/enquiry", label: "Enquiry", icon: FiMail },
  { to: "/about", label: "About Us", icon: FiInfo },
  { to: "/contact", label: "Contact Us", icon: FiPhone },
];

function Header() {
  const navigate = useNavigate();
  const { cartCount, wishlistCount } = useStore();
  const { isLoggedIn, customer, logout } = useCustomerAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sf-header">
      <nav className="sf-nav">
        <Link to="/" className="sf-nav__brand" onClick={closeMenu}>
          <img src={logo} alt="Garuda International" />
        </Link>

        <SearchSuggestions />

        {/* Desktop links */}
        <div className="sf-nav__links">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="sf-nav__link">
              <l.icon aria-hidden="true" /> {l.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop right actions */}
        <div className="sf-nav__right">
          {isLoggedIn ? (
            <span className="sf-nav__user">
              <Link to="/account" className="sf-nav__userlink" title="My Account">
                <FiUser />
                <span className="sf-nav__username">Profile</span>
              </Link>
              <button
                className="sf-nav__logout"
                onClick={() => { logout(); navigate("/"); }}
                aria-label="Logout"
                title="Logout"
              >
                <FiLogOut />
              </button>
            </span>
          ) : (
            <Link to="/account/login" className="sf-nav__login">
              <FiUser /> Login / Register
            </Link>
          )}
          <Link to="/wishlist" className="sf-nav__wish" aria-label="Wishlist">
            <FiHeart />
            <span>Wishlist</span>
            {wishlistCount > 0 && <span className="sf-badge">{wishlistCount}</span>}
          </Link>
          <NavLink to="/cart" className="sf-nav__cart" aria-label="Cart">
            <FiShoppingCart />
            <span>Cart</span>
            {cartCount > 0 && <span className="sf-badge">{cartCount}</span>}
          </NavLink>
        </div>

        {/* Mobile: cart icon + hamburger */}
        <div className="sf-nav__mobile">
          <NavLink to="/cart" className="sf-iconbtn" aria-label="Cart">
            <FiShoppingCart />
            {cartCount > 0 && <span className="sf-badge">{cartCount}</span>}
          </NavLink>
          <button
            className="sf-nav__burger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      {menuOpen && (
        <>
          <div className="sf-mobilemenu__overlay" onClick={closeMenu} />
          <div className="sf-mobilemenu">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className="sf-mobilemenu__link" onClick={closeMenu}>
                <l.icon aria-hidden="true" /> {l.label}
              </NavLink>
            ))}
            <div className="sf-mobilemenu__divider" />
            <NavLink to="/wishlist" className="sf-mobilemenu__link" onClick={closeMenu}>
              <FiHeart aria-hidden="true" /> Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ""}
            </NavLink>
            {isLoggedIn ? (
              <>
                <NavLink to="/account" className="sf-mobilemenu__link" onClick={closeMenu}>
                  <FiUser aria-hidden="true" /> My Account
                </NavLink>
                <button
                  className="sf-mobilemenu__link sf-mobilemenu__logout"
                  onClick={() => { logout(); closeMenu(); navigate("/"); }}
                >
                  <FiLogOut aria-hidden="true" /> Logout
                </button>
              </>
            ) : (
              <NavLink to="/account/login" className="sf-mobilemenu__link" onClick={closeMenu}>
                <FiUser aria-hidden="true" /> Login / Register
              </NavLink>
            )}
          </div>
        </>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="sf-footer">
      <div className="sf-footer__inner">
        {/* Brand */}
        <div className="sf-footer__brand">
          <span className="sf-footer__logo">
            <img src={logo} alt="Garuda International" />
          </span>
          <p className="sf-footer__about">
            Quality home appliances and more, delivered from our showrooms to your home.
            Trusted brands, fair prices, reliable service.
          </p>
          <div className="sf-footer__social">
            <a href="#" aria-label="Facebook"><FiFacebook /></a>
            <a href="#" aria-label="Instagram"><FiInstagram /></a>
            <a href="#" aria-label="Twitter"><FiTwitter /></a>
            <a href="#" aria-label="YouTube"><FiYoutube /></a>
          </div>
        </div>

        {/* Explore */}
        <div className="sf-footer__col">
          <h4>Explore</h4>
          <Link to="/shop"><FiShoppingBag /> Shop</Link>
          <Link to="/stores"><FiMapPin /> Store Locator</Link>
          <Link to="/about"><FiInfo /> About Us</Link>
          <Link to="/contact"><FiPhone /> Contact Us</Link>
          <Link to="/enquiry"><FiMail /> Enquiry</Link>
        </div>

        {/* Account */}
        <div className="sf-footer__col">
          <h4>Account</h4>
          <Link to="/account"><FiUser /> My Account</Link>
          <Link to="/cart"><FiShoppingCart /> My Cart</Link>
          <Link to="/wishlist"><FiHeart /> Wishlist</Link>
        </div>

        {/* Contact */}
        <div className="sf-footer__col">
          <h4>Get in Touch</h4>
          <span className="sf-footer__contact"><FiPhone /> +91 90000 00000</span>
          <span className="sf-footer__contact"><FiMail /> support@garudainternational.com</span>
          <span className="sf-footer__contact"><FiMapPin /> Bengaluru, Karnataka, India</span>
        </div>
      </div>

      <div className="sf-footer__bar">
        <span>© {new Date().getFullYear()} Garuda International. All rights reserved.</span>
        <span className="sf-footer__barlinks">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </span>
      </div>
    </footer>
  );
}

// Reusable Back button, shown on every storefront page except the home page.
// Goes back in history when possible, otherwise falls back to the home page.
function BackButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // No back button on home, shop, cart, checkout, product detail, auth, or account pages.
  if (
    pathname === "/" ||
    pathname === "/shop" ||
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname === "/account" ||
    pathname === "/account/login" ||
    pathname.startsWith("/product/")
  )
    return null;

  function goBack() {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  }
  return (
    <button className="sf-back" onClick={goBack} aria-label="Go back">
      <FiArrowLeft /> Back
    </button>
  );
}

// Scroll to top on every route change (good-website essential).
function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, search]);
  return null;
}

export function StoreLayout() {
  return (
    <CustomerAuthProvider>
      <StoreProvider>
        <ScrollToTop />
        <div className="sf-shell">
          <Header />
          <main className="sf-main">
            <BackButton />
            <Outlet />
          </main>
          <Footer />
        </div>
      </StoreProvider>
    </CustomerAuthProvider>
  );
}
export default StoreLayout;
