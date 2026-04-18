// Shared with frontend src/lib/irradiance.ts — keep in sync.
export interface IrradianceZone {
  name: string;
  irradiance: number;
  description: string;
}

export function estimateIrradiance(lat: number, lng: number): IrradianceZone {
  if (lat < 28.5) return { name: "Sud saharien", irradiance: 1850, description: "" };
  if (lng < -8.8 && lat >= 28.5 && lat < 33)
    return { name: "Côte atlantique sud", irradiance: 1750, description: "" };
  if (lng < -5.5 && lat >= 33)
    return { name: "Côte atlantique nord", irradiance: 1600, description: "" };
  if (lng >= -7 && lng < -4 && lat >= 30.5 && lat < 33.5)
    return { name: "Atlas / Haut plateau", irradiance: 1700, description: "" };
  if (lng >= -3.5) return { name: "Oriental", irradiance: 1700, description: "" };
  return { name: "Plaines intérieures", irradiance: 1650, description: "" };
}
