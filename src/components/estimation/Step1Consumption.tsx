import { useRef, useState } from "react";
import { AlertCircle, BarChart3, Camera, Check, CheckCircle2, ChevronDown, Edit3, Loader2 } from "lucide-react";
import { useEstimationStore } from "@/stores/estimationStore";
import { StepIntro } from "./EstimationLayout";
import { SunavioCard } from "@/components/sunavio/SunavioCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Step1Consumption = () => {
  const { consumption, setConsumption } = useEstimationStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  const choose = (method: "photo" | "manual") => {
    if (method === "photo") {
      fileRef.current?.click();
    } else {
      setConsumption({ method: "manual" });
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `invoices/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("lead-uploads")
        .upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("lead-uploads").getPublicUrl(path);
      setConsumption({
        method: "photo",
        invoiceFile: file,
        invoiceUrl: data.publicUrl,
        // Pre-fill defaults for typical Moroccan household
        monthlyKwh: [
          consumption.monthlyKwh[0] ?? 180,
          consumption.monthlyKwh[1] ?? 220,
          consumption.monthlyKwh[2] ?? 195,
        ],
      });
      toast.success("Photo reçue");
    } catch (err) {
      toast.error("Échec de l'upload, réessayez.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const updateMonth = (idx: 0 | 1 | 2, value: string) => {
    const num = value === "" ? null : Number(value);
    const arr = [...consumption.monthlyKwh] as typeof consumption.monthlyKwh;
    arr[idx] = num;
    const filled = arr.every((v) => v !== null && v > 0);
    const annual = filled
      ? Math.round(((arr[0]! + arr[1]! + arr[2]!) / 3) * 12)
      : null;
    setConsumption({ monthlyKwh: arr, annualKwh: annual });
  };

  const showManualForm = consumption.method !== null;
  const filled = consumption.monthlyKwh.every((v) => v !== null && v > 0);

  return (
    <>
      <StepIntro
        title="Parlons de votre consommation."
        subtitle="Votre facture ONEE nous permet de dimensionner précisément votre installation. Deux options pour la renseigner — choisissez la plus simple pour vous."
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {/* Method cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <button
          type="button"
          onClick={() => choose("photo")}
          disabled={uploading}
          className={cn(
            "relative text-left p-6 bg-card border transition-all hover:border-primary/60",
            consumption.method === "photo"
              ? "border-primary"
              : "border-border",
          )}
        >
          <div className="absolute top-3 right-3 text-[10px] uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5">
            Plus rapide
          </div>
          <Camera className="size-7 text-primary mb-3" />
          <h3 className="font-display text-xl text-foreground mb-1">
            Photographier ma facture
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Photographiez votre facture ONEE ou sélectionnez une image existante. Nous extrairons automatiquement les informations essentielles.
          </p>
        </button>

        <button
          type="button"
          onClick={() => choose("manual")}
          className={cn(
            "text-left p-6 bg-card border transition-all hover:border-primary/60",
            consumption.method === "manual"
              ? "border-primary"
              : "border-border",
          )}
        >
          <Edit3 className="size-7 text-primary mb-3" />
          <h3 className="font-display text-xl text-foreground mb-1">
            Saisir mes consommations
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Renseignez vos consommations des 3 derniers mois en kWh.
          </p>
        </button>
      </div>

      {/* Photo confirmation + AI status */}
      {consumption.method === "photo" && consumption.invoiceUrl && (
        <SunavioCard className="mb-8 p-5 flex items-start gap-4">
          <img
            src={consumption.invoiceUrl}
            alt="Facture"
            className="w-20 h-20 object-cover border border-border shrink-0"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 text-primary text-sm mb-1">
              <Check className="size-4" /> Photo reçue
            </div>

            {consumption.aiStatus === "loading" && (
              <p className="text-sm text-muted-foreground leading-relaxed flex items-center gap-2">
                <Loader2 className="size-4 text-primary animate-spin" />
                Lecture de votre facture en cours…
              </p>
            )}

            {consumption.aiStatus === "success" && consumption.aiConfidence === "high" && (
              <div className="text-sm leading-relaxed">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <CheckCircle2 className="size-4" />
                  Nous avons lu votre facture.
                </div>
                <p className="text-muted-foreground">
                  Vérifiez les valeurs ci-dessous et ajustez si nécessaire.
                </p>
              </div>
            )}

            {consumption.aiStatus === "success" &&
              (consumption.aiConfidence === "medium" || consumption.aiConfidence === "low") && (
                <div className="text-sm leading-relaxed">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <AlertCircle className="size-4" />
                    Lecture partielle de votre facture.
                  </div>
                  <p className="text-muted-foreground">
                    Certaines valeurs ne sont pas parfaitement claires. Merci de les vérifier attentivement.
                  </p>
                </div>
              )}

            {consumption.aiStatus === "failed" && (
              <div className="text-sm leading-relaxed">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <AlertCircle className="size-4" />
                  Nous n'avons pas pu lire votre facture clairement.
                </div>
                <p className="text-muted-foreground">
                  {consumption.aiExtracted?.suggestion ??
                    "Merci de saisir vos consommations ci-dessous."}
                </p>
              </div>
            )}
          </div>
        </SunavioCard>
      )}

      {uploading && (
        <p className="text-sm text-muted-foreground mb-4">Upload en cours…</p>
      )}

      {/* Manual form */}
      {showManualForm && (
        <div className="space-y-5">
          {[
            { label: "Consommation il y a 3 mois", placeholder: "180" },
            { label: "Consommation il y a 2 mois", placeholder: "220" },
            { label: "Le mois dernier", placeholder: "195" },
          ].map((field, i) => (
            <div key={i}>
              <label className="block text-sm text-muted-foreground mb-2">
                {field.label}
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={field.placeholder}
                  value={consumption.monthlyKwh[i as 0 | 1 | 2] ?? ""}
                  onChange={(e) => updateMonth(i as 0 | 1 | 2, e.target.value)}
                  className="w-full bg-card border border-border px-4 py-3 pr-14 text-foreground focus:border-primary focus:outline-none transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  kWh
                </span>
              </div>
            </div>
          ))}

          {filled && consumption.annualKwh && (
            <div className="flex items-center gap-3 bg-secondary border border-primary/40 px-4 py-3">
              <BarChart3 className="size-5 text-primary shrink-0" />
              <p className="text-sm text-foreground">
                Soit une consommation annuelle estimée à{" "}
                <span className="text-primary font-medium">
                  {consumption.annualKwh.toLocaleString("fr-FR")}
                </span>{" "}
                kWh
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors pt-2"
          >
            <ChevronDown
              className={cn("size-4 transition-transform", showOptional && "rotate-180")}
            />
            Autres informations (optionnel)
          </button>

          {showOptional && (
            <div className="space-y-4 pl-2 border-l border-border">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Type de contrat ONEE
                </label>
                <select
                  value={consumption.contractType ?? ""}
                  onChange={(e) =>
                    setConsumption({ contractType: e.target.value || null })
                  }
                  className="w-full bg-card border border-border px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">—</option>
                  <option value="residentiel_bt">Résidentiel basse tension</option>
                  <option value="tarif_social">Tarif social</option>
                  <option value="professionnel">Professionnel</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Puissance souscrite
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="9"
                    value={consumption.subscribedPower ?? ""}
                    onChange={(e) =>
                      setConsumption({
                        subscribedPower: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full bg-card border border-border px-4 py-3 pr-14 text-foreground focus:border-primary focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    kVA
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
