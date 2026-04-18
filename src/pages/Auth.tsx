import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/sunavio/Logo";

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, isAdmin, checkingRole } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // SEO
  useEffect(() => {
    document.title = "Connexion admin — Sunavio";
    const meta =
      document.querySelector('meta[name="description"]') ||
      document.head.appendChild(
        Object.assign(document.createElement("meta"), { name: "description" }),
      );
    (meta as HTMLMetaElement).content =
      "Espace réservé à l'équipe SUNAVIO. Connexion sécurisée.";
  }, []);

  const fromPath =
    (location.state as { from?: string } | null)?.from ?? "/admin";

  if (!loading && user && !checkingRole) {
    return <Navigate to={isAdmin ? fromPath : "/"} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "Identifiants invalides."
          : error.message,
      );
      return;
    }
    toast.success("Connexion réussie.");
    navigate(fromPath, { replace: true });
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-2xl font-semibold tracking-tight">Espace admin</h1>
          <p className="text-sm text-muted-foreground text-center">
            Réservé à l'équipe SUNAVIO.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Se connecter
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          L'inscription est désactivée. Contactez un administrateur pour obtenir un
          accès.
        </p>
      </div>
    </main>
  );
};

export default AuthPage;
