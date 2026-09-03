import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  paid_amount: number;
  outstanding: number;
  items_count: number;
  items: PurchaseItem[];
  created_at: string;
  received_date?: string;
}

export function usePurchases() {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ["purchases", shopId],
    queryFn: async (): Promise<PurchaseOrder[]> => {
      if (!shopId) return [];

      try {
        const { data: receipts, error } = await supabase
          .from("stock_received")
          .select(`
            id,
            shop_id,
            supplier_id,
            notes,
            status,
            total_amount,
            paid_amount,
            received_date,
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
                barcode
              )
            )
          `)
          .eq("shop_id", shopId)
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Could not fetch stock_received, trying fallback:", error);
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
            const total = buyingPrice * qty;
            return {
              id: h.id,
              shop_id: shopId,
              supplier_id: null,
              supplier_name: null,
              supplier_phone: null,
              notes: h.notes,
              status: "received" as const,
              total_amount: total,
              paid_amount: total,
              outstanding: 0,
              items_count: 1,
              items: [
                {
                  id: h.id,
                  product_id: h.product_id,
                  product_name: h.products?.name || "Product",
                  product_code: "",
                  quantity: qty,
                  buying_price: buyingPrice,
                  total,
                },
              ],
              created_at: h.created_at || new Date().toISOString(),
              received_date: h.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
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
              product_code: item.products?.barcode || "",
              quantity: qty,
              buying_price: price,
              total: qty * price,
            };
          });

          const calculatedTotal = items.reduce((acc, curr) => acc + (curr.total || 0), 0);
          const totalAmount = Number(r.total_amount) || calculatedTotal;
          const paidAmount = Number(r.paid_amount) || 0;
          const status = (r.status as "received" | "pending" | "cancelled") || "pending";

          return {
            id: r.id,
            shop_id: r.shop_id,
            supplier_id: r.supplier_id,
            supplier_name: r.suppliers?.name || null,
            supplier_phone: r.suppliers?.phone || null,
            notes: r.notes,
            status,
            total_amount: totalAmount,
            paid_amount: paidAmount,
            outstanding: Math.max(0, totalAmount - paidAmount),
            items_count: items.length,
            items,
            created_at: r.created_at || new Date().toISOString(),
            received_date: r.received_date || r.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
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
  const { shopId } = useAuth();

  return useMutation({
    mutationFn: async ({
      supplierId,
      items,
      status = "received",
      notes,
      receivedDate,
      paidAmount,
    }: {
      supplierId: string | null;
      items: { productId: string; quantity: number; buyingPrice: number }[];
      status?: "received" | "pending" | "cancelled";
      notes?: string;
      receivedDate?: string;
      paidAmount?: number;
    }) => {
      if (!shopId) throw new Error("Shop ID is required");
      if (!items || items.length === 0) throw new Error("At least one item is required");

      const itemsPayload = items.map((i) => ({
        product_id: i.productId,
        quantity: i.quantity,
        buying_price: i.buyingPrice,
      }));

      // Call RPC
      const { data, error } = await (supabase.rpc as any)("create_purchase_transaction", {
        p_supplier_id: supplierId || null,
        p_items: itemsPayload,
        p_status: status,
        p_notes: notes || null,
        p_received_date: receivedDate || new Date().toISOString().split("T")[0],
        p_paid_amount: paidAmount ?? items.reduce((acc, i) => acc + i.quantity * i.buyingPrice, 0),
      });

      if (error) {
        console.warn("create_purchase_transaction RPC fallback:", error);
        // Fallback: Direct insert
        const total = items.reduce((acc, i) => acc + i.quantity * i.buyingPrice, 0);
        const { data: purchaseRec, error: insertErr } = await supabase
          .from("stock_received")
          .insert({
            shop_id: shopId,
            supplier_id: supplierId || null,
            notes: notes || null,
            status,
            total_amount: total,
            paid_amount: paidAmount ?? total,
            received_date: receivedDate || new Date().toISOString().split("T")[0],
          })
          .select()
          .single();

        if (insertErr) throw insertErr;

        const itemInserts = items.map((i) => ({
          stock_received_id: purchaseRec.id,
          product_id: i.productId,
          quantity: i.quantity,
          buying_price: i.buyingPrice,
        }));

        await supabase.from("stock_received_items").insert(itemInserts);

        // If status is received, increment stock
        if (status === "received") {
          for (const item of items) {
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
                buying_price: item.buyingPrice,
              })
              .eq("id", item.productId);

            await supabase.from("stock_history").insert({
              shop_id: shopId,
              product_id: item.productId,
              quantity_change: item.quantity,
              previous_stock: prevStock,
              new_stock: newStock,
              change_type: "purchase",
              notes: notes || "Purchase received",
            });
          }
        }

        return purchaseRec;
      }

      return data;
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

export function useUpdatePurchase() {
  const queryClient = useQueryClient();
  const { shopId } = useAuth();

  return useMutation({
    mutationFn: async ({
      purchaseId,
      supplierId,
      items,
      status,
      notes,
      paidAmount,
    }: {
      purchaseId: string;
      supplierId?: string | null;
      items?: { productId: string; quantity: number; buyingPrice: number }[];
      status?: "received" | "pending" | "cancelled";
      notes?: string;
      paidAmount?: number;
    }) => {
      if (!shopId) throw new Error("Shop ID is required");

      const itemsPayload = items
        ? items.map((i) => ({
            product_id: i.productId,
            quantity: i.quantity,
            buying_price: i.buyingPrice,
          }))
        : null;

      const { data, error } = await (supabase.rpc as any)("update_purchase_transaction", {
        p_purchase_id: purchaseId,
        p_supplier_id: supplierId || null,
        p_items: itemsPayload,
        p_status: status || null,
        p_notes: notes || null,
        p_paid_amount: paidAmount ?? null,
      });

      if (error) {
        console.warn("update_purchase_transaction RPC fallback:", error);
        // Fallback update
        const updatePayload: any = {};
        if (supplierId !== undefined) updatePayload.supplier_id = supplierId;
        if (status !== undefined) updatePayload.status = status;
        if (notes !== undefined) updatePayload.notes = notes;
        if (paidAmount !== undefined) updatePayload.paid_amount = paidAmount;

        const { error: updateErr } = await supabase
          .from("stock_received")
          .update(updatePayload)
          .eq("id", purchaseId);

        if (updateErr) throw updateErr;
      }

      return data;
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

export function useDeletePurchase() {
  const queryClient = useQueryClient();
  const { shopId } = useAuth();

  return useMutation({
    mutationFn: async (purchaseId: string) => {
      if (!shopId) throw new Error("Shop ID is required");

      const { data, error } = await (supabase.rpc as any)("delete_purchase_transaction", {
        p_purchase_id: purchaseId,
      });

      if (error) {
        console.warn("delete_purchase_transaction RPC fallback:", error);
        // Direct delete fallback
        await supabase.from("stock_received_items").delete().eq("stock_received_id", purchaseId);
        const { error: delErr } = await supabase.from("stock_received").delete().eq("id", purchaseId);
        if (delErr) throw delErr;
      }

      return data;
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
