import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

export type Product = Tables<"products">;
export type ProductInsert = TablesInsert<"products">;
export type ProductUpdate = TablesUpdate<"products">;

export function useProducts() {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ["products", shopId],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, categories(name, name_sw)")
        .order("created_at", { ascending: false });

      if (shopId) {
        query = query.eq("shop_id", shopId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!shopId,
  });
}

export function useProduct(id: string) {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ["products", shopId, id],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, categories(name, name_sw)")
        .eq("id", id);

      if (shopId) {
        query = query.eq("shop_id", shopId);
      }

      const { data, error } = await query.single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!shopId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { shopId } = useAuth();
  
  return useMutation({
    mutationFn: async (product: ProductInsert) => {
      const finalProduct: any = { ...product };
      if (!finalProduct.shop_id && shopId) {
        finalProduct.shop_id = shopId;
      }
      if (!finalProduct.code) {
        finalProduct.code = finalProduct.barcode || `PRD-${Date.now().toString().slice(-6)}`;
      }
      if (!finalProduct.item_type) {
        finalProduct.item_type = "product";
      }
      if (finalProduct.track_inventory === undefined) {
        finalProduct.track_inventory = finalProduct.item_type === "product";
      }
      const { data, error } = await supabase
        .from("products")
        .insert(finalProduct)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create product: " + error.message);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: ProductUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update product: " + error.message);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await (supabase as any).rpc("delete_product_to_recycle_bin", {
          p_product_id: id,
        });
        if (error) throw error;
      } catch (err: any) {
        // Fallback to direct delete if RPC not yet deployed
        const { error } = await supabase
          .from("products")
          .delete()
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["recycle_bin"] });
      toast.success("Product moved to Recycle Bin (retained for 7 days)");
    },
    onError: (error) => {
      toast.error("Failed to delete product: " + error.message);
    },
  });
}

export function useLowStockProducts() {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ["products", "low-stock", shopId],
    queryFn: async () => {
      let query = supabase.from("products").select("*");
      if (shopId) {
        query = query.eq("shop_id", shopId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data?.filter(p => p.item_type !== "service" && p.track_inventory !== false && p.stock <= (p.low_stock_alert ?? 5)) || [];
    },
    enabled: !!shopId,
  });
}
