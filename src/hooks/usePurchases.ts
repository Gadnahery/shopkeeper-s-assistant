import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PurchaseItem {
  id?: string;
  product_id: string;
  product_name?: string;
  product_code?: string;
  quantity: number;
  buying_price: number;
  total?: number;
}

export interface PurchaseOrder {
  id: string;
  shop_id: string;
  supplier_id: string | null;
  supplier_name?: string | null;
  supplier_phone?: string | null;
  notes: string | null;
  status: "received" | "pending" | "cancelled";
  total_amount: number;
  items_count: number;
  items: PurchaseItem[];
  created_at: string;
}

export function usePurchases() {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ["purchases", shopId],
    queryFn: async (): Promise<PurchaseOrder[]> => {
      if (!shopId) return [];

      try {
        // Query stock_received joined with supplier and items
        const { data: receipts, error } = await supabase
          .from("stock_received")
          .select(`
            id,
            shop_id,
            supplier_id,
            notes,
            created_at,
            suppliers (
              id,
              name,
              phone
            ),
            stock_received_items (
              id,
              product_id,
              quantity,
              buying_price,
              products (
                id,
                name,
                code
              )
            )
          `)
          .eq("shop_id", shopId)
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Could not fetch stock_received, trying fallback:", error);
          // Fallback to stock_history with change_type = 'restock'
          const { data: history, error: historyError } = await supabase
            .from("stock_history")
            .select(`
              id,
              product_id,
              quantity_change,
              notes,
              created_at,
              products (
                id,
                name,
                code,
                buying_price
              )
            `)
            .eq("shop_id", shopId)
            .eq("change_type", "restock")
            .order("created_at", { ascending: false })
            .limit(50);

          if (historyError) throw historyError;

          return (history || []).map((h: any) => {
            const buyingPrice = Number(h.products?.buying_price || 0);
            const qty = Number(h.quantity_change || 0);
            return {
              id: h.id,
              shop_id: shopId,
              supplier_id: null,
              supplier_name: null,
              supplier_phone: null,
              notes: h.notes,
              status: "received" as const,
              total_amount: buyingPrice * qty,
              items_count: 1,
              items: [
                {
                  id: h.id,
                  product_id: h.product_id,
                  product_name: h.products?.name || "Product",
                  product_code: h.products?.code || "",
                  quantity: qty,
                  buying_price: buyingPrice,
                  total: buyingPrice * qty,
                },
              ],
              created_at: h.created_at,
            };
          });
        }

        return (receipts || []).map((r: any) => {
          const items: PurchaseItem[] = (r.stock_received_items || []).map((item: any) => {
            const qty = Number(item.quantity || 0);
            const price = Number(item.buying_price || 0);
            return {
              id: item.id,
              product_id: item.product_id,
              product_name: item.products?.name || "Product",
              product_code: item.products?.code || "",
              quantity: qty,
              buying_price: price,
              total: qty * price,
            };
          });

          const totalAmount = items.reduce((acc, curr) => acc + (curr.total || 0), 0);

          return {
            id: r.id,
            shop_id: r.shop_id,
            supplier_id: r.supplier_id,
            supplier_name: r.suppliers?.name || null,
            supplier_phone: r.suppliers?.phone || null,
            notes: r.notes,
            status: "received" as const,
            total_amount: totalAmount,
            items_count: items.length,
            items,
            created_at: r.created_at,
          };
        });
      } catch (err: any) {
        console.error("Error in usePurchases:", err);
        return [];
      }
    },
    enabled: !!shopId,
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  const { shopId, user } = useAuth();

  return useMutation({
    mutationFn: async ({
      supplierId,
      items,
      notes,
    }: {
      supplierId: string | null;
      items: { productId: string; quantity: number; buyingPrice: number }[];
      notes?: string;
    }) => {
      if (!shopId) throw new Error("Shop ID is required");
      if (!items || items.length === 0) throw new Error("At least one item is required");

      // For each item, use receive_stock_transaction or direct insert
      for (const item of items) {
        const { error: rpcError } = await (supabase as any).rpc("receive_stock_transaction", {
          p_product_id: item.productId,
          p_supplier_id: supplierId || null,
          p_quantity: item.quantity,
          p_buying_price: item.buyingPrice,
          p_notes: notes || null,
        });

        if (rpcError) {
          // If RPC fails (e.g. missing function in local env), fallback to direct product stock update + stock_history
          console.warn("receive_stock_transaction RPC failed, using direct update:", rpcError);
          
          // Get current stock
          const { data: prod } = await supabase
            .from("products")
            .select("stock, buying_price")
            .eq("id", item.productId)
            .single();

          const prevStock = Number(prod?.stock || 0);
          const newStock = prevStock + Number(item.quantity);

          await supabase
            .from("products")
            .update({
              stock: newStock,
              buying_price: item.buyingPrice || prod?.buying_price,
            })
            .eq("id", item.productId);

          await supabase.from("stock_history").insert({
            shop_id: shopId,
            product_id: item.productId,
            quantity_change: item.quantity,
            previous_stock: prevStock,
            new_stock: newStock,
            change_type: "restock",
            notes: notes || "Stock received from purchase",
          });
        }
      }

      // If supplier has pending payment, we can optionally update supplier pending payment if needed
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["stock_history"] });
      queryClient.invalidateQueries({ queryKey: ["stock_by_category"] });
    },
  });
}
