import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export async function getShopUsers(shopId: string) {
  let profiles: any[] | null = null;

  // 1. First attempt to query with custom_role (when migration 044 is applied)
  const primaryRes = await supabase
    .from("profiles")
    .select("id, user_id, full_name, email, phone, avatar_url, custom_role, created_at")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  if (!primaryRes.error && primaryRes.data) {
    profiles = primaryRes.data;
  } else {
    // 2. Gracefully fall back to standard columns if custom_role does not exist in schema yet
    const fallbackRes = await supabase
      .from("profiles")
      .select("id, user_id, full_name, email, phone, avatar_url, created_at")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });

    if (fallbackRes.error) {
      console.error("Failed to fetch shop profiles:", fallbackRes.error);
      return [];
    }
    profiles = fallbackRes.data;
  }

  // Fetch roles from user_roles for this specific shop
  const { data: roles } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .eq("shop_id", shopId);

  const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));

  // Read local role storage fallback
  let localRoleMap: Record<string, string> = {};
  try {
    const stored = localStorage.getItem(`wisecash_custom_roles_${shopId}`);
    if (stored) localRoleMap = JSON.parse(stored);
  } catch {}

  // Read local tombstone storage for deleted users in this shop
  let deletedUserIds = new Set<string>();
  try {
    const stored = localStorage.getItem(`wisecash_deleted_users_${shopId}`);
    if (stored) {
      deletedUserIds = new Set(JSON.parse(stored));
    }
  } catch {}

  // Only profiles that have an active role in user_roles for this shop AND are not tombstoned
  const activeProfiles = (profiles ?? []).filter(
    (p: any) =>
      roleMap.has(p.user_id) &&
      !deletedUserIds.has(p.user_id) &&
      !deletedUserIds.has(p.id)
  );

  return activeProfiles.map((p: any) => {
    const rawRole = (roleMap.get(p.user_id) ?? "staff") as "owner" | "manager" | "cashier" | "staff" | "hr";
    const customRole = p.custom_role || localRoleMap[p.user_id] || null;
    const displayedRole = customRole || (rawRole === "owner" ? "Owner" : rawRole);

    return {
      id: p.id,
      user_id: p.user_id,
      full_name: p.full_name || "User",
      email: p.email ?? null,
      phone: p.phone,
      avatar_url: p.avatar_url,
      created_at: p.created_at || new Date().toISOString(),
      custom_role: customRole,
      role: displayedRole as string,
      raw_role: rawRole,
    };
  });
}

export function useShopUsers(shopId: string | null) {
  return useQuery({
    queryKey: ["shop-users", shopId],
    queryFn: () => getShopUsers(shopId!),
    enabled: !!shopId,
  });
}
