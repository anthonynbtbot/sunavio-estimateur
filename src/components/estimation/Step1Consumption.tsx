import { useRef, useState } from "react";
import { AlertCircle, BarChart3, Camera, Check, CheckCircle2, ChevronDown, Edit3, FileText, Loader2 } from "lucide-react";
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
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    let files = Array.from(fileList).slice(0, 3);
    const MAX = 10 * 1024 * 1024;
    const tooBig = files.find((f) => f.size > MAX);
    if (tooBig) {
      toast.error(
        "Un fichier dépasse 10 MB. Merci de compresser le PDF ou de prendre une photo plus légère.",
      );
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (fileList.length > 3) {
      toast.info("Maximum 3 factures — seules les 3 premières seront analysées.");
    }

    setUploading(true);
    try {
      const uploaded: { file: File; path: string }[] = [];
      for (const file of files) {
        const ext =
          file.name.split(".").pop() ||
          (file.type === "application/pdf" ? "pdf" : "jpg");
        const path = `invoices/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("lead-uploads")
          .upload(path, file, {
            upsert: false,
            contentType: file.type || undefined,
          });
        if (error) throw error;
        uploaded.push({ file, path });
      }

      setConsumption({
        method: "photo",
        invoiceFile: uploaded[0].file,
        invoiceUrl: uploaded[0].path,
        invoiceFiles: uploaded.map((u) => u.file),
        invoiceUrls: uploaded.map((u) => u.path),
        aiStatus: "loading",
        aiExtracted: null,
        aiConfidence: null,
      });
      toast.success(
        uploaded.length === 1
          ? "Fichier reçu"
          : `${uploaded.length} factures reçues`,
      );
      analyzeInvoices(uploaded.map((u) => u.path));
    } catch (err) {
      toast.error("Échec de l'upload, réessayez.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const analyzeInvoices = async (paths: string[]) => {
    try {
      const { data, error } = await supabase.functions.invoke("analyze-invoice", {
        body: { imagePaths: paths },
      });
      console.log("[analyze-invoice] response:", { data, error });
      if (error) throw error;

      if (data?.success && Array.isArray(data.monthly_kwh) && data.monthly_kwh.length > 0) {
        const toNum = (v: unknown): number | null => {
          const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
          return Number.isFinite(n) && n > 0 ? n : null;
        };
        const extracted = (data.monthly_kwh as unknown[])
          .map(toNum)
          .filter((n): n is number => n !== null)
          .slice(0, 3);

        // Place extracted values left-aligned (oldest -> newest), pad with null
        const monthly: [number | null, number | null, number | null] = [
          extracted[0] ?? null,
          extracted[1] ?? null,
          extracted[2] ?? null,
        ];

        console.log("[analyze-invoice] parsed monthly:", monthly);
        const filledM = monthly.every((v) => v !== null);
        const annual = filledM
          ? Math.round(((monthly[0]! + monthly[1]! + monthly[2]!) / 3) * 12)
          : typeof data.annual_kwh === "number"
          ? data.annual_kwh
          : extracted.length > 0
          ? Math.round(
              (extracted.reduce((a, b) => a + b, 0) / extracted.length) * 12,
            )
          : null;

        if (data.contract_type || data.subscribed_power_kva) setShowOptional(true);

        setConsumption({
          monthlyKwh: monthly,
          annualKwh: annual,
          contractType: data.contract_type ?? null,
          subscribedPower:
            typeof data.subscribed_power_kva === "number"
              ? data.subscribed_power_kva
              : null,
          aiExtracted: data,
          aiConfidence: data.confidence ?? "medium",
          aiStatus: "success",
        });
      } else {
        console.warn("[analyze-invoice] no usable monthly_kwh", data);
        setConsumption({
          aiExtracted: data ?? null,
          aiConfidence: data?.confidence ?? "low",
          aiStatus: "failed",
        });
      }
    } catch (err) {
      console.error("analyze-invoice failed", err);
      setConsumption({
        aiStatus: "failed",
      });
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
        accept="image/*,application/pdf"
        multiple
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
            Ajouter mes factures (jusqu'à 3)
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Importez 1 à 3 factures ONEE (photos ou PDF). Plus vous en ajoutez, plus l'analyse est précise. Astuce : maintenez Ctrl/Cmd pour en sélectionner plusieurs d'un coup.
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

      {/* Photo / PDF confirmation + AI status */}
      {consumption.method === "photo" && consumption.invoiceUrls.length > 0 && (
        <SunavioCard className="mb-8 p-5">
          <div className="flex flex-wrap gap-3 mb-4">
            {consumption.invoiceFiles.map((file, idx) => (
              <div key={idx} className="shrink-0">
                {file.type === "application/pdf" ? (
                  <div className="w-20 h-20 bg-card border border-border flex flex-col items-center justify-center text-primary px-1">
                    <FileText className="size-7 mb-1" />
                    <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                      {file.name}
                    </span>
                  </div>
                ) : (
                  <img
                    src={consumption.invoiceUrls[idx]}
                    alt={`Facture ${idx + 1}`}
                    className="w-20 h-20 object-cover border border-border"
                  />
                )}
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center gap-2 text-primary text-sm mb-1">
              <Check className="size-4" />
              {consumption.invoiceFiles.length === 1
                ? "Fichier reçu"
                : `${consumption.invoiceFiles.length} factures reçues`}
            </div>

            {consumption.aiStatus === "loading" && (
              <p className="text-sm text-muted-foreground leading-relaxed flex items-center gap-2">
                <Loader2 className="size-4 text-primary animate-spin" />
                Lecture {consumption.invoiceFiles.length > 1 ? "de vos factures" : "de votre facture"} en cours…
              </p>
            )}

            {consumption.aiStatus === "success" && consumption.aiConfidence === "high" && (
              <div className="text-sm leading-relaxed">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <CheckCircle2 className="size-4" />
                  Nous avons lu {consumption.invoiceFiles.length > 1 ? "vos factures" : "votre facture"}.
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
                    Lecture partielle.
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
                  Nous n'avons pas pu lire {consumption.invoiceFiles.length > 1 ? "vos factures" : "votre facture"} clairement.
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
