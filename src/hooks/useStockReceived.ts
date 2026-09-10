import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StockReceivedItem {
  id: string;
  product_id: string;
  quantity: number;
  buying_price: number | null;
  product?: {
    id: string;
    name: string;
    barcode?: string | null;
    stock: number;
  } | null;
}

export interface StockReceivedRecord {
  id: string;
  shop_id: string;
  supplier_id: string | null;
  notes: string | null;
  status: string;
  total_amount: number;
  paid_amount: number;
  received_date: string | null;
  created_at: string;
  corrected_at?: string | null;
  corrected_by?: string | null;
  supplier?: {
    id: string;
    name: string;
    phone?: string | null;
  } | null;
  items: StockReceivedItem[];
}

export interface CorrectStockReceivedItemInput {
  item_id?: string;
  product_id: string;
  quantity: number;
  buying_price?: number | null;
}

export interface CorrectStockReceivedInput {
  stockReceivedId: string;
  items: CorrectStockReceivedItemInput[];
  notes?: string | null;
  reason?: string | null;
}

export function useStockReceivedList() {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ["stock_received", shopId],
    queryFn: async (): Promise<StockReceivedRecord[]> => {
      if (!shopId) return [];

      const { data, error } = await supabase
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
          corrected_at,
          corrected_by,
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
              barcode,
              stock
            )
          )
        `)
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching stock_received:", error);
        throw error;
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        shop_id: row.shop_id,
        supplier_id: row.supplier_id,
        notes: row.notes,
        status: row.status,
        total_amount: Number(row.total_amount || 0),
        paid_amount: Number(row.paid_amount || 0),
        received_date: row.received_date,
        created_at: row.created_at,
        corrected_at: row.corrected_at,
        corrected_by: row.corrected_by,
        supplier: row.suppliers || null,
        items: (row.stock_received_items || []).map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          quantity: Number(item.quantity || 0),
          buying_price: item.buying_price !== null ? Number(item.buying_price) : null,
          product: item.products || null,
        })),
      }));
    },
    enabled: !!shopId,
  });
}

export function useCorrectStockReceived() {
  const queryClient = useQueryClient();
  const { shopId } = useAuth();

  return useMutation({
    mutationFn: async ({
      stockReceivedId,
      items,
      notes,
      reason,
    }: CorrectStockReceivedInput) => {
      if (!shopId) throw new Error("Shop ID is required");

      const itemsPayload = items.map((i) => ({
        item_id: i.item_id,
        product_id: i.product_id,
        quantity: i.quantity,
        buying_price: i.buying_price ?? null,
      }));

      const { data, error } = await (supabase.rpc as any)("correct_stock_received_transaction", {
        p_stock_received_id: stockReceivedId,
        p_items: itemsPayload,
        p_notes: notes || null,
        p_reason: reason || "Correction of stock received quantity/price",
      });

      if (error) {
        console.error("Failed to correct stock received:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock_received"] });
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock_history"] });
      queryClient.invalidateQueries({ queryKey: ["stock_by_category"] });
    },
  });
}
