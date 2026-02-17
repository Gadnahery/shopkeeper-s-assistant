import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export async function getShopUsers(shopId: string) {
  const { data: profiles, error: pe } = await supabase
    .from("profiles")
    .select("id, user_id, full_name, created_at")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  if (pe) throw pe;
  const { data: roles, error: re } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .eq("shop_id", shopId);
  if (re) throw re;
  const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
  return (profiles ?? []).map((p) => ({
    ...p,
    role: roleMap.get((p as { user_id: string }).user_id) ?? "staff",
  }));
}

export function useShopUsers(shopId: string | null) {
  return useQuery({
    queryKey: ["shop-users", shopId],
    queryFn: () => getShopUsers(shopId!),
    enabled: !!shopId,
  });
}
