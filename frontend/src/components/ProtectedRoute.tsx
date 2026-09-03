import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/types";

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
