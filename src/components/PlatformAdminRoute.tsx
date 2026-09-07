import { ReactNode } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { Loader2, ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsPlatformAdmin } from "@/hooks/usePlatformAdmin";
import { Button } from "@/components/ui/button";

export function PlatformAdminRoute({ children }: { children: ReactNode }) {
  const { user, session, loading: authLoading } = useAuth();
  const location = useLocation();
  const { data: isAdmin, isLoading: adminLoading } = useIsPlatformAdmin();

  if (authLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <div className="rounded-full bg-rose-500/10 p-4 text-rose-500 mb-4">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Access Restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          This section is strictly reserved for WiseCash platform administrators. Your account does not have platform administrative privileges.
        </p>
        <Button asChild className="mt-6 gap-2" variant="outline">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
