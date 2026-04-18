import { Home, Maximize2, Snowflake, Waves, Zap } from "lucide-react";
import { useEstimationStore, HousingType, RoofType } from "@/stores/estimationStore";
import { StepIntro } from "./EstimationLayout";
import { cn } from "@/lib/utils";

const HOUSING: { value: HousingType; label: string }[] = [
  { value: "villa", label: "Villa" },
  { value: "maison", label: "Maison" },
  { value: "appartement", label: "Appartement" },
  { value: "autre", label: "Autre" },
];

const ROOFS: { value: RoofType; label: string }[] = [
  { value: "terrasse", label: "Terrasse plate" },
  { value: "tuile", label: "Toit en tuiles" },
  { value: "tole", label: "Toit en tôle" },
  { value: "autre", label: "Autre" },
];

const SURFACE_PRESETS = [
  { label: "Petit", value: 40 },
  { label: "Moyen", value: 80 },
  { label: "Grand", value: 150 },
];

export const Step3Housing = () => {
  const { housing, setHousing } = useEstimationStore();

  return (
    <>
      <StepIntro
        title="Parlons de votre habitation."
        subtitle="Ces informations nous aident à recommander le bon type d'installation — toiture plate ou inclinée, besoin en stockage, etc."
      />

      <div className="space-y-10">
        {/* Q1 */}
        <div id="housing-type">
          <div className="flex items-center gap-2 mb-4">
            <Home className="size-5 text-primary" />
            <h3 className="font-display text-lg text-foreground">Type de logement</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {HOUSING.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setHousing({ type: opt.value })}
                className={cn(
                  "px-4 py-4 text-sm border transition-all",
                  housing.type === opt.value
                    ? "border-primary bg-secondary text-foreground border-2"
                    : "border-border bg-card text-muted-foreground hover:border-primary/60",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Q2 */}
        <div id="roof-type">
          <div className="flex items-center gap-2 mb-4">
            <Home className="size-5 text-primary" />
            <h3 className="font-display text-lg text-foreground">Type de toit</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ROOFS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setHousing({ roofType: opt.value })}
                className={cn(
                  "px-4 py-4 text-sm border transition-all",
                  housing.roofType === opt.value
                    ? "border-primary bg-secondary text-foreground border-2"
                    : "border-border bg-card text-muted-foreground hover:border-primary/60",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Q3 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Maximize2 className="size-5 text-primary" />
            <h3 className="font-display text-lg text-foreground">
              Surface approximative du toit
            </h3>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <input
              type="range"
              min={20}
              max={500}
              step={10}
              value={housing.roofSurface ?? 80}
              onChange={(e) => setHousing({ roofSurface: Number(e.target.value) })}
              className="flex-1 accent-primary"
            />
            <span className="font-display text-2xl text-primary min-w-[100px] text-right">
              {housing.roofSurface} m²
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SURFACE_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setHousing({ roofSurface: p.value })}
                className="px-3 py-1.5 text-xs border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {p.label} ({p.value} m²)
              </button>
            ))}
          </div>
        </div>

        {/* Q4 */}
        <div>
          <h3 className="font-display text-lg text-foreground mb-4">Équipements</h3>
          <div className="space-y-2">
            <ToggleRow
              icon={<Snowflake className="size-5 text-primary" />}
              label="Climatisation"
              checked={housing.hasAc}
              onChange={(v) => setHousing({ hasAc: v })}
            />
            <ToggleRow
              icon={<Waves className="size-5 text-primary" />}
              label="Piscine"
              checked={housing.hasPool}
              onChange={(v) => setHousing({ hasPool: v })}
            />
            <ToggleRow
              icon={<Zap className="size-5 text-primary" />}
              label="Véhicule électrique (actuel ou prévu)"
              checked={housing.hasEv}
              onChange={(v) => setHousing({ hasEv: v })}
            />
          </div>
        </div>
      </div>
    </>
  );
};

const ToggleRow = ({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="w-full flex items-center justify-between bg-card border border-border px-4 py-4 hover:border-primary/60 transition-colors"
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-foreground">{label}</span>
    </div>
    <div
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors",
        checked ? "bg-primary" : "bg-border",
      )}
    >
      <div
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-background transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </div>
  </button>
);
