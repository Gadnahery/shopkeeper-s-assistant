import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export async function getShopUsers(shopId: string) {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, user_id, full_name, phone, avatar_url, created_at")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const { data: roles } = await supabase
    .from("user_roles")
    .select("user_id, role");

  const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));

  return (profiles ?? []).map((p) => ({
    id: p.id,
    user_id: p.user_id,
    full_name: p.full_name || "User",
    phone: p.phone,
    avatar_url: p.avatar_url,
    created_at: p.created_at || new Date().toISOString(),
    role: (roleMap.get(p.user_id) ?? "staff") as "owner" | "manager" | "cashier" | "staff" | "hr",
  }));
}

export function useShopUsers(shopId: string | null) {
  return useQuery({
    queryKey: ["shop-users", shopId],
    queryFn: () => getShopUsers(shopId!),
    enabled: !!shopId,
  });
}
