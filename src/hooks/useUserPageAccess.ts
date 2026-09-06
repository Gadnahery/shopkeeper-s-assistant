import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const PAGE_PATHS = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/purchases", label: "Purchases" },
  { path: "/production", label: "Production" },
  { path: "/sales", label: "Sales" },
  { path: "/inventory", label: "Inventory" },
  { path: "/customers", label: "Customers & Receivables" },
  { path: "/expenses", label: "Finance & Expenses" },
  { path: "/hrm", label: "Employees / HR" },
  { path: "/reports", label: "Reports" },
  { path: "/settings", label: "Settings" },
  { path: "/orders", label: "Orders" },
  { path: "/suppliers", label: "Suppliers" },
  { path: "/categories", label: "Categories" },
  { path: "/todo", label: "To-Do" },
  { path: "/loyalty", label: "Loyalty" },
  { path: "/assets", label: "Assets" },
  { path: "/notifications", label: "Notifications" },
  { path: "/user-management", label: "User Management" },
  { path: "/appointments", label: "Appointments" },
];

export { PAGE_PATHS };

export function useUserPageAccess(userId: string | null, shopId: string | null) {
  return useQuery({
    queryKey: ["user-page-access", userId, shopId],
    queryFn: async (): Promise<string[]> => {
      if (!userId || !shopId) return [];
      const { data, error } = await (supabase.from("user_page_access" as any) as any)
        .select("page_path, allowed")
        .eq("user_id", userId)
        .eq("shop_id", shopId)
        .eq("allowed", true);
      if (error) return [];
      return (data ?? []).map((r: any) => r.page_path);
    },
    enabled: !!userId && !!shopId,
  });
}

export function useUpdateUserPageAccess(userId: string | null, shopId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (allowedPaths: string[]) => {
      if (!userId || !shopId) throw new Error("Missing user or shop");
      const { error: deleteError } = await (supabase.from("user_page_access" as any) as any)
        .delete()
        .eq("user_id", userId)
        .eq("shop_id", shopId);
      if (deleteError) throw deleteError;
      if (allowedPaths.length > 0) {
        const rows = allowedPaths.map((page_path) => ({
          user_id: userId,
          shop_id: shopId,
          page_path,
          allowed: true,
        }));
        const { error } = await (supabase.from("user_page_access" as any) as any).insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-page-access"] });
    },
  });
}

export function useMyPageAccess() {
  const { user, shopId } = useAuth();
  const userId = user?.id ?? null;
  return useUserPageAccess(userId, shopId);
}
