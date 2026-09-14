import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyPageAccess } from "@/hooks/useUserPageAccess";
import { RestrictedAccessView } from "@/components/common/RestrictedAccessView";

type AppRole = "owner" | "manager" | "cashier" | "staff" | "hr";

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: AppRole[];
};

function pathAllowed(pathname: string, allowedPaths: string[]) {
  if (!allowedPaths || !allowedPaths.length) return false;
  return allowedPaths.some((p) => {
    if (p === pathname) return true;
    if (p.includes(":")) {
      const base = p.split("/:")[0];
      return pathname === base || pathname.startsWith(`${base}/`);
    }
    return pathname.startsWith(`${p}/`) || pathname === p;
  });
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, session, loading, role, profile, shopId } = useAuth();
  const location = useLocation();
  const { data: allowedPaths = [], isLoading: accessLoading } = useMyPageAccess();

  if (loading || accessLoading || (Boolean(user) && !session)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Owners always have full access to all pages
  if (role === "owner") {
    return <>{children}</>;
  }

  // If authenticated user has no profile, no shop, and no role (account was removed from the shop)
  if (profile === null && shopId === null && role === null) {
    return <RestrictedAccessView pathname={location.pathname} moduleName="DEACTIVATED" />;
  }

  // Role-based restrictions
  if (allowedRoles && allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return <RestrictedAccessView pathname={location.pathname} />;
  }

  // Page-access checklist restrictions
  if (!pathAllowed(location.pathname, allowedPaths)) {
    return <RestrictedAccessView pathname={location.pathname} />;
  }

  return <>{children}</>;
}
