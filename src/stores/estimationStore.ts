import { create } from "zustand";

export type ConsumptionMethod = "photo" | "manual" | null;
export type HousingType = "villa" | "maison" | "appartement" | "autre" | null;
export type RoofType = "terrasse" | "tuile" | "tole" | "autre" | null;

export interface EstimationState {
  currentStep: number;
  consumption: {
    method: ConsumptionMethod;
    invoiceFile: File | null;
    invoiceUrl: string | null;
    invoiceFiles: File[];
    invoiceUrls: string[];
    monthlyKwh: [number | null, number | null, number | null];
    annualKwh: number | null;
    contractType: string | null;
    subscribedPower: number | null;
    aiExtracted: any | null;
    aiConfidence: "high" | "medium" | "low" | null;
    aiStatus: "idle" | "loading" | "success" | "failed";
  };
  location: {
    address: string;
    city: string;
    lat: number | null;
    lng: number | null;
  };
  housing: {
    type: HousingType;
    roofType: RoofType;
    roofSurface: number | null;
    hasAc: boolean;
    hasPool: boolean;
    hasEv: boolean;
  };
  photos: {
    roofFiles: File[];
    roofUrls: string[];
    meterFile: File | null;
    meterUrl: string | null;
  };
  results: {
    recommendedKwc: number | null;
    annualProduction: number | null;
    budgetMin: number | null;
    budgetMax: number | null;
    roiYears: number | null;
    isViable: boolean;
    viabilityMessage: string | null;
    v1: any | null;
    v2: any | null;
    technicalNotes: string[];
    personalizedMessage: string | null;
  };
  contact: {
    fullName: string;
    phone: string;
    email: string;
  };
  leadId: string | null;
  errorFieldId: string | null;
}

interface EstimationActions {
  setStep: (step: number) => void;
  next: () => void;
  prev: () => void;
  setConsumption: (data: Partial<EstimationState["consumption"]>) => void;
  setLocation: (data: Partial<EstimationState["location"]>) => void;
  setHousing: (data: Partial<EstimationState["housing"]>) => void;
  setPhotos: (data: Partial<EstimationState["photos"]>) => void;
  setResults: (data: Partial<EstimationState["results"]>) => void;
  setContact: (data: Partial<EstimationState["contact"]>) => void;
  setLeadId: (id: string) => void;
  setErrorFieldId: (id: string | null) => void;
  reset: () => void;
}

const initialState: EstimationState = {
  currentStep: 1,
  consumption: {
    method: null,
    invoiceFile: null,
    invoiceUrl: null,
    invoiceFiles: [],
    invoiceUrls: [],
    monthlyKwh: [null, null, null],
    annualKwh: null,
    contractType: null,
    subscribedPower: null,
    aiExtracted: null,
    aiConfidence: null,
    aiStatus: "idle",
  },
  location: { address: "", city: "", lat: null, lng: null },
  housing: {
    type: null,
    roofType: null,
    roofSurface: 80,
    hasAc: false,
    hasPool: false,
    hasEv: false,
  },
  photos: { roofFiles: [], roofUrls: [], meterFile: null, meterUrl: null },
  results: {
    recommendedKwc: null,
    annualProduction: null,
    budgetMin: null,
    budgetMax: null,
    roiYears: null,
    isViable: true,
    viabilityMessage: null,
    v1: null,
    v2: null,
    technicalNotes: [],
    personalizedMessage: null,
  },
  contact: { fullName: "", phone: "", email: "" },
  leadId: null,
  errorFieldId: null,
};

export const useEstimationStore = create<EstimationState & EstimationActions>((set) => ({
  ...initialState,
  setStep: (step) => set({ currentStep: step }),
  next: () => set((s) => ({ currentStep: Math.min(5, s.currentStep + 1) })),
  prev: () => set((s) => ({ currentStep: Math.max(1, s.currentStep - 1) })),
  setConsumption: (data) => set((s) => ({ consumption: { ...s.consumption, ...data } })),
  setLocation: (data) => set((s) => ({ location: { ...s.location, ...data } })),
  setHousing: (data) => set((s) => ({ housing: { ...s.housing, ...data } })),
  setPhotos: (data) => set((s) => ({ photos: { ...s.photos, ...data } })),
  setResults: (data) => set((s) => ({ results: { ...s.results, ...data } })),
  setContact: (data) => set((s) => ({ contact: { ...s.contact, ...data } })),
  setLeadId: (id) => set({ leadId: id }),
  setErrorFieldId: (id) => set({ errorFieldId: id }),
  reset: () => set(initialState),
}));

export const STEP_NAMES = [
  "Consommation",
  "Localisation",
  "Habitation",
  "Photos",
  "Coordonnées",
];
