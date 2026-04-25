import { Lock } from "lucide-react";
import { Link } from "react-router-dom";

interface PrivacyNoticeProps {
  /** Optional override for the explanatory sentence. */
  reason?: string;
}

export const PrivacyNotice = ({
  reason = "Pour générer votre étude solaire personnalisée.",
}: PrivacyNoticeProps) => (
  <div className="mb-6 rounded-md border border-border bg-card/60 px-4 py-3 flex items-start gap-3">
    <Lock className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
    <p className="text-xs text-muted-foreground leading-relaxed">
      <span className="font-medium text-foreground">
        Pourquoi nous demandons ces informations ?
      </span>{" "}
      {reason} Vos données ne sont jamais transmises à des tiers commerciaux.
      Conformité RGPD et loi marocaine 09-08.{" "}
      <Link
        to="/politique-confidentialite"
        target="_blank"
        className="text-primary underline hover:text-primary-hover"
      >
        Politique de confidentialité
      </Link>
      .
    </p>
  </div>
);