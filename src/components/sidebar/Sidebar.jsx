// Sidebar navigation, driven by the shared navigation config and gated by the
// user's permissions. An item is shown when it has no permission requirement or the
// user has that permission. A group is hidden when none of its items are visible.
import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FiChevronRight, FiChevronDown, FiPlus } from "react-icons/fi";
import navigation from "../../app/routes/navigation";
import { usePermissions } from "../../app/store/permissionStore";
import { useUI } from "../../app/store/uiStore";
import { useCompany } from "../../app/store/companyStore";
import logo from "../../assets/logo.png";
import "./Sidebar.css";

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const { openPartyModal, openItemModal } = useUI();
  const { company } = useCompany();

  const [openDropdown, setOpenDropdown] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    Parties: false,
    Items: false,
    Sales: false,
    Purchases: false,
  });

  function toggleSection(label) {
    setExpandedSections((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  }

  const visibleGroups = navigation
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.permission || hasPermission(item.permission)
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className="mybillbook-sidebar">
      {/* 1. Business Header & Logo */}
      <div
        className="mybillbook-brand"
        onClick={() => navigate("/settings")}
        style={{ cursor: "pointer" }}
        title="Click to Manage Business & Upload Logo"
      >
        <div className="mybillbook-brand__logo-wrap">
          {/* Static Garuda logo in the sidebar (invoice/settings still use the dynamic one). */}
          <img
            className="mybillbook-brand__logo"
            src={logo}
            alt="Garuda"
          />
        </div>
        <div className="mybillbook-brand__info">
          <div className="mybillbook-brand__name" title={company.businessName}>
            {company.businessName || "Garuda"}
          </div>
          {company.phone && (
            <div className="mybillbook-brand__phone">{company.phone}</div>
          )}
        </div>
      </div>

      {/* 2. Top '+ Create Sales Invoice' Action Button with Quick Dropdown */}
      <div className="mybillbook-action-wrap">
        <div className="mybillbook-action-btn-group">
          <button
            type="button"
            className="mybillbook-create-btn"
            onClick={() => navigate("/orders/create")}
          >
            <FiPlus className="mybillbook-create-btn__icon" />
            <span>Create Sales Invoice</span>
          </button>
          <button
            type="button"
            className="mybillbook-create-btn__arrow"
            onClick={() => setOpenDropdown(!openDropdown)}
            title="More billing shortcuts"
          >
            <FiChevronDown />
          </button>
        </div>

        {openDropdown && (
          <div className="mybillbook-dropdown-menu">
            <button
              type="button"
              onClick={() => { setOpenDropdown(false); openPartyModal(); }}
              style={{ fontWeight: 700, color: "#8a6016" }}
            >
              👥 + Create Party (Customer / Supplier)
            </button>
            <button
              type="button"
              onClick={() => { setOpenDropdown(false); openItemModal(); }}
              style={{ fontWeight: 700, color: "#8a6016" }}
            >
              📦 + Create Item (Product / Service)
            </button>
            <hr style={{ border: "none", borderTop: "1px solid #ede6d6", margin: "4px 0" }} />
            <button
              type="button"
              onClick={() => { navigate("/orders/create"); setOpenDropdown(false); }}
            >
              📄 Sales Invoice (Tax Invoice)
            </button>
            <button
              type="button"
              onClick={() => { navigate("/quotations/create"); setOpenDropdown(false); }}
            >
              📝 Quotation / Estimate
            </button>
            <button
              type="button"
              onClick={() => { navigate("/payments"); setOpenDropdown(false); }}
            >
              💳 Payment In (Collection)
            </button>
            <button
              type="button"
              onClick={() => { navigate("/deliveries"); setOpenDropdown(false); }}
            >
              🚚 Delivery Challan
            </button>
            <button
              type="button"
              onClick={() => { navigate("/orders/create"); setOpenDropdown(false); }}
            >
              🛒 POS Fast Billing
            </button>
          </div>
        )}
      </div>

      {/* 3. Navigation Links */}
      <nav className="mybillbook-nav">
        {visibleGroups.map((section) => (
          <div key={section.group} className="mybillbook-section">
            <div className="mybillbook-section__title">{section.group}</div>
            <div className="mybillbook-section__items">
              {section.items.map((item) => {
                const Icon = item.icon;
                const hasSub = Array.isArray(item.subItems) && item.subItems.length > 0;
                const isExpanded = expandedSections[item.label];
                const isParentActive =
                  item.path &&
                  (location.pathname === item.path ||
                    (hasSub && item.subItems.some((s) => location.pathname.startsWith(s.path))));

                // Handle direct modal actions (Create Party, Create Item)
                if (item.action === "partyModal") {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className="mybillbook-link mybillbook-link--action"
                      onClick={() => openPartyModal()}
                    >
                      <div className="mybillbook-link__left">
                        {Icon && <Icon className="mybillbook-icon mybillbook-icon--action" />}
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                }

                if (item.action === "itemModal") {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className="mybillbook-link mybillbook-link--action"
                      onClick={() => openItemModal()}
                    >
                      <div className="mybillbook-link__left">
                        {Icon && <Icon className="mybillbook-icon mybillbook-icon--action" />}
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                }

                if (hasSub) {
                  return (
                    <div key={item.label} className="mybillbook-nav-group">
                      <div
                        className={`mybillbook-link ${isParentActive ? "active" : ""}`}
                        onClick={() => toggleSection(item.label)}
                      >
                        <div className="mybillbook-link__left">
                          {Icon && <Icon className="mybillbook-icon" />}
                          <span>{item.label}</span>
                        </div>
                        {isExpanded ? (
                          <FiChevronDown className="mybillbook-chevron" />
                        ) : (
                          <FiChevronRight className="mybillbook-chevron" />
                        )}
                      </div>

                      {isExpanded && (
                        <div className="mybillbook-submenu">
                          {item.subItems.map((sub) => (
                            <NavLink
                              key={sub.label}
                              to={sub.path}
                              className={({ isActive }) =>
                                `mybillbook-submenu__link ${isActive ? "active" : ""}`
                              }
                            >
                              <span>{sub.label}</span>
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.path || item.label}
                    to={item.path}
                    className={({ isActive }) =>
                      `mybillbook-link ${isActive ? "active" : ""}`
                    }
                  >
                    <div className="mybillbook-link__left">
                      {Icon && <Icon className="mybillbook-icon" />}
                      <span>{item.label}</span>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
