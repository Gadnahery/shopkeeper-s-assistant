import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type ShopSettings = Tables<"shop_settings">;

async function getUserShopId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("shop_id").eq("user_id", user.id).maybeSingle();
  return data?.shop_id || null;
}

export function useShopSettings() {
  return useQuery({
    queryKey: ["shop_settings"],
    queryFn: async () => {
      const shopId = await getUserShopId();
      if (!shopId) return null;
      const { data, error } = await supabase
        .from("shop_settings")
        .select("*")
        .eq("shop_id", shopId)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        const { data: shops } = await supabase.from("shops").select("name, phone, address").eq("id", shopId).single();
        return shops ? { id: null, shop_id: shopId, shop_name: shops.name, phone: shops.phone, address: shops.address, language: "en" } : null;
      }
      return data;
    },
  });
}

export function useUpdateShopSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: TablesUpdate<"shop_settings"> & { id?: string | null }) => {
      const shopId = await getUserShopId();
      if (!shopId) throw new Error("No shop found");
      const { id, ...rest } = updates;
      if (id) {
        const { data, error } = await supabase
          .from("shop_settings")
          .update({ shop_name: rest.shop_name, phone: rest.phone, address: rest.address })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data: existing } = await supabase.from("shop_settings").select("id").eq("shop_id", shopId).maybeSingle();
      if (existing) {
        const { data, error } = await supabase
          .from("shop_settings")
          .update({ shop_name: rest.shop_name, phone: rest.phone, address: rest.address })
          .eq("shop_id", shopId)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("shop_settings")
        .insert({ shop_id: shopId, shop_name: rest.shop_name || "", phone: rest.phone || null, address: rest.address || null, language: "en" })
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
