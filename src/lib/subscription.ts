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

export const BASE_ADMIN_STAFF_LIMIT = 4;
export const EXTRA_USER_SEAT_PRICE_TZS = 5_000;
export const REFERRAL_DISCOUNT_PERCENT = 5;

export function calculateSubscriptionBreakdown({
  basePrice = MANUAL_MONTHLY_PRICE_TZS,
  extraSeats = 0,
  hasReferralDiscount = false,
}: {
  basePrice?: number;
  extraSeats?: number;
  hasReferralDiscount?: boolean;
}) {
  const sanitizedExtraSeats = Math.max(0, Math.floor(extraSeats || 0));
  const extraSeatsCost = sanitizedExtraSeats * EXTRA_USER_SEAT_PRICE_TZS;
  const subtotal = basePrice + extraSeatsCost;
  const discountAmount = hasReferralDiscount
    ? Math.round(subtotal * (REFERRAL_DISCOUNT_PERCENT / 100))
    : 0;
  const total = Math.max(0, subtotal - discountAmount);

  return {
    basePrice,
    extraSeats: sanitizedExtraSeats,
    extraSeatsCost,
    subtotal,
    hasReferralDiscount,
    discountPercent: hasReferralDiscount ? REFERRAL_DISCOUNT_PERCENT : 0,
    discountAmount,
    total,
  };
}

export function resolveSubscriptionMonthlyPrice(...values: unknown[]) {
  for (const value of values) {
    const amount = toPositiveNumber(value);
    if (amount !== null && amount !== 10000) return amount;
  }

  return DEFAULT_SUBSCRIPTION_MONTHLY_PRICE_TZS;
}

