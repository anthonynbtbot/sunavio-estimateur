import { ShieldCheck } from "lucide-react";

export const TrustBanner = () => (
  <div className="mb-8 rounded-md border border-primary/40 bg-primary/5 px-4 py-3 flex items-start gap-3">
    <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" aria-hidden />
    <p className="text-xs md:text-sm text-foreground/90 leading-relaxed">
      <span className="font-medium">Société marocaine légitime</span> ·{" "}
      <span className="font-medium">SUNAVIO SARL</span> · RC 164901 Marrakech ·{" "}
      Vos données sont protégées (RGPD / CNDP loi 09-08).
    </p>
  </div>
);