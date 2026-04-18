import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EstimationLayout } from "@/components/estimation/EstimationLayout";
import { Step1Consumption } from "@/components/estimation/Step1Consumption";
import { Step2Location } from "@/components/estimation/Step2Location";
import { Step3Housing } from "@/components/estimation/Step3Housing";
import { Step4Photos } from "@/components/estimation/Step4Photos";
import { Step5Contact } from "@/components/estimation/Step5Contact";
import { CalculationOverlay } from "@/components/estimation/CalculationOverlay";
import { ResultDisplay } from "@/components/estimation/ResultDisplay";
import { useEstimationStore } from "@/stores/estimationStore";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMapping } from "@/lib/validationErrors";

const Estimer = () => {
  const navigate = useNavigate();
  const {
    currentStep,
    next,
    setStep,
    consumption,
    location,
    housing,
    photos,
    contact,
    setResults,
    setLeadId,
    leadId,
  } = useEstimationStore();

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filledMonthly = consumption.monthlyKwh.every((v) => v !== null && v > 0);
  const canStep1 =
    consumption.method !== null &&
    filledMonthly &&
    (consumption.method === "manual" || consumption.invoiceUrl !== null);
  const canStep2 = location.lat !== null && location.lng !== null;
  const canStep3 =
    housing.type !== null && housing.roofType !== null && (housing.roofSurface ?? 0) > 0;
  const canStep4 = photos.roofUrls.length >= 2;
  const canStep5 =
    acceptTerms &&
    contact.fullName.trim().length >= 2 &&
    contact.phone.trim().length >= 6;

  const canContinue = [canStep1, canStep2, canStep3, canStep4, canStep5][currentStep - 1];

  const computeResults = () => {
    const annual = consumption.annualKwh ?? 0;
    const irradiance = location.city === "Essaouira" ? 1750 : location.city === "Agadir" ? 1700 : 1650;
    const recommendedKwc = Math.round((annual / irradiance) * 10) / 10;
    const annualProduction = Math.round(recommendedKwc * irradiance);
    const budgetMin = Math.round(recommendedKwc * 6500);
    const budgetMax = Math.round(recommendedKwc * 7500);
    const roiYears =
      annualProduction > 0
        ? Math.round((budgetMin / (annualProduction * 1.2)) * 10) / 10
        : 0;
    const isViable = recommendedKwc >= 2;
    return {
      recommendedKwc,
      annualProduction,
      budgetMin,
      budgetMax,
      roiYears,
      isViable,
      viabilityMessage: isViable ? null : "Consommation trop faible pour rentabilité.",
    };
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const computed = computeResults();
      setResults(computed);

      const { data: rpcData, error } = await supabase.rpc("submit_lead", {
        payload: {
          full_name: contact.fullName,
          phone: `+212${contact.phone.replace(/\s/g, "")}`,
          email: contact.email || null,
          city: location.city,
          address: location.address,
          lat: location.lat,
          lng: location.lng,
          consumption_kwh_year: consumption.annualKwh,
          housing_type: housing.type,
          roof_type: housing.roofType,
          has_ac: housing.hasAc,
          has_pool: housing.hasPool,
          has_ev: housing.hasEv,
          recommended_kwc: computed.recommendedKwc,
          estimated_production_kwh: computed.annualProduction,
          estimated_budget_min: computed.budgetMin,
          estimated_budget_max: computed.budgetMax,
          estimated_roi_years: computed.roiYears,
          invoice_photo_url: consumption.invoiceUrl,
          invoice_ai_extracted: consumption.aiExtracted ?? null,
          invoice_ai_confidence: consumption.aiConfidence ?? null,
          roof_photos_urls: photos.roofUrls,
          status: "new",
        },
      });

      if (error) throw error;
      const result = rpcData as { success?: boolean; id?: string; error?: string } | null;
      if (!result?.success) {
        const code = result?.error ?? "";
        const mapping = getErrorMapping(code);
        toast.error(mapping.message, { duration: 8000 });
        if (mapping.returnToStep && mapping.returnToStep !== currentStep) {
          setStep(mapping.returnToStep);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        setSubmitting(false);
        return;
      }
      const newLeadId = result.id;
      if (newLeadId) {
        const idStr = typeof newLeadId === "string"
          ? newLeadId
          : (newLeadId as { id?: string })?.id;
        if (idStr) setLeadId(idStr);
      }

      setCalculating(true);
    } catch (err) {
      console.error(err);
      toast.error("Une erreur est survenue. Réessayez dans un instant.");
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (currentStep < 5) {
      next();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleSubmit();
    }
  };

  if (showResult) return <ResultDisplay />;

  if (calculating) {
    return (
      <CalculationOverlay
        onDone={() => {
          setCalculating(false);
          setShowResult(true);
        }}
      />
    );
  }

  return (
    <EstimationLayout
      canContinue={!!canContinue && !submitting}
      onContinue={handleContinue}
      continueLabel={currentStep === 5 ? "Obtenir mon étude →" : "Continuer"}
    >
      {currentStep === 1 && <Step1Consumption />}
      {currentStep === 2 && <Step2Location />}
      {currentStep === 3 && <Step3Housing />}
      {currentStep === 4 && <Step4Photos />}
      {currentStep === 5 && (
        <Step5Contact acceptTerms={acceptTerms} setAcceptTerms={setAcceptTerms} />
      )}
    </EstimationLayout>
  );
};

export default Estimer;
