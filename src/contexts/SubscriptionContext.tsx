import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import { BILLING_ENABLED } from "@/lib/billing";
import { resolveSubscriptionMonthlyPrice } from "@/lib/subscription";

type ShopSubscription = Tables<"shop_subscriptions">;
type SubscriptionPayment = Tables<"subscription_payments">;

type PaymentProviderOption = {
  value: string;
  label: string;
};

type InitiatePaymentInput = {
  provider: string;
  phoneNumber: string;
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
      await supabase.rpc("ensure_subscription_notifications");
      const { data, error } = await supabase
        .from("shop_subscriptions")
        .select("*")
        .eq("shop_id", shopId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: Boolean(shopId),
    refetchInterval: 60_000,
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
    refetchInterval: 60_000,
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

  useEffect(() => {
    if (!shopId) return;

    const paymentChannel = supabase
      .channel(`subscription-payments:${shopId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscription_payments", filter: `shop_id=eq.${shopId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["subscription-payments-latest", shopId] });
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

  const daysRemaining = BILLING_ENABLED ? getDaysRemaining(subscriptionQuery.data) : null;
  const isTrialing = BILLING_ENABLED ? subscriptionQuery.data?.status === "trialing" : false;
  const isActive = BILLING_ENABLED ? subscriptionQuery.data?.status === "active" || isTrialing : true;
  const isBillingLocked = false;

  const renewalDateLabel = useMemo(() => {
    if (!BILLING_ENABLED) return null;
    if (!subscriptionQuery.data) return null;
    const dateValue =
      subscriptionQuery.data.status === "trialing"
        ? subscriptionQuery.data.trial_ends_at
        : subscriptionQuery.data.current_period_ends_at;

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
          queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        ]);
      },
      initiatePayment: (input) => initiatePaymentMutation.mutateAsync(input),
      isInitiatingPayment: initiatePaymentMutation.isPending,
    }),
    [
      subscriptionQuery.data,
      latestPaymentQuery.data,
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
