import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export const ProtectedAdmin = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin, checkingRole } = useAuth();
  const location = useLocation();

  if (loading || (user && checkingRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold">Accès refusé</h1>
          <p className="text-muted-foreground">
            Ce compte n'a pas les droits administrateur.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
