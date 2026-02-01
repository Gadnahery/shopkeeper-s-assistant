import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type ShopSettings = Tables<"shop_settings">;

export function useShopSettings() {
  return useQuery({
    queryKey: ["shop_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateShopSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: TablesUpdate<"shop_settings"> & { id: string }) => {
      const { id, ...rest } = updates;
      const { data, error } = await supabase
        .from("shop_settings")
        .update(rest)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop_settings"] });
      toast.success("Settings saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save settings: " + error.message);
    },
  });
}
