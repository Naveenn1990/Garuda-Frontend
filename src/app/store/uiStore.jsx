// Small UI-only global state (sidebar collapsed, active showroom filter, etc.).
import { createContext, useContext, useState } from "react";

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeShowroomId, setActiveShowroomId] = useState(null);

  // Global modals for quick party and item creation
  const [partyModalOpen, setPartyModalOpen] = useState(false);
  const [partyModalCallback, setPartyModalCallback] = useState(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemModalCallback, setItemModalCallback] = useState(null);

  const openPartyModal = (cb) => {
    setPartyModalCallback(() => (typeof cb === "function" ? cb : null));
    setPartyModalOpen(true);
  };
  const closePartyModal = () => {
    setPartyModalOpen(false);
    setPartyModalCallback(null);
  };

  const openItemModal = (cb) => {
    setItemModalCallback(() => (typeof cb === "function" ? cb : null));
    setItemModalOpen(true);
  };
  const closeItemModal = () => {
    setItemModalOpen(false);
    setItemModalCallback(null);
  };

  const value = {
    sidebarCollapsed,
    toggleSidebar: () => setSidebarCollapsed((v) => !v),
    activeShowroomId,
    setActiveShowroomId,

    partyModalOpen,
    openPartyModal,
    closePartyModal,
    partyModalCallback,

    itemModalOpen,
    openItemModal,
    closeItemModal,
    itemModalCallback,
  };
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within a UIProvider");
  return ctx;
}
