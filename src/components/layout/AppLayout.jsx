import { Outlet } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import Topbar from "../topbar/Topbar";
import CreatePartyModal from "../modals/CreatePartyModal";
import CreateItemModal from "../modals/CreateItemModal";
import { useUI } from "../../app/store/uiStore";
import "./AppLayout.css";

export function AppLayout() {
  const { sidebarCollapsed, partyModalOpen, itemModalOpen } = useUI();
  return (
    <div className={`app-layout ${sidebarCollapsed ? "collapsed" : ""}`}>
      <Sidebar />
      <div className="app-layout__main">
        <Topbar />
        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>

      {/* Global Modals for instant creation from Sidebar dropdown or any button */}
      <CreatePartyModal isOpen={partyModalOpen} />
      <CreateItemModal isOpen={itemModalOpen} />
    </div>
  );
}
export default AppLayout;

