/** Fixed USD → INR rate used for project financial data */
export const USD_TO_INR = 83;

export const TOTAL_PROJECT_BUDGET = 2_000_000 * USD_TO_INR;
export const CONTINGENCY_RESERVE = 200_000 * USD_TO_INR;

export const PHASE_BASELINES = {
  excavation: 125_000 * USD_TO_INR,
  concrete: 260_000 * USD_TO_INR,
  framing: 550_000 * USD_TO_INR,
};

export function usdToInr(usd: number): number {
  return usd * USD_TO_INR;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatINRCompact(amount: number): string {
  if (amount >= 10_000_000) {
    const crores = amount / 10_000_000;
    return `₹${crores >= 10 ? crores.toFixed(1) : crores.toFixed(2)} Cr`;
  }
  if (amount >= 100_000) {
    return `₹${(amount / 100_000).toFixed(2)} L`;
  }
  if (amount >= 1_000) {
    return `₹${(amount / 1_000).toFixed(0)}K`;
  }
  return formatINR(amount);
}
