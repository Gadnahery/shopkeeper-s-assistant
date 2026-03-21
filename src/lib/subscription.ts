const FALLBACK_SUBSCRIPTION_MONTHLY_PRICE_TZS = 10_000;

function toPositiveNumber(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export const DEFAULT_SUBSCRIPTION_MONTHLY_PRICE_TZS =
  toPositiveNumber(import.meta.env.VITE_SUBSCRIPTION_MONTHLY_PRICE_TZS) ??
  FALLBACK_SUBSCRIPTION_MONTHLY_PRICE_TZS;

export function resolveSubscriptionMonthlyPrice(...values: unknown[]) {
  for (const value of values) {
    const amount = toPositiveNumber(value);
    if (amount !== null) return amount;
  }

  return DEFAULT_SUBSCRIPTION_MONTHLY_PRICE_TZS;
}
