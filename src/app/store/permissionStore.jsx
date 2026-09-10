// Permission context. Reads the authenticated user's permissions (and super-admin
// flag) from the auth store and exposes hasPermission() for permission-gated UI.
//
// IMPORTANT: this only controls what the UI shows. The backend independently enforces
// authorization on every request - the frontend check is convenience, not security.
import { createContext, useContext, useMemo } from "react";
import { useAuth } from "./authStore";

const PermissionContext = createContext(null);

export function PermissionProvider({ children }) {
  const { user } = useAuth();

  const value = useMemo(() => {
    const isSuperAdmin = Boolean(user?.isSuperAdmin);
    const permissionSet = new Set(user?.permissions || []);

    function hasPermission(key) {
      if (isSuperAdmin) return true;
      return permissionSet.has(key);
    }

    // True if the user has ANY of the given permission keys (used to show nav groups).
    function hasAny(keys = []) {
      if (isSuperAdmin) return true;
      return keys.some((k) => permissionSet.has(k));
    }

    return { isSuperAdmin, hasPermission, hasAny, permissions: permissionSet };
  }, [user]);

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissions() {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error("usePermissions must be used within a PermissionProvider");
  return ctx;
}

export default PermissionProvider;
