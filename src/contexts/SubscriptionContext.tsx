import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import { BILLING_ENABLED } from "@/lib/billing";
import { resolveSubscriptionMonthlyPrice } from "@/lib/subscription";

type ShopSubscription = Tables<"shop_subscriptions">;
type SubscriptionPayment = Tables<"subscription_payments"> & {
  proof_url?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
};

type PaymentProviderOption = {
  value: string;
  label: string;
};

type InitiatePaymentInput = {
  provider: string;
  phoneNumber: string;
};

export type SubmitManualPaymentInput = {
  payment_channel: string;
  phone_number: string;
  amount: number;
  transaction_reference: string;
  payment_date?: string;
  proof_url?: string | null;
  billing_period_months?: number;
};

const DEFAULT_PAYMENT_OPTIONS: PaymentProviderOption[] = [
  { value: "Mpesa", label: "Vodacom M-Pesa" },
  { value: "Halopesa", label: "Halotel Halopesa" },
  { value: "Airtel", label: "Airtel Money" },
  { value: "Tigo", label: "Yas (TigoPesa)" },
  { value: "Azampesa", label: "AzamPesa" },
];

type SubscriptionContextValue = {
  subscription: ShopSubscription | null;
  latestPayment: SubscriptionPayment | null;
  pendingPayment: SubscriptionPayment | null;
  paymentOptions: PaymentProviderOption[];
  paymentAmount: number;
  isLoading: boolean;
  isBillingLocked: boolean;
  isTrialing: boolean;
  isActive: boolean;
  canManageBilling: boolean;
  daysRemaining: number | null;
  renewalDateLabel: string | null;
  refreshSubscription: () => Promise<void>;
  initiatePayment: (input: InitiatePaymentInput) => Promise<{ message: string }>;
  isInitiatingPayment: boolean;
  submitManualPayment: (input: SubmitManualPaymentInput) => Promise<{ ok: boolean; payment_id: string }>;
  isSubmittingManualPayment: boolean;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

async function getFunctionErrorMessage(error: unknown, fallback: string, response?: Response) {
  const errorResponse =
    typeof error === "object" && error && "context" in error
      ? (error as { context?: Response }).context
      : undefined;

  const resolvedResponse = response ?? errorResponse;

  if (resolvedResponse instanceof Response) {
    try {
      const payload = (await resolvedResponse.clone().json()) as {
        error?: string;
        message?: string;
        details?: unknown;
      };

      if (payload.error) return payload.error;
      if (payload.message) return payload.message;
      if (typeof payload.details === "string" && payload.details.trim()) return payload.details;
    } catch {
      try {
        const text = await resolvedResponse.clone().text();
        if (text.trim()) return text;
      } catch {
        // Ignore response parsing errors and fall back below.
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function isInvalidJwtMessage(message: string) {
  return /invalid jwt|jwt malformed|jwt expired/i.test(message);
}

function getDaysRemaining(subscription: ShopSubscription | null) {
  if (!subscription) return null;

  const targetDate =
    subscription.status === "trialing"
      ? subscription.trial_ends_at
      : subscription.current_period_ends_at;

  if (!targetDate) return null;

  const diff = new Date(targetDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { shopId, role, user, session } = useAuth();
  const queryClient = useQueryClient();

  const invokeBillingFunction = async <TData,>(
    functionName: string,
    options?: { body?: unknown },
  ) => {
    const execute = () => supabase.functions.invoke<TData>(functionName, options);

    let result = await execute();
    if (!result.error) return result;

    const message = await getFunctionErrorMessage(result.error, "Authentication failed", result.response);
    if (!isInvalidJwtMessage(message)) {
      return result;
    }

    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session) {
      throw new Error("Session expired. Please sign in again.");
    }

    result = await execute();
    if (!result.error) return result;

    const retryMessage = await getFunctionErrorMessage(result.error, "Authentication failed", result.response);
    if (isInvalidJwtMessage(retryMessage)) {
      throw new Error("Session expired. Please sign in again.");
    }

    return result;
  };

  const subscriptionQuery = useQuery({
    queryKey: ["shop-subscription", shopId],
    queryFn: async () => {
      if (!shopId) return null;
      await (supabase.rpc as any)("ensure_subscription_notifications");
      const { data, error } = await supabase
        .from("shop_subscriptions")
        .select("*")
        .eq("shop_id", shopId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: Boolean(shopId),
    staleTime: 5 * 60 * 1000,
  });

  const latestPaymentQuery = useQuery({
    queryKey: ["subscription-payments-latest", shopId],
    queryFn: async () => {
      if (!shopId) return null;
      const { data, error } = await supabase
        .from("subscription_payments")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: Boolean(shopId),
    staleTime: 5 * 60 * 1000,
  });

  const pendingPaymentQuery = useQuery({
    queryKey: ["subscription-payments-pending", shopId],
    queryFn: async () => {
      if (!shopId) return null;
      const { data, error } = await supabase
        .from("subscription_payments")
        .select("*")
        .eq("shop_id", shopId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as SubscriptionPayment | null;
    },
    enabled: Boolean(shopId),
    // Only poll if there is an active pending payment awaiting confirmation
    refetchInterval: (query) => (query.state.data ? 30_000 : false),
  });

  const paymentOptionsQuery = useQuery({
    queryKey: ["subscription-payment-options", user?.id],
    queryFn: async () => {
      if (!BILLING_ENABLED) {
        return {
          providers: DEFAULT_PAYMENT_OPTIONS,
          amount: resolveSubscriptionMonthlyPrice(),
        };
      }

      if (!session?.access_token) {
        return {
          providers: DEFAULT_PAYMENT_OPTIONS,
          amount: resolveSubscriptionMonthlyPrice(),
        };
      }

      const { data, error, response } = await invokeBillingFunction<{
        providers?: PaymentProviderOption[];
        amount?: number;
      }>("azampay-payment-options");
      if (error) {
        throw new Error(await getFunctionErrorMessage(error, "Failed to load payment options", response));
      }
      return (data ?? {
        providers: [],
        amount: 0,
      }) as { providers?: PaymentProviderOption[]; amount?: number };
    },
    enabled: BILLING_ENABLED && Boolean(user && session?.access_token),
    staleTime: 10 * 60 * 1000,
  });

  const initiatePaymentMutation = useMutation({
    mutationFn: async (input: InitiatePaymentInput) => {
      if (!BILLING_ENABLED) {
        return {
          message: "Billing is currently disabled while live payment setup is in progress.",
        };
      }

      const { data, error, response } = await invokeBillingFunction<{ message: string }>("azampay-initiate-subscription", {
        body: {
          provider: input.provider,
          phone_number: input.phoneNumber,
        },
      });

      if (error) {
        throw new Error(await getFunctionErrorMessage(error, "Failed to start payment", response));
      }
      return (data ?? { message: "Payment request started" }) as { message: string };
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["shop-subscription"] }),
        queryClient.invalidateQueries({ queryKey: ["subscription-payments-latest"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    },
  });

  const submitManualPaymentMutation = useMutation({
    mutationFn: async (input: SubmitManualPaymentInput) => {
      if (!shopId) throw new Error("No shop found for this account");

      // 1. Try invoking the Edge Function first
      let edgeFunctionSucceeded = false;
      try {
        const { data, error, response } = await invokeBillingFunction<{ ok: boolean; payment_id: string }>(
          "submit-manual-payment",
          { body: input }
        );

        if (!error && data?.ok) {
          edgeFunctionSucceeded = true;
          return data as { ok: boolean; payment_id: string };
        }

        const errorMsg = await getFunctionErrorMessage(error, "", response);
        // If it's a specific validation error from the function (not a deployment/network issue), rethrow it
        if (
          errorMsg &&
          !errorMsg.toLowerCase().includes("edge function") &&
          !errorMsg.toLowerCase().includes("failed to send a request") &&
          !errorMsg.toLowerCase().includes("failed to fetch")
        ) {
          throw new Error(errorMsg);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (
          message &&
          !message.toLowerCase().includes("edge function") &&
          !message.toLowerCase().includes("failed to send a request") &&
          !message.toLowerCase().includes("failed to fetch")
        ) {
          throw err;
        }
      }

      // 2. Direct database fallback if edge function is not deployed to Supabase
      if (!edgeFunctionSucceeded) {
        const { data: existingPending } = await supabase
          .from("subscription_payments")
          .select("id, status")
          .eq("shop_id", shopId)
          .eq("status", "pending")
          .maybeSingle();

        if (existingPending) {
          throw new Error("Una muamala unaosubiri kuhakikiwa tayari. Tafadhali subiri uthibitishwe.");
        }

        const externalId = `manual_${crypto.randomUUID()}`;
        const { data: payment, error: insertError } = await supabase
          .from("subscription_payments")
          .insert({
            shop_id: shopId,
            initiated_by: user?.id ?? null,
            provider: "manual",
            payment_channel: input.payment_channel,
            phone_number: input.phone_number,
            amount: input.amount,
            currency: "TZS",
            billing_period_months: input.billing_period_months ?? 1,
            status: "pending",
            external_id: externalId,
            transaction_reference: input.transaction_reference,
            proof_url: input.proof_url || null,
            message: `Manual payment submitted via ${input.payment_channel}. Reference: ${input.transaction_reference}`,
            paid_for_period_start: input.payment_date || new Date().toISOString().slice(0, 10),
          })
          .select()
          .single();

        if (insertError || !payment) {
          throw new Error(insertError?.message || "Failed to record payment");
        }

        try {
          await supabase.from("notifications").insert({
            shop_id: shopId,
            title: "Malipo Yamewasilishwa",
            message: `Taarifa za malipo ya TZS ${Number(input.amount).toLocaleString()} (${input.payment_channel}) zimewasilishwa na zinahakikiwa.`,
            type: "payment_submitted",
          });
        } catch {
          // Notification is best-effort
        }

        return { ok: true, payment_id: payment.id };
      }

      throw new Error("Failed to submit payment");
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["shop-subscription", shopId] }),
        queryClient.invalidateQueries({ queryKey: ["subscription-payments-latest", shopId] }),
        queryClient.invalidateQueries({ queryKey: ["subscription-payments-pending", shopId] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    },
  });

  useEffect(() => {
    if (!shopId) return;

    const paymentChannel = supabase
      .channel(`subscription-payments:${shopId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscription_payments", filter: `shop_id=eq.${shopId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["subscription-payments-latest", shopId] });
          queryClient.invalidateQueries({ queryKey: ["subscription-payments-pending", shopId] });
          queryClient.invalidateQueries({ queryKey: ["shop-subscription", shopId] });
        },
      )
      .subscribe();

    const subscriptionChannel = supabase
      .channel(`shop-subscriptions:${shopId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shop_subscriptions", filter: `shop_id=eq.${shopId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["shop-subscription", shopId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(paymentChannel);
      supabase.removeChannel(subscriptionChannel);
    };
  }, [shopId, queryClient]);

  const daysRemaining = getDaysRemaining(subscriptionQuery.data);
  const isTrialing = false;
  const isActive =
    subscriptionQuery.data?.status === "active" &&
    (daysRemaining === null || daysRemaining > 0);
  const isBillingLocked = !isActive && subscriptionQuery.data !== null && subscriptionQuery.data !== undefined;

  const renewalDateLabel = useMemo(() => {
    if (!subscriptionQuery.data) return null;
    const dateValue = subscriptionQuery.data.current_period_ends_at;

    if (!dateValue) return null;
    return new Date(dateValue).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [subscriptionQuery.data]);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      subscription: subscriptionQuery.data ?? null,
      latestPayment: latestPaymentQuery.data ?? null,
      pendingPayment: pendingPaymentQuery.data ?? null,
      paymentOptions: paymentOptionsQuery.data?.providers?.length
        ? paymentOptionsQuery.data.providers
        : DEFAULT_PAYMENT_OPTIONS,
      paymentAmount: resolveSubscriptionMonthlyPrice(
        paymentOptionsQuery.data?.amount,
        subscriptionQuery.data?.monthly_price,
      ),
      isLoading:
        subscriptionQuery.isLoading ||
        latestPaymentQuery.isLoading ||
        paymentOptionsQuery.isLoading,
      isBillingLocked,
      isTrialing,
      isActive,
      canManageBilling: role === "owner" || role === "manager",
      daysRemaining,
      renewalDateLabel,
      refreshSubscription: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["shop-subscription"] }),
          queryClient.invalidateQueries({ queryKey: ["subscription-payments-latest"] }),
          queryClient.invalidateQueries({ queryKey: ["subscription-payments-pending"] }),
          queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        ]);
      },
      initiatePayment: (input) => initiatePaymentMutation.mutateAsync(input),
      isInitiatingPayment: initiatePaymentMutation.isPending,
      submitManualPayment: (input) => submitManualPaymentMutation.mutateAsync(input),
      isSubmittingManualPayment: submitManualPaymentMutation.isPending,
    }),
    [
      subscriptionQuery.data,
      latestPaymentQuery.data,
      pendingPaymentQuery.data,
      paymentOptionsQuery.data,
      subscriptionQuery.isLoading,
      latestPaymentQuery.isLoading,
      paymentOptionsQuery.isLoading,
      isBillingLocked,
      isTrialing,
      isActive,
      role,
      daysRemaining,
      renewalDateLabel,
      queryClient,
      initiatePaymentMutation,
      submitManualPaymentMutation,
    ],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return context;
}
