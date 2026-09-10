// Top navigation bar: sidebar toggle, global search placeholder, and user menu.
import { useAuth } from "../../app/store/authStore";
import { useUI } from "../../app/store/uiStore";
import "./Topbar.css";

export function Topbar() {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useUI();

  return (
    <header className="topbar">
      <button className="topbar__toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
        ☰
      </button>
      <input className="topbar__search" placeholder="Search customers, products, orders..." />
      <div className="topbar__right">
        <span className="topbar__user">{user?.name || "User"}</span>
        <button className="topbar__logout" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Topbar;
