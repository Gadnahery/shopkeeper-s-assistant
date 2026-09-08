import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DataResetLog {
  id: string;
  shop_id: string;
  user_id: string | null;
  user_email: string | null;
  reset_type: "module" | "all";
  module_name: string | null;
  row_counts: Record<string, number>;
  created_at: string;
}

export type ResettableModule =
  | "sales"
  | "inventory"
  | "purchases"
  | "production"
  | "customers"
  | "expenses"
  | "suppliers"
  | "orders"
  | "other_income";

export function useDataResetLogs() {
  const { shopId, role } = useAuth();
  const isOwner = role === "owner";

  return useQuery({
    queryKey: ["data_reset_logs", shopId],
    queryFn: async (): Promise<DataResetLog[]> => {
      if (!shopId || !isOwner) return [];
      const { data, error } = await (supabase.from("data_reset_log" as any) as any)
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.warn("Could not fetch data_reset_log:", error);
        return [];
      }
      return (data || []) as DataResetLog[];
    },
    enabled: !!shopId && isOwner,
  });
}

export function useResetModule() {
  const queryClient = useQueryClient();
  const { shopId } = useAuth();

  return useMutation({
    mutationFn: async (moduleName: ResettableModule) => {
      const { data, error } = await (supabase as any).rpc("reset_shop_module", {
        p_module: moduleName,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, moduleName) => {
      // Invalidate relevant queries
      if (moduleName === "sales") {
        queryClient.invalidateQueries({ queryKey: ["sales"] });
        queryClient.invalidateQueries({ queryKey: ["draft_sales"] });
      } else if (moduleName === "inventory") {
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["stock_history"] });
        queryClient.invalidateQueries({ queryKey: ["low_stock"] });
      } else if (moduleName === "purchases") {
        queryClient.invalidateQueries({ queryKey: ["purchases"] });
        queryClient.invalidateQueries({ queryKey: ["stock_received"] });
      } else if (moduleName === "production") {
        queryClient.invalidateQueries({ queryKey: ["production_batches"] });
      } else if (moduleName === "customers") {
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        queryClient.invalidateQueries({ queryKey: ["customer_payments"] });
      } else if (moduleName === "expenses") {
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
      } else if (moduleName === "suppliers") {
        queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      } else if (moduleName === "orders") {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      } else if (moduleName === "other_income") {
        queryClient.invalidateQueries({ queryKey: ["other_income"] });
      }

      // Always invalidate dashboard and audit log queries
      queryClient.invalidateQueries({ queryKey: ["data_reset_logs", shopId] });
      queryClient.invalidateQueries({ queryKey: ["sales", shopId] });
    },
  });
}

export function useResetAllData() {
  const queryClient = useQueryClient();
  const { shopId } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any).rpc("reset_shop_all_data");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate all business entity queries across the app
      queryClient.invalidateQueries();
    },
  });
}
