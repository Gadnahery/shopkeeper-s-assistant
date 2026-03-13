import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const PAGE_PATHS = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/sales", label: "Sales" },
  { path: "/inventory", label: "Inventory" },
  { path: "/inventory/add", label: "Add Product" },
  { path: "/inventory/receive", label: "Receive Stock" },
  { path: "/categories", label: "Categories" },
  { path: "/orders", label: "Orders" },
  { path: "/todo", label: "To-Do" },
  { path: "/customers", label: "Customers" },
  { path: "/customers/:id", label: "Customer Detail" },
  { path: "/suppliers", label: "Suppliers" },
  { path: "/suppliers/:id", label: "Supplier Detail" },
  { path: "/expenses", label: "Expenses" },
  { path: "/hrm", label: "HRM" },
  { path: "/reports", label: "Reports" },
  { path: "/loyalty", label: "Loyalty" },
  { path: "/notifications", label: "Notifications" },
  { path: "/user-management", label: "User Management" },
  { path: "/assets", label: "Assets" },
  { path: "/settings", label: "Settings" },
];

export { PAGE_PATHS };

export function useUserPageAccess(userId: string | null, shopId: string | null) {
  return useQuery({
    queryKey: ["user-page-access", userId, shopId],
    queryFn: async () => {
      if (!userId || !shopId) return [];
      const { data, error } = await supabase
        .from("user_page_access")
        .select("page_path, allowed")
        .eq("user_id", userId)
        .eq("shop_id", shopId)
        .eq("allowed", true);
      if (error) return [];
      return (data ?? []).map((r) => r.page_path);
    },
    enabled: !!userId && !!shopId,
  });
}

export function useUpdateUserPageAccess(userId: string | null, shopId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (allowedPaths: string[]) => {
      if (!userId || !shopId) throw new Error("Missing user or shop");
      // Delete existing and insert new
      const { error: deleteError } = await supabase
        .from("user_page_access")
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
        const { error } = await supabase.from("user_page_access").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: (_, __, context) => {
      queryClient.invalidateQueries({ queryKey: ["user-page-access"] });
    },
  });
}

export function useMyPageAccess() {
  const { user, shopId } = useAuth();
  const userId = user?.id ?? null;
  return useUserPageAccess(userId, shopId);
}
