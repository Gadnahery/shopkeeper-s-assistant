import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

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
  const { shopId, role, user } = useAuth();
  const queryClient = useQueryClient();

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
      const { data, error } = await supabase.functions.invoke("azampay-payment-options");
      if (error) throw error;
      return (data ?? {
        providers: [],
        amount: 0,
      }) as { providers?: PaymentProviderOption[]; amount?: number };
    },
    enabled: Boolean(user),
    staleTime: 10 * 60 * 1000,
  });

  const initiatePaymentMutation = useMutation({
    mutationFn: async (input: InitiatePaymentInput) => {
      const { data, error } = await supabase.functions.invoke("azampay-initiate-subscription", {
        body: {
          provider: input.provider,
          phone_number: input.phoneNumber,
        },
      });

      if (error) throw error;
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

  const daysRemaining = getDaysRemaining(subscriptionQuery.data);
  const isTrialing = subscriptionQuery.data?.status === "trialing";
  const isActive = subscriptionQuery.data?.status === "active" || isTrialing;
  const isBillingLocked =
    Boolean(subscriptionQuery.data) &&
    !(subscriptionQuery.data?.status === "active" || subscriptionQuery.data?.status === "trialing");

  const renewalDateLabel = useMemo(() => {
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
      paymentAmount: paymentOptionsQuery.data?.amount ?? 0,
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
