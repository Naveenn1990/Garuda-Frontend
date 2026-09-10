// Sidebar navigation, driven by the shared navigation config and gated by the
// user's permissions. An item is shown when it has no permission requirement or the
// user has that permission. A group is hidden when none of its items are visible.
import { NavLink } from "react-router-dom";
import navigation from "../../app/routes/navigation";
import { usePermissions } from "../../app/store/permissionStore";
import logo from "../../assets/logo.png";
import "./Sidebar.css";

export function Sidebar() {
  const { hasPermission } = usePermissions();

  const visibleGroups = navigation
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.permission || hasPermission(item.permission)
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <img className="sidebar__logo" src={logo} alt="Garuda International" />
      </div>
      <nav className="sidebar__nav">
        {visibleGroups.map((section) => (
          <div key={section.group} className="sidebar__section">
            <div className="sidebar__group">{section.group}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar__link ${isActive ? "active" : ""}`
                  }
                >
                  {Icon && <Icon className="sidebar__icon" aria-hidden="true" />}
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
