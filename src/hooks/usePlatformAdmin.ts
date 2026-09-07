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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      // 1. Try edge function first
      try {
        const { data, error } = await supabase.functions.invoke("approve-subscription-payment", {
          body: { payment_id: paymentId },
        });

        if (!error && data?.ok) return data;

        const msg = error?.message || "";
        if (msg && !msg.toLowerCase().includes("edge function") && !msg.toLowerCase().includes("failed to send a request") && !msg.toLowerCase().includes("failed to fetch")) {
          throw error;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg && !msg.toLowerCase().includes("edge function") && !msg.toLowerCase().includes("failed to send a request") && !msg.toLowerCase().includes("failed to fetch")) {
          throw err;
        }
      }

      // 2. Direct fallback using platform admin permissions
      const { data: payment, error: fetchErr } = await supabase
        .from("subscription_payments")
        .select("*")
        .eq("id", paymentId)
        .single();

      if (fetchErr || !payment) throw new Error("Payment record not found");

      const now = new Date();
      const { data: sub } = await supabase
        .from("shop_subscriptions")
        .select("current_period_ends_at")
        .eq("shop_id", payment.shop_id)
        .maybeSingle();

      const currentEnds = sub?.current_period_ends_at ? new Date(sub.current_period_ends_at) : null;
      const baseDate = currentEnds && currentEnds > now ? currentEnds : now;
      const periodStart = new Date(baseDate);
      const periodEnd = new Date(baseDate);
      periodEnd.setMonth(periodEnd.getMonth() + (payment.billing_period_months || 1));

      // Update payment to success
      const { error: paymentUpdateErr } = await supabase
        .from("subscription_payments")
        .update({
          status: "success",
          verified_by: user?.id ?? null,
          verified_at: now.toISOString(),
          completed_at: now.toISOString(),
          paid_for_period_start: periodStart.toISOString(),
          paid_for_period_end: periodEnd.toISOString(),
        })
        .eq("id", paymentId);

      if (paymentUpdateErr) throw paymentUpdateErr;

      // Update subscription to active
      const { error: subUpdateErr } = await supabase
        .from("shop_subscriptions")
        .update({
          status: "active",
          current_period_started_at: periodStart.toISOString(),
          current_period_ends_at: periodEnd.toISOString(),
          grace_ends_at: null,
          last_payment_at: now.toISOString(),
          monthly_price: Number(payment.amount) || 25000,
          provider: "manual",
        })
        .eq("shop_id", payment.shop_id);

      if (subUpdateErr) throw subUpdateErr;

      // Add in-app notification for shop
      try {
        await supabase.from("notifications").insert({
          shop_id: payment.shop_id,
          title: "Malipo Yamekubaliwa ✅",
          message: `Malipo yako ya TZS ${Number(payment.amount).toLocaleString()} yamekubaliwa. WiseCash Pro imeamilishwa kwa mwezi mmoja.`,
          type: "payment_approved",
        });
      } catch {
        // Notification is best-effort
      }

      return { ok: true, message: "Payment approved and subscription activated" };
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason: string }) => {
      // 1. Try edge function first
      try {
        const { data, error } = await supabase.functions.invoke("reject-subscription-payment", {
          body: { payment_id: paymentId, reason },
        });

        if (!error && data?.ok) return data;

        const msg = error?.message || "";
        if (msg && !msg.toLowerCase().includes("edge function") && !msg.toLowerCase().includes("failed to send a request") && !msg.toLowerCase().includes("failed to fetch")) {
          throw error;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg && !msg.toLowerCase().includes("edge function") && !msg.toLowerCase().includes("failed to send a request") && !msg.toLowerCase().includes("failed to fetch")) {
          throw err;
        }
      }

      // 2. Direct fallback using platform admin permissions
      const { data: payment } = await supabase
        .from("subscription_payments")
        .select("shop_id, amount")
        .eq("id", paymentId)
        .single();

      const { error: rejectErr } = await supabase
        .from("subscription_payments")
        .update({
          status: "rejected",
          rejection_reason: reason,
          verified_by: user?.id ?? null,
          verified_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          message: `Rejected: ${reason}`,
        })
        .eq("id", paymentId);

      if (rejectErr) throw rejectErr;

      if (payment) {
        try {
          await supabase.from("notifications").insert({
            shop_id: payment.shop_id,
            title: "Malipo Yamekataliwa ❌",
            message: `Malipo yako ya TZS ${Number(payment.amount).toLocaleString()} yamekataliwa. Sababu: ${reason}. Tuma tena ukithibitisha maelezo sahihi.`,
            type: "payment_rejected",
          });
        } catch {
          // Notification is best-effort
        }
      }

      return { ok: true, message: "Payment rejected" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-admin-pending-payments"] });
      queryClient.invalidateQueries({ queryKey: ["platform-admin-all-payments"] });
      queryClient.invalidateQueries({ queryKey: ["platform-admin-subscriptions"] });
    },
  });
}
