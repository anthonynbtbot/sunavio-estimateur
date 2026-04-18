export type ValidationErrorCode =
  | "invalid_full_name"
  | "invalid_phone"
  | "invalid_email"
  | "invalid_city"
  | "invalid_consumption"
  | "invalid_housing_type"
  | "invalid_roof_type";

export interface ErrorMapping {
  message: string;
  returnToStep: number;
  fieldHint?: string;
}

export const VALIDATION_ERROR_MAP: Record<ValidationErrorCode, ErrorMapping> = {
  invalid_full_name: {
    message: "Votre nom doit contenir entre 2 et 100 caractères.",
    returnToStep: 5,
    fieldHint: "Nom complet",
  },
  invalid_phone: {
    message:
      "Votre numéro de téléphone ne semble pas valide. Vérifiez qu'il s'agit bien d'un numéro marocain (ex : 06 63 28 44 44 ou +212 6 63 28 44 44).",
    returnToStep: 5,
    fieldHint: "Numéro WhatsApp",
  },
  invalid_email: {
    message:
      "L'adresse email saisie ne semble pas valide. Vous pouvez aussi laisser ce champ vide.",
    returnToStep: 5,
    fieldHint: "Email",
  },
  invalid_city: {
    message: "La ville saisie ne semble pas valide.",
    returnToStep: 2,
    fieldHint: "Adresse",
  },
  invalid_consumption: {
    message:
      "Les consommations saisies semblent aberrantes. Merci de vérifier vos valeurs mensuelles (elles doivent correspondre à une consommation annuelle entre 500 et 100 000 kWh).",
    returnToStep: 1,
    fieldHint: "Consommation mensuelle",
  },
  invalid_housing_type: {
    message: "Le type de logement sélectionné n'est pas valide.",
    returnToStep: 3,
    fieldHint: "Type de logement",
  },
  invalid_roof_type: {
    message: "Le type de toit sélectionné n'est pas valide.",
    returnToStep: 3,
    fieldHint: "Type de toit",
  },
};

export function getErrorMapping(code: string): ErrorMapping {
  return (
    VALIDATION_ERROR_MAP[code as ValidationErrorCode] ?? {
      message:
        "Une erreur de validation est survenue. Merci de vérifier vos informations.",
      returnToStep: 1,
    }
  );
}
