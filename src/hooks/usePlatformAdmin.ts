import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PendingPaymentWithShop = {
  id: string;
  shop_id: string;
  amount: number;
  currency: string;
  billing_period_months: number;
  payment_channel: string;
  phone_number: string;
  status: string;
  transaction_reference: string | null;
  proof_url: string | null;
  rejection_reason: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  message: string | null;
  shops?: {
    name: string;
    contact_phone?: string | null;
  } | null;
};

export type SubscriptionWithShop = {
  id: string;
  shop_id: string;
  status: string;
  monthly_price: number;
  provider: string;
  trial_ends_at: string | null;
  current_period_started_at: string | null;
  current_period_ends_at: string | null;
  created_at: string;
  shops?: {
    name: string;
    contact_phone?: string | null;
  } | null;
};

export function useIsPlatformAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-platform-admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        // Table might not exist yet or permission denied
        return false;
      }
      return Boolean(data);
    },
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePendingPayments() {
  return useQuery({
    queryKey: ["platform-admin-pending-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_payments")
        .select("*, shops(name, contact_phone)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as PendingPaymentWithShop[];
    },
    refetchInterval: 15_000,
  });
}

export function useAllPayments() {
  return useQuery({
    queryKey: ["platform-admin-all-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_payments")
        .select("*, shops(name, contact_phone)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data ?? []) as PendingPaymentWithShop[];
    },
    refetchInterval: 30_000,
  });
}

export function useAllSubscriptions() {
  return useQuery({
    queryKey: ["platform-admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_subscriptions")
        .select("*, shops(name, contact_phone)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as SubscriptionWithShop[];
    },
    refetchInterval: 30_000,
  });
}

export function useApprovePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { data, error } = await supabase.functions.invoke("approve-subscription-payment", {
        body: { payment_id: paymentId },
      });

      if (error) throw new Error(error.message || "Failed to approve payment");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-admin-pending-payments"] });
      queryClient.invalidateQueries({ queryKey: ["platform-admin-all-payments"] });
      queryClient.invalidateQueries({ queryKey: ["platform-admin-subscriptions"] });
    },
  });
}

export function useRejectPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason: string }) => {
      const { data, error } = await supabase.functions.invoke("reject-subscription-payment", {
        body: { payment_id: paymentId, reason },
      });

      if (error) throw new Error(error.message || "Failed to reject payment");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-admin-pending-payments"] });
      queryClient.invalidateQueries({ queryKey: ["platform-admin-all-payments"] });
      queryClient.invalidateQueries({ queryKey: ["platform-admin-subscriptions"] });
    },
  });
}
