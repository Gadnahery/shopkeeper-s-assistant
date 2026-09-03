import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type Sale = Tables<"sales">;

interface CartItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
}

interface CreateSaleInput {
  customer_id?: string | null;
  customer_name?: string | null;
  payment_method: string;
  mpesa_code?: string | null;
  discount_amount?: number;
  discount_percent?: number;
  tax_amount?: number;
  items: CartItem[];
}

export function useSales() {
  return useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("sales" as any) as any)
        .select("*, customers(name), sale_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSalesByCustomer(customerId: string | null) {
  return useQuery({
    queryKey: ["sales", "customer", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const { data, error } = await (supabase.from("sales" as any) as any)
        .select("*, sale_items(*)")
        .eq("customer_id", customerId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
  });
}

export function useSalesByDateRange(startDate: string | null, endDate: string | null) {
  return useQuery({
    queryKey: ["sales", "range", startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return [];
      const { data, error } = await (supabase.from("sales" as any) as any)
        .select("*, customers(name), sale_items(*)")
        .eq("status", "completed")
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!startDate && !!endDate,
  });
}

function aggregateSales(data: any[]) {
  const total = data?.reduce((sum, s) => sum + Number(s.total || 0), 0) || 0;
  const cash = data?.filter((s) => s.payment_method === "Cash").reduce((sum, s) => sum + Number(s.total || 0), 0) || 0;
  const mpesa = data?.filter((s) => s.payment_method === "M-Pesa").reduce((sum, s) => sum + Number(s.total || 0), 0) || 0;
  return { total, count: data?.length || 0, cash, mpesa };
}

export function useSalesSummaryByRange(start: string, end: string) {
  return useQuery({
    queryKey: ["sales", "summary", start, end],
    queryFn: async () => {
      const { data, error } = await (supabase.from("sales" as any) as any)
        .select("*")
        .eq("status", "completed")
        .gte("created_at", `${start}T00:00:00`)
        .lte("created_at", `${end}T23:59:59`);
      if (error) throw error;
      return aggregateSales(data || []);
    },
    enabled: !!start && !!end,
  });
}

export function useTodaySales() {
  return useQuery({
    queryKey: ["sales", "today"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await (supabase.from("sales" as any) as any)
        .select("*")
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);
      
      if (error) throw error;
      
      return aggregateSales(data || []);
    },
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateSaleInput) => {
      const { data: sale, error } = await (supabase as any).rpc("complete_sale_transaction", {
        p_customer_id: input.customer_id ?? null,
        p_customer_name: input.customer_name ?? null,
        p_payment_method: input.payment_method,
        p_mpesa_code: input.mpesa_code ?? null,
        p_discount_amount: input.discount_amount || 0,
        p_discount_percent: input.discount_percent || 0,
        p_tax_amount: input.tax_amount || 0,
        p_items: input.items,
      });

      if (error) throw error;
      return sale as Sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Sale completed successfully!");
    },
    onError: (error) => {
      toast.error("Failed to complete sale: " + error.message);
    },
  });
}

export function useDraftSales() {
  return useQuery({
    queryKey: ["sales", "drafts"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("sales" as any) as any)
        .select("*, sale_items(*)")
        .eq("status", "draft")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
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
