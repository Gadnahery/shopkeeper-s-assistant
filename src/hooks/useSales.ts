import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { calculateCashReceived } from "@/lib/financials";

export type Sale = Tables<"sales">;

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
      if (error) throw error;
      return data;
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
      if (error) throw error;
      return data || [];
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
      if (error) throw error;
      return data || [];
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
      if (error) throw error;
      return aggregateSales(data || []);
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
      if (error) throw error;
      
      return aggregateSales(data || []);
    },
    enabled: !!shopId,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  const { shopId } = useAuth();
  
  return useMutation({
    mutationFn: async (input: CreateSaleInput) => {
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
      };

      const { data: sale, error } = await (supabase as any).rpc("complete_sale_transaction", payload);

      if (error) throw error;
      return sale as Sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Sale completed successfully!");
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
      if (error) throw error;
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
