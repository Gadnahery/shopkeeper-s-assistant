const FALLBACK_SUBSCRIPTION_MONTHLY_PRICE_TZS = 25_000;

function toPositiveNumber(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export const DEFAULT_SUBSCRIPTION_MONTHLY_PRICE_TZS =
  toPositiveNumber(import.meta.env.VITE_SUBSCRIPTION_MONTHLY_PRICE_TZS) ??
  FALLBACK_SUBSCRIPTION_MONTHLY_PRICE_TZS;

export const MANUAL_MONTHLY_PRICE_TZS = 25_000;

export const MANUAL_PAYMENT_CHANNELS = [
  { value: "Mpesa", label: "M-Pesa (Vodacom)", number: "0759 793 303", name: "Gadna Henry" },
  { value: "Halopesa", label: "HaloPesa (Halotel)", number: "0617 502 185", name: "Gadna Henry" },
] as const;

export type ManualPaymentChannel = (typeof MANUAL_PAYMENT_CHANNELS)[number]["value"];

export function resolveSubscriptionMonthlyPrice(...values: unknown[]) {
  for (const value of values) {
    const amount = toPositiveNumber(value);
    if (amount !== null && amount !== 10000) return amount;
  }

  return DEFAULT_SUBSCRIPTION_MONTHLY_PRICE_TZS;
}

