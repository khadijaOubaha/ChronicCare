import { Navigate, useLocation } from "react-router-dom";
import Spinner from "../components/ui/Spinner";
import { useAuth } from "./AuthContext";

// roles (optionnel) : liste des rôles autorisés, ex. roles={[ROLES.DOCTOR]}.
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6 text-brand-600" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
