import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useLoyaltyTransactions() {
  const { shopId } = useAuth();
  return useQuery({
    queryKey: ["loyalty-transactions", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      if (!shopId) return [];
      const { data, error } = await (supabase as any)
        .from("loyalty_transactions")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAdjustLoyaltyPoints() {
  const qc = useQueryClient();
  const { shopId } = useAuth();
  return useMutation({
    mutationFn: async (input: { customer_id: string; points: number; note?: string }) => {
      if (!shopId) throw new Error("No shop found");
      const { error } = await (supabase as any).from("loyalty_transactions").insert({
        shop_id: shopId,
        customer_id: input.customer_id,
        type: "adjust",
        points: input.points,
        note: input.note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loyalty-transactions"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
