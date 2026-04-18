export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function formatKwc(kwc: number): string {
  return `${formatNumber(kwc, 1)} kWc`;
}

export function formatKwh(kwh: number): string {
  return `${formatNumber(Math.round(kwh))} kWh`;
}

export function formatDh(amount: number): string {
  return `${formatNumber(Math.round(amount))} DH`;
}

export function formatYears(years: number): string {
  return `${formatNumber(years, 1)} ans`;
}
