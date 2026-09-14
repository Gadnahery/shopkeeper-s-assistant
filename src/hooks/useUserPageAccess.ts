import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const PAGE_PATHS = [
  { path: "/dashboard", label: "Dashboard", sw: "Dashibodi", group: "Overview" },
  { path: "/sales", label: "Sales (POS & Invoices)", sw: "Mauzo (POS na Stakabadhi)", group: "Operations" },
  { path: "/inventory", label: "Inventory & Stock", sw: "Stoki na Bidhaa", group: "Operations" },
  { path: "/purchases", label: "Purchases", sw: "Manunuzi ya Bidhaa", group: "Operations" },
  { path: "/orders", label: "Orders", sw: "Maagizo ya Mauzo", group: "Operations" },
  { path: "/customers", label: "Customers & Receivables", sw: "Wateja na Madeni", group: "Relationships" },
  { path: "/suppliers", label: "Suppliers", sw: "Wasambazaji", group: "Relationships" },
  { path: "/expenses", label: "Finance & Expenses", sw: "Fedha na Matumizi", group: "Finance" },
  { path: "/hrm", label: "Employees / HR", sw: "Wafanyakazi (HR)", group: "People" },
  { path: "/reports", label: "Reports & Analytics", sw: "Ripoti na Takwimu", group: "Insights" },
  { path: "/categories", label: "Categories", sw: "Makundi ya Bidhaa", group: "Management" },
  { path: "/loyalty", label: "Loyalty Program", sw: "Mpango wa Uaminifu", group: "Management" },
  { path: "/assets", label: "Assets Management", sw: "Mali za Duka", group: "Management" },
  { path: "/todo", label: "Tasks & To-Do", sw: "Kazi na Mipango", group: "Management" },
  { path: "/notifications", label: "Notifications & Alerts", sw: "Arifa na Tahadhari", group: "Management" },
  { path: "/appointments", label: "Appointments & Bookings", sw: "Miadi na Nafasi", group: "Operations" },
  { path: "/production", label: "Production & Batches", sw: "Uzalishaji wa Bidhaa", group: "Operations" },
  { path: "/recycle-bin", label: "Recycle Bin", sw: "Jalada la Taka", group: "Operations" },
  { path: "/user-management", label: "User Management", sw: "Usimamizi wa Watumiaji", group: "Administration" },
  { path: "/settings", label: "Settings", sw: "Mipangilio ya Duka", group: "Administration" },
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
