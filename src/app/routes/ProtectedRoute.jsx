// Guards routes that require authentication. Redirects to /login when not signed in.
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/authStore";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While bootstrapping (loading the current user from the token), show a loader so we
  // never render the layout with a half-loaded user (which would blank the sidebar).
  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  // No authenticated user -> go to login.
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

export default ProtectedRoute;
