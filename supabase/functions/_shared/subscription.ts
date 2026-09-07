export const DEFAULT_SUBSCRIPTION_MONTHLY_PRICE_TZS = 25_000;

function parsePositiveNumber(value: string | null | undefined) {
  const amount = Number(value ?? "");
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function getConfiguredSubscriptionMonthlyPrice() {
  return parsePositiveNumber(Deno.env.get("SUBSCRIPTION_MONTHLY_PRICE_TZS")) ??
    DEFAULT_SUBSCRIPTION_MONTHLY_PRICE_TZS;
}

export function isAzamPayDemoMode(baseUrl?: string | null) {
  const demoFlag = String(Deno.env.get("AZAMPAY_DEMO_MODE") ?? "").trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(demoFlag)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(demoFlag)) {
    return false;
  }

  return /sandbox/i.test(baseUrl ?? "");
}

type PaymentRecord = {
  id: string;
  amount: number | string;
  billing_period_months: number | null;
  payment_channel: string;
  phone_number: string;
  shop_id: string;
  status: string;
  provider?: string;
};

type SubscriptionRecord = {
  current_period_ends_at: string | null;
};

type ApplyPaymentSuccessParams = {
  adminClient: {
    from: (table: string) => any;
  };
  payment: PaymentRecord;
  amountConfigured: number;
  callbackPayload?: unknown;
  message?: string;
  providerReference: string;
  utilityReference?: string;
  provider?: string;
};

export async function applySubscriptionPaymentSuccess({
  adminClient,
  payment,
  amountConfigured,
  callbackPayload,
  message,
  providerReference,
  utilityReference,
  provider,
}: ApplyPaymentSuccessParams) {
  const amountPaid = Number(payment.amount ?? 0);

  if (amountConfigured > 0 && amountPaid < amountConfigured) {
    throw new Error("Paid amount is lower than the required monthly subscription amount");
  }

  const { data, error: subscriptionError } = await adminClient
    .from("shop_subscriptions")
    .select("current_period_ends_at")
    .eq("shop_id", payment.shop_id)
    .maybeSingle();
  const subscription = data as SubscriptionRecord | null;

  if (subscriptionError) {
    throw new Error(subscriptionError.message);
  }

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  const now = new Date();
  const currentPeriodEndsAt = subscription.current_period_ends_at ? new Date(subscription.current_period_ends_at) : null;
  const baseDate = currentPeriodEndsAt && currentPeriodEndsAt > now ? currentPeriodEndsAt : now;
  const periodStart = new Date(baseDate);
  const periodEnd = new Date(baseDate);
  periodEnd.setMonth(periodEnd.getMonth() + (payment.billing_period_months ?? 1));

  const successMessage = message || "Subscription payment confirmed";
  const paymentUpdate = {
    status: "success",
    provider_reference: providerReference,
    utility_reference: utilityReference ?? payment.id,
    transaction_reference: providerReference,
    message: successMessage,
    callback_payload: callbackPayload ?? {},
    paid_for_period_start: periodStart.toISOString(),
    paid_for_period_end: periodEnd.toISOString(),
    completed_at: new Date().toISOString(),
  };
  const subscriptionUpdate = {
    status: "active",
    current_period_started_at: periodStart.toISOString(),
    current_period_ends_at: periodEnd.toISOString(),
    grace_ends_at: null,
    last_payment_at: new Date().toISOString(),
    monthly_price: amountConfigured > 0 ? amountConfigured : amountPaid,
    provider: provider ?? payment.provider ?? "azampay",
    metadata: {
      last_provider_reference: providerReference,
      last_payment_phone: payment.phone_number,
      last_payment_channel: payment.payment_channel,
    },
  };

  const { error: paymentUpdateError } = await adminClient
    .from("subscription_payments")
    .update(paymentUpdate)
    .eq("id", payment.id);

  if (paymentUpdateError) {
    throw new Error(paymentUpdateError.message);
  }

  const { error: subscriptionUpdateError } = await adminClient
    .from("shop_subscriptions")
    .update(subscriptionUpdate)
    .eq("shop_id", payment.shop_id);

  if (subscriptionUpdateError) {
    throw new Error(subscriptionUpdateError.message);
  }

  const { error: notificationError } = await adminClient.from("notifications").insert({
    shop_id: payment.shop_id,
    title: "Subscription renewed",
    message: `Your access is active until ${periodEnd.toLocaleDateString("en-GB")}.`,
    type: "subscription-payment-success",
  });

  if (notificationError) {
    throw new Error(notificationError.message);
  }

  return { periodEnd };
}
