import { useState, useRef } from "react";
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
    setErrorFieldId,
  } = useEstimationStore();

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptContact, setAcceptContact] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [calcDone, setCalcDone] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const personalizedReqRef = useRef<Promise<void> | null>(null);

  const filledMonthly = consumption.monthlyKwh.every((v) => v !== null && v > 0);
  const canStep1 =
    consumption.method !== null &&
    filledMonthly &&
    (consumption.method === "manual" || consumption.invoiceUrl !== null);
  const canStep2 = location.lat !== null && location.lng !== null;
  const canStep3 =
    housing.type !== null && housing.roofType !== null && (housing.roofSurface ?? 0) > 0;
  const canStep4 = true;
  const canStep5 =
    acceptTerms &&
    acceptContact &&
    contact.fullName.trim().length >= 2 &&
    contact.phone.trim().length >= 6;

  const canContinue = [canStep1, canStep2, canStep3, canStep4, canStep5][currentStep - 1];

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // 1. Submit lead via edge function wrapper (server-side IP rate limit + validation)
      const { data: rpcData, error } = await supabase.functions.invoke("submit-lead", {
        body: {
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
            invoice_photo_url: consumption.invoiceUrl,
            invoice_ai_extracted: consumption.aiExtracted ?? null,
            invoice_ai_confidence: consumption.aiConfidence ?? null,
            roof_photos_urls: photos.roofUrls,
            status: "new",
            accept_terms: acceptTerms,
            accept_contact: acceptContact,
          },
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
        if (mapping.fieldId) {
          setErrorFieldId(mapping.fieldId);
          setTimeout(() => {
            const el = document.getElementById(mapping.fieldId!);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              if (typeof (el as HTMLElement).focus === "function") {
                try { (el as HTMLElement).focus({ preventScroll: true }); } catch {}
              }
            }
          }, 350);
        }
        setSubmitting(false);
        return;
      }
      const newLeadId = result.id as string;
      setLeadId(newLeadId);

      // 2. Start the calculation overlay (loops until done)
      setCalculating(true);
      setCalcDone(false);

      // 3. Call dimension-installation
      const dimPayload = {
        leadId: newLeadId,
        annual_kwh: consumption.annualKwh,
        monthly_kwh: consumption.monthlyKwh.filter((v) => v != null),
        city: location.city,
        lat: location.lat,
        lng: location.lng,
        housing_type: housing.type,
        roof_type: housing.roofType,
        roof_surface: housing.roofSurface,
        has_ac: housing.hasAc,
        has_pool: housing.hasPool,
        has_ev: housing.hasEv,
        contract_type: consumption.contractType,
        subscribed_power_kva: consumption.subscribedPower,
      };

      const { data: dimData, error: dimError } = await supabase.functions.invoke(
        "dimension-installation",
        { body: dimPayload },
      );

      if (dimError || !dimData?.success) {
        console.error("dimension error", dimError, dimData);
        toast.error("Le dimensionnement a échoué. Réessayez dans un instant.");
        setCalculating(false);
        setSubmitting(false);
        return;
      }

      const r = dimData.result;
      setResults({
        recommendedKwc: r?.v1?.recommended_kwc ?? null,
        annualProduction: r?.v1?.annual_production_kwh ?? null,
        budgetMin: r?.v1?.budget_min_dh ?? null,
        budgetMax: r?.v1?.budget_max_dh ?? null,
        roiYears: r?.v1?.roi_years ?? null,
        isViable: !!r?.is_viable,
        viabilityMessage: r?.viability_message ?? null,
        v1: r?.v1 ?? null,
        v2: r?.v2 ?? null,
        technicalNotes: r?.technical_notes ?? [],
        personalizedMessage: null,
      });

      // 4. Fire-and-forget personalized message (don't await before showing result)
      personalizedReqRef.current = (async () => {
        const { data: msgData } = await supabase.functions.invoke(
          "generate-personalized-message",
          {
            body: {
              leadId: newLeadId,
              city: location.city,
              housing_type: housing.type,
              roof_type: housing.roofType,
              roof_surface: housing.roofSurface,
              annual_kwh: consumption.annualKwh,
              has_ac: housing.hasAc,
              has_pool: housing.hasPool,
              has_ev: housing.hasEv,
              is_viable: r?.is_viable,
              v1: r?.v1,
              v2: r?.v2,
            },
          },
        );
        if (msgData?.success && msgData?.message) {
          setResults({ personalizedMessage: msgData.message });
        }
      })().catch((e) => console.error("personalized message failed", e));

      // 5. Signal animation can finish; overlay completes its current cycle
      setCalcDone(true);
    } catch (err) {
      console.error(err);
      toast.error("Une erreur est survenue. Réessayez dans un instant.");
      setCalculating(false);
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
        done={calcDone}
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
        <Step5Contact
          acceptTerms={acceptTerms}
          setAcceptTerms={setAcceptTerms}
          acceptContact={acceptContact}
          setAcceptContact={setAcceptContact}
        />
      )}
    </EstimationLayout>
  );
};

export default Estimer;
