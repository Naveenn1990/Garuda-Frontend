// The authenticated app shell: sidebar + topbar + routed content area.
import { Outlet } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import Topbar from "../topbar/Topbar";
import { useUI } from "../../app/store/uiStore";
import "./AppLayout.css";

export function AppLayout() {
  const { sidebarCollapsed } = useUI();
  return (
    <div className={`app-layout ${sidebarCollapsed ? "collapsed" : ""}`}>
      <Sidebar />
      <div className="app-layout__main">
        <Topbar />
        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
export default AppLayout;
