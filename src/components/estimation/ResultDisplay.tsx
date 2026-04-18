import { useState } from "react";
import { Phone, Mail, MessageCircle, Battery } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEstimationStore } from "@/stores/estimationStore";
import { SunavioCard } from "@/components/sunavio/SunavioCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatKwc, formatKwh, formatDh, formatYears } from "@/lib/formatNumber";
import { cn } from "@/lib/utils";

type Version = "v1" | "v2";

export const ResultDisplay = () => {
  const navigate = useNavigate();
  const { results, consumption, leadId } = useEstimationStore();
  const [version, setVersion] = useState<Version>("v1");

  const year = new Date().getFullYear();
  const ref = leadId
    ? `SUN-${year}-WEB-${leadId.slice(0, 6).toUpperCase()}`
    : `SUN-${year}-WEB`;

  // Non-viable case
  if (!results.isViable) {
    return (
      <div className="container max-w-2xl py-10 md:py-16 pb-32">
        <div className="mb-10">
          <h1 className="font-display text-3xl md:text-4xl text-foreground">
            Votre étude est prête.
          </h1>
          <span className="gold-rule mt-4" />
        </div>
        <SunavioCard withGoldCorners className="mb-6">
          <h2 className="font-display text-2xl text-primary mb-4">
            Notre avis sincère
          </h2>
          <p className="text-foreground leading-relaxed mb-4">
            {results.viabilityMessage ??
              `Au vu de votre consommation actuelle (${formatKwh(
                consumption.annualKwh ?? 0,
              )}/an), une installation solaire ne serait pas rentable pour vous aujourd'hui. Nous préférons vous le dire plutôt que vous vendre un projet qui ne vous servirait pas.`}
          </p>
          <Button asChild variant="goldOutline" size="lg">
            <a
              href="https://wa.me/212663284400"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-4" />
              Contacter un ingénieur quand même
            </a>
          </Button>
        </SunavioCard>
        <PersonalizedMessageCard message={results.personalizedMessage} />
        <div className="mt-6">
          <Button variant="goldGhost" onClick={() => navigate("/")}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  // Pick V1 or V2 data
  const v1 = results.v1;
  const v2 = results.v2;
  const active = version === "v1" ? v1 : v2;
  const kwc = active?.recommended_kwc ?? results.recommendedKwc ?? 0;
  const annualProd = active?.annual_production_kwh ?? results.annualProduction ?? 0;
  const budgetMin = active?.budget_min_dh ?? results.budgetMin ?? 0;
  const budgetMax = active?.budget_max_dh ?? results.budgetMax ?? 0;
  const roi = active?.roi_years ?? results.roiYears ?? 0;
  const panels = active?.nb_panels ?? Math.ceil((kwc * 1000) / 630);

  return (
    <div className="container max-w-3xl py-10 md:py-16 pb-32">
      <div className="mb-8">
        <p className="text-xs text-primary uppercase tracking-widest mb-2">
          Votre étude personnalisée
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-foreground">
          Voici ce que nous recommandons.
        </h1>
        <span className="gold-rule mt-4" />
      </div>

      {/* Toggle V1 / V2 */}
      {v2 && (
        <div className="sticky top-0 z-20 -mx-4 md:mx-0 mb-6 bg-background/95 backdrop-blur-sm py-3">
          <div className="grid grid-cols-2 gap-2 px-4 md:px-0">
            <VersionTab
              active={version === "v1"}
              onClick={() => setVersion("v1")}
              title="Essentielle"
              subtitle="Sans stockage"
            />
            <VersionTab
              active={version === "v2"}
              onClick={() => setVersion("v2")}
              title="Premium"
              subtitle="Autonomie + résilience"
            />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={version}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
        >
          {/* Recap */}
          <SunavioCard withGoldCorners className="mb-6 bg-secondary">
            <h2 className="font-display text-xl md:text-2xl text-foreground mb-6">
              Votre installation recommandée
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <Kpi value={formatKwc(kwc)} label="Puissance recommandée" />
              <Kpi
                value={`${formatKwh(annualProd)}/an`}
                label="Production estimée"
              />
              <Kpi
                value={`${formatNumber(panels)} panneaux`}
                label="Jinko Tiger Neo 630W"
              />
            </div>
          </SunavioCard>

          {/* V2 only — Autonomie card */}
          {version === "v2" && v2 && (
            <SunavioCard
              withGoldCorners
              className="mb-6"
              style={{ background: "hsl(28 50% 14%)" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Battery className="size-5 text-primary" />
                <h2 className="font-display text-xl md:text-2xl text-foreground">
                  Autonomie énergétique & résilience
                </h2>
              </div>
              <ul className="space-y-3 mb-4">
                {[
                  "Votre énergie disponible jour et nuit, même sans soleil.",
                  "Continuité d'alimentation en cas de coupure ONEE (fonctions essentielles).",
                  "Protection contre la hausse des tarifs électriques à long terme.",
                ].map((t, i) => (
                  <li key={i} className="flex gap-3 text-foreground">
                    <span className="text-primary mt-1.5 shrink-0">—</span>
                    <span className="leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                Capacité de stockage recommandée :{" "}
                <span className="text-primary">
                  {v2.battery_capacity_kwh} kWh ({v2.nb_battery_modules} modules WeCo 5K3 EVO)
                </span>
              </p>
            </SunavioCard>
          )}

          {/* Budget */}
          <SunavioCard className="mb-6">
            <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">
              Votre investissement
            </h2>
            <p className="font-display text-2xl md:text-3xl text-primary mb-3">
              De {formatDh(budgetMin)} à {formatDh(budgetMax)} HT
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Prix indicatif incluant équipements premium, installation, monitoring,
              garanties. Devis ferme après visite technique gratuite.
            </p>
          </SunavioCard>

          {/* ROI */}
          <SunavioCard className="mb-6">
            <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">
              Votre rentabilité
            </h2>
            <p className="font-display text-3xl md:text-4xl text-primary mb-3">
              ~{formatYears(roi)}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {version === "v2"
                ? "L'autonomie et la résilience batterie ajoutent de la valeur au-delà du strict ROI financier."
                : "Vos panneaux s'autofinancent, puis vous produisent de l'énergie gratuite pendant 20+ ans supplémentaires."}
            </p>
          </SunavioCard>
        </motion.div>
      </AnimatePresence>

      {/* Next steps */}
      <SunavioCard className="mb-6">
        <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">
          Ce qui vous attend maintenant
        </h2>
        <ul className="space-y-3">
          {[
            "Un ingénieur SUNAVIO vous contactera sous 24h ouvrées pour planifier une visite technique gratuite de votre site.",
            "À l'issue de la visite, vous recevrez une étude détaillée personnalisée (dossier technique + plan 3D + devis ferme).",
            "Sans engagement à chaque étape : vous décidez à votre rythme.",
          ].map((t, i) => (
            <li key={i} className="flex gap-3 text-foreground">
              <span className="text-primary mt-1.5 shrink-0">—</span>
              <span className="leading-relaxed">{t}</span>
            </li>
          ))}
        </ul>
      </SunavioCard>

      {/* Personalized engineer message */}
      <PersonalizedMessageCard message={results.personalizedMessage} />

      {/* Contact */}
      <SunavioCard className="mb-8 mt-6 text-center">
        <p className="text-xs text-primary uppercase tracking-widest mb-4">
          Votre contact direct
        </p>
        <div className="space-y-2 text-foreground">
          <p className="flex items-center justify-center gap-2">
            <Phone className="size-4 text-primary" />
            +212 06 63 28 44 — Anthony NEBOUT, Co-fondateur
          </p>
          <p className="flex items-center justify-center gap-2 text-sm">
            <Mail className="size-4 text-primary" />
            sunavio.contact@gmail.com
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-6">
          Votre référence dossier :{" "}
          <span className="text-primary font-mono">{ref}</span>
        </p>
      </SunavioCard>

      <div className="text-center">
        <Button variant="goldGhost" onClick={() => navigate("/")}>
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
};

const VersionTab = ({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "rounded-md px-4 py-3 text-left transition-all border-2",
      active
        ? "border-primary text-primary"
        : "border-border text-muted-foreground hover:border-primary/40",
    )}
    style={active ? { background: "hsl(28 50% 14%)" } : { background: "hsl(var(--secondary))" }}
  >
    <p className="font-display text-base md:text-lg uppercase tracking-wide">{title}</p>
    <p className="text-xs opacity-80 mt-0.5">{subtitle}</p>
  </button>
);

const Kpi = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center sm:text-left">
    <p className="font-display text-2xl md:text-3xl text-primary leading-tight">
      {value}
    </p>
    <p className="text-xs text-muted-foreground uppercase tracking-wide mt-2">
      {label}
    </p>
  </div>
);

const PersonalizedMessageCard = ({ message }: { message: string | null }) => (
  <div className="relative mb-6 rounded-lg border border-primary/30 bg-card p-6 md:p-8 pl-8 md:pl-10">
    <div className="absolute left-0 top-4 bottom-4 w-[3px] bg-primary rounded-full" />
    <p className="text-[10px] uppercase tracking-[0.2em] text-primary/80 mb-4 font-sans">
      Mot de l'ingénieur
    </p>
    {message ? (
      <p className="font-display italic text-lg leading-relaxed text-foreground">
        {message}
      </p>
    ) : (
      <div className="space-y-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-5 w-3/4" />
      </div>
    )}
    <p className="text-sm text-muted-foreground mt-6 text-right">
      Anthony NEBOUT · Co-fondateur SUNAVIO
    </p>
  </div>
);
