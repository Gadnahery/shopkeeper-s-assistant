import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { calculateCashReceived } from "@/lib/financials";
import { syncManager } from "@/lib/syncManager";
import type { OptimisticSaleRecord } from "@/lib/db";

export type Sale = Tables<"sales"> & {
  is_offline_pending?: boolean;
  sync_status?: "pending" | "syncing" | "failed";
  sync_error?: string;
};

interface CartItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
}

export interface CreateSaleInput {
  customer_id?: string | null;
  customer_name?: string | null;
  payment_method: string;
  mpesa_code?: string | null;
  discount_amount?: number;
  discount_percent?: number;
  tax_amount?: number;
  items: CartItem[];
  cash_amount?: number;
  mpesa_amount?: number;
}

async function mergeOfflineSales(serverSales: any[], shopId?: string | null): Promise<any[]> {
  try {
    const pending = await syncManager.getPendingActions(shopId);
    const offlineRecords = pending
      .filter((p) => p.type === "complete_sale" && p.optimisticRecord)
      .map((p) => ({
        ...p.optimisticRecord,
        sync_status: p.status,
        sync_error: p.errorMessage,
      }));

    if (offlineRecords.length === 0) return serverSales;

    const serverIds = new Set(serverSales.map((s) => s.id));
    const serverIdempotencyKeys = new Set(serverSales.map((s) => (s as any).idempotency_key).filter(Boolean));
    const serverInvoices = new Set(serverSales.map((s) => s.invoice_number));

    const uniqueOffline = offlineRecords.filter(
      (off) => !serverIds.has(off.id) && !serverIdempotencyKeys.has(off.id) && !serverInvoices.has(off.invoice_number)
    );

    const merged = [...uniqueOffline, ...serverSales];
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return merged;
  } catch {
    return serverSales;
  }
}

export function useSales() {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ["sales", shopId],
    queryFn: async () => {
      let query = (supabase.from("sales" as any) as any)
        .select("*, customers(name), sale_items(*)")
        .order("created_at", { ascending: false });

      if (shopId) {
        query = query.eq("shop_id", shopId);
      }

      const { data, error } = await query;
      if (error) {
        if (syncManager.isNetworkError(error)) {
          // If offline and query fails, fallback to cached offline actions
          return await mergeOfflineSales([], shopId);
        }
        throw error;
      }
      return await mergeOfflineSales(data || [], shopId);
    },
    enabled: !!shopId,
  });
}

export function useSalesByCustomer(customerId: string | null) {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ["sales", "customer", shopId, customerId],
    queryFn: async () => {
      if (!customerId) return [];
      let query = (supabase.from("sales" as any) as any)
        .select("*, sale_items(*)")
        .eq("customer_id", customerId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(20);

      if (shopId) {
        query = query.eq("shop_id", shopId);
      }

      const { data, error } = await query;
      if (error) {
        if (syncManager.isNetworkError(error)) {
          const allMerged = await mergeOfflineSales([], shopId);
          return allMerged.filter((s) => s.customer_id === customerId);
        }
        throw error;
      }
      const merged = await mergeOfflineSales(data || [], shopId);
      return merged.filter((s) => s.customer_id === customerId);
    },
    enabled: !!customerId && !!shopId,
  });
}

export function useSalesByDateRange(startDate: string | null, endDate: string | null) {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ["sales", "range", shopId, startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return [];
      let query = (supabase.from("sales" as any) as any)
        .select("*, customers(name), sale_items(*)")
        .eq("status", "completed")
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: false });

      if (shopId) {
        query = query.eq("shop_id", shopId);
      }

      const { data, error } = await query;
      if (error) {
        if (syncManager.isNetworkError(error)) {
          const allMerged = await mergeOfflineSales([], shopId);
          return allMerged.filter((s) => {
            const d = (s.created_at || "").slice(0, 10);
            return d >= startDate && d <= endDate;
          });
        }
        throw error;
      }
      const merged = await mergeOfflineSales(data || [], shopId);
      return merged.filter((s) => {
        const d = (s.created_at || "").slice(0, 10);
        return d >= startDate && d <= endDate;
      });
    },
    enabled: !!startDate && !!endDate && !!shopId,
  });
}

function aggregateSales(data: any[]) {
  const total = data?.reduce((sum, s) => sum + Number(s.total || 0), 0) || 0;
  const cash = data?.reduce((sum, s) => {
    const method = String(s.payment_method || "").toLowerCase();
    if (method === "cash") return sum + Number(s.total || 0);
    if (method === "split") return sum + Number(s.cash_amount || 0);
    return sum;
  }, 0) || 0;
  const mpesa = data?.reduce((sum, s) => {
    const method = String(s.payment_method || "").toLowerCase();
    if (method === "m-pesa" || method === "mpesa") return sum + Number(s.total || 0);
    if (method === "split") return sum + Number(s.mpesa_amount || 0);
    return sum;
  }, 0) || 0;
  const cashReceived = calculateCashReceived(data);
  return { total, count: data?.length || 0, cash, mpesa, cashReceived };
}

export function useSalesSummaryByRange(start: string, end: string) {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ["sales", "summary", shopId, start, end],
    queryFn: async () => {
      let query = (supabase.from("sales" as any) as any)
        .select("*")
        .eq("status", "completed")
        .gte("created_at", `${start}T00:00:00`)
        .lte("created_at", `${end}T23:59:59`);

      if (shopId) {
        query = query.eq("shop_id", shopId);
      }

      const { data, error } = await query;
      if (error && !syncManager.isNetworkError(error)) throw error;
      const merged = await mergeOfflineSales(data || [], shopId);
      const filtered = merged.filter((s) => {
        const d = (s.created_at || "").slice(0, 10);
        return d >= start && d <= end;
      });
      return aggregateSales(filtered);
    },
    enabled: !!start && !!end && !!shopId,
  });
}

export function useTodaySales() {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ["sales", "today", shopId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      let query = (supabase.from("sales" as any) as any)
        .select("*")
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);

      if (shopId) {
        query = query.eq("shop_id", shopId);
      }

      const { data, error } = await query;
      if (error && !syncManager.isNetworkError(error)) throw error;
      const merged = await mergeOfflineSales(data || [], shopId);
      const filtered = merged.filter((s) => {
        const d = (s.created_at || "").slice(0, 10);
        return d === today;
      });
      return aggregateSales(filtered);
    },
    enabled: !!shopId,
  });
}

/**
 * Optimistically deduct stock in React Query cache
 */
function applyOptimisticStockDeduction(queryClient: ReturnType<typeof useQueryClient>, items: CartItem[]) {
  const stockDeltas = new Map<string, number>();
  for (const it of items) {
    stockDeltas.set(it.product_id, (stockDeltas.get(it.product_id) || 0) + it.quantity);
  }

  queryClient.setQueriesData({ queryKey: ["products"] }, (oldProducts: any[] | undefined) => {
    if (!oldProducts || !Array.isArray(oldProducts)) return oldProducts;
    return oldProducts.map((p) => {
      const delta = stockDeltas.get(p.id);
      if (delta && p.track_inventory !== false && p.item_type !== "service") {
        return {
          ...p,
          stock: Math.max(0, (Number(p.stock) || 0) - delta),
        };
      }
      return p;
    });
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  const { shopId } = useAuth();
  
  return useMutation({
    mutationFn: async (input: CreateSaleInput): Promise<Sale> => {
      const idempotencyKey = crypto.randomUUID();

      // If already offline, bypass live network call immediately to provide instant response
      if (!syncManager.isOnline()) {
        const offlineRecord = await syncManager.queueSaleAction(input, shopId, idempotencyKey);
        applyOptimisticStockDeduction(queryClient, input.items);
        return offlineRecord as unknown as Sale;
      }

      const payload: any = {
        p_customer_id: input.customer_id ?? null,
        p_customer_name: input.customer_name ?? null,
        p_payment_method: input.payment_method,
        p_mpesa_code: input.mpesa_code ?? null,
        p_discount_amount: input.discount_amount || 0,
        p_discount_percent: input.discount_percent || 0,
        p_tax_amount: input.tax_amount || 0,
        p_items: input.items,
        p_cash_amount: input.cash_amount ?? null,
        p_mpesa_amount: input.mpesa_amount ?? null,
        p_idempotency_key: idempotencyKey,
      };

      try {
        // Execute with a 4.5-second network timeout
        const rpcPromise = (supabase as any).rpc("complete_sale_transaction", payload);
        const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
          setTimeout(() => reject(new Error("Network timeout: Sale took too long to complete")), 4500)
        );

        const { data: sale, error } = await Promise.race([rpcPromise, timeoutPromise]);

        if (error) {
          if (syncManager.isNetworkError(error)) {
            // Fallback to offline queue on network error
            const offlineRecord = await syncManager.queueSaleAction(input, shopId, idempotencyKey);
            applyOptimisticStockDeduction(queryClient, input.items);
            return offlineRecord as unknown as Sale;
          }
          throw error;
        }

        return sale as Sale;
      } catch (err: any) {
        if (syncManager.isNetworkError(err)) {
          // Fallback to offline queue on timeout or fetch failure
          const offlineRecord = await syncManager.queueSaleAction(input, shopId, idempotencyKey);
          applyOptimisticStockDeduction(queryClient, input.items);
          return offlineRecord as unknown as Sale;
        }
        throw err;
      }
    },
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["sales", "today"] });
      queryClient.invalidateQueries({ queryKey: ["sales", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["sales", "range"] });

      if (sale.is_offline_pending) {
        toast.info("Saved Offline (Queued for Sync)", {
          description: `Sale ${sale.invoice_number} will automatically sync when connection returns.`,
          duration: 5000,
        });
      } else {
        toast.success("Sale completed successfully!");
      }
    },
    onError: (error) => {
      toast.error("Failed to complete sale: " + error.message);
    },
  });
}

export function useDraftSales() {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ["sales", "drafts", shopId],
    queryFn: async () => {
      let query = (supabase.from("sales" as any) as any)
        .select("*, sale_items(*)")
        .eq("status", "draft")
        .order("created_at", { ascending: false });

      if (shopId) {
        query = query.eq("shop_id", shopId);
      }

      const { data, error } = await query;
      if (error) {
        if (syncManager.isNetworkError(error)) return [];
        throw error;
      }
      return data || [];
    },
    enabled: !!shopId,
  });
}

export function useSaveDraftSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSaleInput) => {
      const { data, error } = await (supabase as any).rpc("save_draft_sale_transaction", {
        p_customer_id: input.customer_id ?? null,
        p_customer_name: input.customer_name ?? null,
        p_discount_amount: input.discount_amount || 0,
        p_discount_percent: input.discount_percent || 0,
        p_tax_amount: input.tax_amount || 0,
        p_items: input.items,
      });

      if (error) throw error;
      return data as Sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sales", "drafts"] });
      toast.success("Draft saved");
    },
    onError: (e) => toast.error("Failed: " + (e as Error).message),
  });
}

export function useCompleteDraftSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (saleId: string) => {
      const { data, error } = await (supabase as any).rpc("complete_draft_sale_transaction", {
        p_sale_id: saleId,
      });

      if (error) throw error;
      return data as Sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sales", "drafts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Sale completed");
    },
    onError: (e) => toast.error("Failed: " + (e as Error).message),
  });
}

export function useDeleteDraftSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (saleId: string) => {
      const { error } = await (supabase as any).rpc("delete_draft_sale_transaction", {
        p_sale_id: saleId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sales", "drafts"] });
      toast.success("Draft deleted");
    },
    onError: (e) => toast.error("Failed: " + (e as Error).message),
  });
}
