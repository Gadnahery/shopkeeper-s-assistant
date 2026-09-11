import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface RecycleBinItem {
  id: string;
  shop_id: string;
  entity_type: "sales" | "products" | "expenses" | "orders" | "customers" | string;
  entity_id: string;
  item_name: string;
  item_details: Record<string, any>;
  original_data: Record<string, any>;
  deleted_by: string | null;
  deleted_by_name: string | null;
  deleted_at: string;
  expires_at: string;
}

export function useRecycleBinItems(entityType?: string) {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ["recycle_bin", shopId, entityType || "all"],
    queryFn: async (): Promise<RecycleBinItem[]> => {
      if (!shopId) return [];

      // Clean up expired items in background
      try {
        await (supabase as any).rpc("cleanup_expired_recycle_bin");
      } catch {
        // Continue if RPC cleanup is not supported or errors
      }

      let query = (supabase as any)
        .from("recycle_bin")
        .select("*")
        .eq("shop_id", shopId)
        .gt("expires_at", new Date().toISOString())
        .order("deleted_at", { ascending: false });

      if (entityType && entityType !== "all") {
        query = query.eq("entity_type", entityType);
      }

      const { data, error } = await query;
      if (error) {
        console.warn("Recycle bin query error:", error.message);
        return [];
      }
      return (data || []) as RecycleBinItem[];
    },
    enabled: !!shopId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useRestoreRecycleBinItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (binId: string) => {
      const { data, error } = await (supabase as any).rpc("restore_recycle_bin_item", {
        p_bin_id: binId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["recycle_bin"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sales", "today"] });
      queryClient.invalidateQueries({ queryKey: ["sales", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["sales", "range"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["stock_history"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });

      const name = data?.item_name || "Item";
      toast.success(`${name} restored successfully!`);
    },
    onError: (err: any) => {
      toast.error(`Failed to restore item: ${err.message || "Unknown error"}`);
    },
  });
}

export function usePermanentDeleteRecycleBinItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (binId: string) => {
      try {
        const { data, error } = await (supabase as any).rpc("permanently_delete_recycle_bin_item", {
          p_bin_id: binId,
        });
        if (error) throw error;
        return data;
      } catch (err: any) {
        // Fallback to direct delete from table if RPC not found
        const { error } = await (supabase as any)
          .from("recycle_bin")
          .delete()
          .eq("id", binId);
        if (error) throw error;
        return { success: true, bin_id: binId };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recycle_bin"] });
      toast.success("Item permanently deleted");
    },
    onError: (err: any) => {
      toast.error(`Failed to permanently delete item: ${err.message || "Unknown error"}`);
    },
  });
}

export function useEmptyRecycleBin() {
  const queryClient = useQueryClient();
  const { shopId } = useAuth();

  return useMutation({
    mutationFn: async () => {
      try {
        const { data, error } = await (supabase as any).rpc("empty_recycle_bin");
        if (error) throw error;
        return data;
      } catch (err: any) {
        if (!shopId) throw err;
        const { error } = await (supabase as any)
          .from("recycle_bin")
          .delete()
          .eq("shop_id", shopId);
        if (error) throw error;
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recycle_bin"] });
      toast.success("Recycle Bin emptied successfully");
    },
    onError: (err: any) => {
      toast.error(`Failed to empty Recycle Bin: ${err.message || "Unknown error"}`);
    },
  });
}
