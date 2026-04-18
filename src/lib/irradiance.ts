// Estimate solar irradiance (kWh/kWc/year) for any point in Morocco
// based on broad climatic zones derived from latitude/longitude.
// Values calibrated against PVGIS / NASA POWER averages.

export interface IrradianceZone {
  name: string;
  irradiance: number; // kWh/kWc/year
  description: string;
}

export function estimateIrradiance(lat: number, lng: number): IrradianceZone {
  // South Sahara (Dakhla, Laâyoune, sud profond)
  if (lat < 28.5) {
    return {
      name: "Sud saharien",
      irradiance: 1850,
      description: "Ensoleillement maximal, zone désertique sud",
    };
  }

  // Atlantic coast (Essaouira, Agadir, Safi)
  if (lng < -8.8 && lat >= 28.5 && lat < 33) {
    return {
      name: "Côte atlantique sud",
      irradiance: 1750,
      description: "Très bon ensoleillement, brises marines",
    };
  }

  // Atlantic coast north (Casablanca, Rabat, Kenitra, Tanger)
  if (lng < -5.5 && lat >= 33) {
    return {
      name: "Côte atlantique nord",
      irradiance: 1600,
      description: "Bon ensoleillement, climat tempéré océanique",
    };
  }

  // Atlas / mountains (rough band, higher altitude)
  if (lng >= -7 && lng < -4 && lat >= 30.5 && lat < 33.5) {
    return {
      name: "Atlas / Haut plateau",
      irradiance: 1700,
      description: "Bon ensoleillement, altitude élevée",
    };
  }

  // Eastern / Oriental (Oujda, Nador, Berkane)
  if (lng >= -3.5) {
    return {
      name: "Oriental",
      irradiance: 1700,
      description: "Excellent ensoleillement, climat semi-aride",
    };
  }

  // Interior plains (Marrakech, Fès, Meknès, Beni Mellal)
  return {
    name: "Plaines intérieures",
    irradiance: 1650,
    description: "Très bon ensoleillement, climat continental",
  };
}
