import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useStockHistory(productId: string | null) {
  return useQuery({
    queryKey: ["stock-history", productId],
    enabled: !!productId,
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("stock_history")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
