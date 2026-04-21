/**
 * IDENTIFIANTS OFFICIELS SUNAVIO SARL
 *
 * Source de vérité unique pour toutes les mentions légales du site.
 * Toute modification doit être validée avec le Registre du Commerce
 * (RC 164901/Marrakech) et la Direction Générale des Impôts.
 *
 * Dernière vérification : 2026-04-21
 */
export const SUNAVIO_IDENTITY = {
  legalName: "SUNAVIO SARL",
  legalForm: "Société à responsabilité limitée",
  capital: "100 000,00 MAD",
  ice: "003721552000008",
  rc: "164901 Marrakech",
  if: "66967281",
  tp: "45315807",

  address: {
    building: "Zenith Business Center",
    street: "Rue Mouslim, Lot Boukar",
    floor: "3ème étage, Apt N°14",
    district: "Bab Doukala",
    city: "Marrakech-Guéliz",
    country: "Maroc",
    oneLine:
      "Zenith Business Center, Rue Mouslim, Lot Boukar, 3ème étage, Apt N°14, Bab Doukala, Marrakech-Guéliz, Maroc",
    multiLine: [
      "Zenith Business Center",
      "Rue Mouslim, Lot Boukar",
      "3ème étage, Apt N°14",
      "Bab Doukala, Marrakech-Guéliz, Maroc",
    ],
  },

  contact: {
    founderName: "Anthony NEBOUT",
    founderTitle: "Co-fondateur",
    legalRepName: "Thierry NEBOUT",
    legalRepTitle: "Co-gérant",
    phone: "+212 06 63 28 44 44",
    phoneTel: "+212663284444",
    email: "sunavio.contact@gmail.com",
  },

  jurisdiction: {
    court: "Tribunal de Commerce de Marrakech",
    country: "Maroc",
  },

  cndp: {
    status: "en cours de dépôt",
    declarationNumber: null as string | null,
  },

  website: {
    primary: "sunavio.ma",
    alternates: ["sunavio.fr", "sunavio.com"],
  },
} as const;