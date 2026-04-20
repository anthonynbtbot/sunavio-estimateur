import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/sunavio/Logo";
import { Footer } from "@/components/sunavio/Footer";

const FUNCTIONS_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

const Export = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const tokenLooksValid = useMemo(
    () => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token),
    [token],
  );

  const downloadExport = async () => {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/self-service-export?token=${encodeURIComponent(token)}`, {
        method: "GET",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorMsg(
          data?.error === "not_found"
            ? "Ce lien n'est plus valide ou vos données ont été supprimées."
            : "Une erreur est survenue. Merci de réessayer dans un instant.",
        );
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mes-donnees-sunavio.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus("success");
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
            Vos données personnelles
          </h1>

          {!tokenLooksValid && (
            <p className="text-muted-foreground">
              Lien invalide. Merci d'utiliser le lien personnel reçu dans votre email de
              confirmation SUNAVIO.
            </p>
          )}

          {tokenLooksValid && (
            <>
              <p className="text-foreground mb-2 leading-relaxed">
                Récupérez l'intégralité de vos données personnelles au format JSON,
                conformément à votre droit à la portabilité (art. 20 RGPD).
              </p>
              <p className="text-muted-foreground text-sm mb-8">
                Le fichier contient vos coordonnées, votre projet, votre facture, les
                analyses IA et les résultats de l'étude.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  onClick={downloadExport}
                  disabled={status === "loading"}
                  className="px-6 py-3 bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {status === "loading" ? "Préparation…" : "Télécharger mes données"}
                </button>
              </div>

              {status === "success" && (
                <p className="text-sm text-muted-foreground">
                  ✅ Téléchargement lancé. Vérifiez votre dossier de téléchargements.
                </p>
              )}
              {status === "error" && (
                <p className="text-sm text-destructive">{errorMsg}</p>
              )}

              <div className="mt-8 pt-6 border-t border-border">
                <Link
                  to={`/me/delete?token=${encodeURIComponent(token)}`}
                  className="text-sm text-muted-foreground hover:text-primary underline"
                >
                  Je souhaite aussi supprimer définitivement mes données →
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Export;