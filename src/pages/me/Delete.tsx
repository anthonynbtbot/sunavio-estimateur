import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Logo } from "@/components/sunavio/Logo";
import { Footer } from "@/components/sunavio/Footer";

const FUNCTIONS_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

const Delete = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const tokenLooksValid = useMemo(
    () => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token),
    [token],
  );

  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(() => navigate("/", { replace: true }), 5000);
    return () => clearTimeout(t);
  }, [status, navigate]);

  const confirmDelete = async () => {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/self-service-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(
          data?.error === "not_found"
            ? "Ce lien n'est plus valide ou vos données ont déjà été supprimées."
            : "Une erreur est survenue. Merci de réessayer dans un instant.",
        );
      }
    } catch {
      setStatus("error");
      setErrorMsg("Impossible de joindre le serveur. Vérifiez votre connexion.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="px-6 py-6 border-b border-border">
        <Link to="/" aria-label="Retour à l'accueil">
          <Logo />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl bg-card border border-border p-8 md:p-10">
          <h1 className="font-serif text-3xl text-primary mb-4">
            Suppression de vos données
          </h1>

          {!tokenLooksValid && (
            <p className="text-muted-foreground">
              Lien invalide. Merci d'utiliser le lien personnel reçu dans votre email de
              confirmation SUNAVIO.
            </p>
          )}

          {tokenLooksValid && status === "idle" && (
            <>
              <p className="text-foreground mb-4 leading-relaxed">
                Vous êtes sur le point de supprimer définitivement toutes les données
                liées à votre estimation SUNAVIO : coordonnées, facture, photos de toiture
                et résultats d'étude.
              </p>
              <p className="text-muted-foreground text-sm mb-8">
                <strong className="text-foreground">Cette action est irréversible.</strong>{" "}
                Vos fichiers seront supprimés de nos serveurs immédiatement.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={confirmDelete}
                  className="px-6 py-3 bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition"
                >
                  Je confirme la suppression
                </button>
                <Link
                  to="/"
                  className="px-6 py-3 border border-border text-foreground hover:bg-muted transition text-center"
                >
                  Annuler
                </Link>
              </div>
            </>
          )}

          {status === "loading" && (
            <p className="text-muted-foreground">Suppression en cours…</p>
          )}

          {status === "success" && (
            <div>
              <p className="text-foreground mb-2">
                ✅ Vos données ont été supprimées avec succès.
              </p>
              <p className="text-muted-foreground text-sm">
                Merci d'avoir testé SUNAVIO. Redirection automatique vers l'accueil…
              </p>
            </div>
          )}

          {status === "error" && (
            <div>
              <p className="text-destructive mb-4">{errorMsg}</p>
              <Link to="/" className="text-primary hover:underline">
                Retour à l'accueil
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Delete;