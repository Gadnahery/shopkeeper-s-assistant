import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

async function getUserShopId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("shop_id").eq("user_id", user.id).maybeSingle();
  return data?.shop_id || null;
}

async function generateOrderNumber(): Promise<string> {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`);
  return `ORD-${date}-${String((count || 0) + 1).padStart(3, "0")}`;
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), order_notes(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { customer_name?: string; customer_phone?: string; items: { product_id?: string; product_name: string; quantity: number; unit_price: number }[]; notes?: string }) => {
      const shopId = await getUserShopId();
      if (!shopId) throw new Error("No shop found");
      const orderNumber = await generateOrderNumber();
      const total = input.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({ shop_id: shopId, order_number: orderNumber, customer_name: input.customer_name || null, customer_phone: input.customer_phone || null, status: "pending", total, notes: input.notes || null })
        .select()
        .single();
      if (orderErr) throw orderErr;
      const items = input.items.map((i) => ({ order_id: order.id, product_id: i.product_id || null, product_name: i.product_name, quantity: i.quantity, unit_price: i.unit_price, total: i.quantity * i.unit_price }));
      const { error: itemsErr } = await supabase.from("order_items").insert(items);
      if (itemsErr) throw itemsErr;
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order created");
    },
    onError: (e) => toast.error("Failed: " + (e as Error).message),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase.from("orders").update({ status }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order updated");
    },
    onError: (e) => toast.error("Failed: " + (e as Error).message),
  });
}

export function useAddOrderNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ order_id, note }: { order_id: string; note: string }) => {
      const { data, error } = await supabase.from("order_notes").insert({ order_id, note }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ["orders", v.order_id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Note added");
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order deleted");
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const shopId = await getUserShopId();
      if (!shopId) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });
}

export function usePendingOrdersCount() {
  return useQuery({
    queryKey: ["orders", "pending-count"],
    queryFn: async () => {
      const shopId = await getUserShopId();
      if (!shopId) return 0;
      const { count, error } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shopId)
        .eq("status", "pending");
      if (error) throw error;
      return count || 0;
    },
  });
}
