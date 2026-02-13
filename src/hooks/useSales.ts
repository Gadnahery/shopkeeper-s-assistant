import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Sale = Tables<"sales">;
export type SaleItem = Tables<"sale_items">;
export type SaleInsert = TablesInsert<"sales">;
export type SaleItemInsert = TablesInsert<"sale_items">;

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
  items: CartItem[];
}

async function getUserShopId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("shop_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.shop_id || null;
}

export function useSales() {
  return useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, customers(name), sale_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSalesByDateRange(startDate: string | null, endDate: string | null) {
  return useQuery({
    queryKey: ["sales", "range", startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return [];
      const { data, error } = await supabase
        .from("sales")
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

export function useTodaySales() {
  return useQuery({
    queryKey: ["sales", "today"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);
      
      if (error) throw error;
      
      const totalSales = data?.reduce((sum, s) => sum + Number(s.total), 0) || 0;
      const cashSales = data?.filter(s => s.payment_method === "Cash").reduce((sum, s) => sum + Number(s.total), 0) || 0;
      const mpesaSales = data?.filter(s => s.payment_method === "M-Pesa").reduce((sum, s) => sum + Number(s.total), 0) || 0;
      
      return {
        total: totalSales,
        count: data?.length || 0,
        cash: cashSales,
        mpesa: mpesaSales,
      };
    },
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateSaleInput) => {
      // Get shop_id first - this is REQUIRED for RLS
      const shopId = await getUserShopId();
      if (!shopId) throw new Error("No shop found for user. Please log out and log in again.");

      // Generate invoice number (unique: timestamp + random to avoid duplicate key)
      const fallbackInv = () => `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const { data: invoiceNum } = await supabase.rpc("generate_invoice_number");
      const invoiceNumber = invoiceNum || fallbackInv();

      const subtotal = input.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
      const discountAmount = input.discount_amount || 0;
      const total = subtotal - discountAmount;

      // Create sale with shop_id
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          invoice_number: invoiceNumber,
          customer_id: input.customer_id,
          customer_name: input.customer_name || null,
          payment_method: input.payment_method,
          mpesa_code: input.mpesa_code,
          subtotal,
          discount_amount: discountAmount,
          discount_percent: input.discount_percent || 0,
          total,
          status: "completed",
          shop_id: shopId,
        })
        .select()
        .single();
      
      if (saleError) throw saleError;
      
      // Create sale items with shop_id
      const saleItems: SaleItemInsert[] = input.items.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id,
        product_name: item.product_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        total: item.unit_price * item.quantity,
        shop_id: shopId,
      }));
      
      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItems);
      
      if (itemsError) throw itemsError;
      
      // Update product stock
      for (const item of input.items) {
        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.product_id)
          .single();
        
        if (product) {
          const newStock = product.stock - item.quantity;
          
          await supabase
            .from("products")
            .update({ stock: newStock })
            .eq("id", item.product_id);
          
          // Record stock history with shop_id
          await supabase
            .from("stock_history")
            .insert({
              product_id: item.product_id,
              change_type: "sale",
              previous_stock: product.stock,
              quantity_change: -item.quantity,
              new_stock: newStock,
              notes: `Sale: ${sale.invoice_number}`,
              shop_id: shopId,
            });
        }
      }
      
      return sale;
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
      const { data, error } = await supabase
        .from("sales")
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
      const shopId = await getUserShopId();
      if (!shopId) throw new Error("No shop found");
      const fallbackInv = () => `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const { data: invoiceNum } = await supabase.rpc("generate_invoice_number");
      const invoiceNumber = invoiceNum || fallbackInv();
      const subtotal = input.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
      const discountAmount = input.discount_amount || 0;
      const total = subtotal - discountAmount;
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          invoice_number: invoiceNumber,
          customer_id: input.customer_id,
          customer_name: input.customer_name || null,
          payment_method: "Cash",
          subtotal,
          discount_amount: discountAmount,
          discount_percent: input.discount_percent || 0,
          total,
          status: "draft",
          shop_id: shopId,
        })
        .select()
        .single();
      if (saleError) throw saleError;
      const saleItems: SaleItemInsert[] = input.items.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id,
        product_name: item.product_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        total: item.unit_price * item.quantity,
        shop_id: shopId,
      }));
      const { error: itemsError } = await supabase.from("sale_items").insert(saleItems);
      if (itemsError) throw itemsError;
      return sale;
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
      const shopId = await getUserShopId();
      if (!shopId) throw new Error("No shop found");
      const { data: sale, error: saleErr } = await supabase.from("sales").select("*, sale_items(*)").eq("id", saleId).single();
      if (saleErr || !sale) throw new Error("Draft not found");
      const items = sale.sale_items || [];
      for (const item of items) {
        const { data: product } = await supabase.from("products").select("stock").eq("id", item.product_id).single();
        if (product) {
          const newStock = product.stock - item.quantity;
          await supabase.from("products").update({ stock: newStock }).eq("id", item.product_id);
          await supabase.from("stock_history").insert({
            product_id: item.product_id,
            change_type: "sale",
            previous_stock: product.stock,
            quantity_change: -item.quantity,
            new_stock: newStock,
            notes: `Sale: ${sale.invoice_number}`,
            shop_id: shopId,
          });
        }
      }
      const { data: updated, error } = await supabase.from("sales").update({ status: "completed" }).eq("id", saleId).select().single();
      if (error) throw error;
      return updated;
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
      await supabase.from("sale_items").delete().eq("sale_id", saleId);
      const { error } = await supabase.from("sales").delete().eq("id", saleId);
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
