import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function isMissingColumnError(error: unknown, column: string) {
  const message = (error as Error | null)?.message?.toLowerCase() ?? "";
  return message.includes(column.toLowerCase()) && (message.includes("column") || message.includes("schema cache"));
}

export async function getShopUsers(shopId: string) {
  let profiles:
    | Array<{ id: string; user_id: string; full_name: string; email?: string | null; phone?: string | null; created_at: string }>
    | null = null;

  const profilesWithEmail = await supabase
    .from("profiles")
    .select("id, user_id, full_name, email, phone, created_at")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  if (profilesWithEmail.error && isMissingColumnError(profilesWithEmail.error, "email")) {
    const fallbackProfiles = await supabase
      .from("profiles")
      .select("id, user_id, full_name, phone, created_at")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });
    if (fallbackProfiles.error) throw fallbackProfiles.error;
    profiles = (fallbackProfiles.data ?? []).map((profile) => ({ ...profile, email: null }));
  } else if (profilesWithEmail.error) {
    throw profilesWithEmail.error;
  } else {
    profiles = profilesWithEmail.data ?? [];
  }

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
