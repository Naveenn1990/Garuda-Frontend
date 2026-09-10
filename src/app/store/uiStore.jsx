// Small UI-only global state (sidebar collapsed, active showroom filter, etc.).
import { createContext, useContext, useState } from "react";

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeShowroomId, setActiveShowroomId] = useState(null);

  const value = {
    sidebarCollapsed,
    toggleSidebar: () => setSidebarCollapsed((v) => !v),
    activeShowroomId,
    setActiveShowroomId,
  };
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within a UIProvider");
  return ctx;
}
