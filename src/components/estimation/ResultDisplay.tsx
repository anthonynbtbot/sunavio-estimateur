import { Phone, Mail, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEstimationStore } from "@/stores/estimationStore";
import { SunavioCard } from "@/components/sunavio/SunavioCard";
import { Button } from "@/components/ui/button";

const formatNumber = (n: number) =>
  n.toLocaleString("fr-FR").replace(/,/g, " ");

export const ResultDisplay = () => {
  const navigate = useNavigate();
  const { results, consumption, leadId } = useEstimationStore();
  const year = new Date().getFullYear();
  const ref = leadId
    ? `SUN-${year}-WEB-${leadId.slice(0, 6).toUpperCase()}`
    : `SUN-${year}-WEB`;

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
            Au vu de votre consommation actuelle (
            <span className="text-primary">
              {consumption.annualKwh?.toLocaleString("fr-FR")} kWh/an
            </span>
            ), une installation solaire ne serait pas rentable pour vous aujourd'hui.
            Nous préférons vous le dire plutôt que vous vendre un projet qui ne vous
            servirait pas.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Notre recommandation : revenez nous voir lorsque votre consommation aura
            augmenté (ajout climatisation, piscine, véhicule électrique…). Nous restons
            à votre disposition pour en discuter.
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
        <Button variant="goldGhost" onClick={() => navigate("/")}>
          Retour à l'accueil
        </Button>
      </div>
    );
  }

  const panels = Math.ceil((results.recommendedKwc ?? 0) * 1000 / 630);

  return (
    <div className="container max-w-3xl py-10 md:py-16 pb-32">
      <div className="mb-10">
        <p className="text-xs text-primary uppercase tracking-widest mb-2">
          Votre étude personnalisée
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-foreground">
          Voici ce que nous recommandons.
        </h1>
        <span className="gold-rule mt-4" />
      </div>

      {/* Recap card */}
      <SunavioCard
        withGoldCorners
        className="mb-6 bg-secondary"
      >
        <h2 className="font-display text-xl md:text-2xl text-foreground mb-6">
          Votre installation recommandée
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <Kpi value={`${results.recommendedKwc} kWc`} label="Puissance recommandée" />
          <Kpi
            value={`${formatNumber(results.annualProduction ?? 0)} kWh/an`}
            label="Production estimée"
          />
          <Kpi
            value={`${panels} panneaux`}
            label="Jinko Tiger Neo 630W"
          />
        </div>
      </SunavioCard>

      {/* Budget */}
      <SunavioCard className="mb-6">
        <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">
          Votre investissement
        </h2>
        <p className="font-display text-2xl md:text-3xl text-primary mb-3">
          De {formatNumber(results.budgetMin ?? 0)} à{" "}
          {formatNumber(results.budgetMax ?? 0)} DH HT
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
          ~{results.roiYears} ans
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Vos panneaux s'autofinancent, puis vous produisent de l'énergie gratuite
          pendant 20+ ans supplémentaires.
        </p>
      </SunavioCard>

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

      {/* Contact */}
      <SunavioCard className="mb-8 text-center">
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
