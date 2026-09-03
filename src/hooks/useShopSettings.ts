import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

async function getUserShopId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("shop_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.shop_id || null;
}

export function useShopSettings() {
  return useQuery({
    queryKey: ["shop_settings"],
    queryFn: async () => {
      const shopId = await getUserShopId();
      if (!shopId) return null;
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("id", shopId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: { enable_low_stock_alerts?: boolean; auto_print_receipt?: boolean }) => {
      const shopId = await getUserShopId();
      if (!shopId) throw new Error("No shop found");
      const { data, error } = await (supabase.from("shop_settings" as any) as any)
        .upsert({
          shop_id: shopId,
          key: "preferences",
          value: prefs,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop_settings"] });
      toast.success("Preferences saved");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateShopSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: any) => {
      const shopId = await getUserShopId();
      if (!shopId) throw new Error("No shop found");

      const { data, error } = await supabase
        .from("shops")
        .update(updates)
        .eq("id", shopId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop_settings"] });
      toast.success("Settings saved successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to save settings: " + error.message);
    },
  });
}
