import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createShopNotification } from "@/lib/shopNotifications";

async function getUserShopId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("shop_id").eq("user_id", user.id).maybeSingle();
  return data?.shop_id || null;
}

function isOrdersTableError(e: unknown): boolean {
  const msg = (e as Error)?.message ?? "";
  return /schema cache|table.*orders|relation.*orders/i.test(msg);
}

function isMissingRpcError(e: unknown, fnName: string): boolean {
  const msg = (e as Error)?.message ?? "";
  return msg.toLowerCase().includes(fnName.toLowerCase()) && /function|schema cache|does not exist|could not find/i.test(msg);
}

async function generateLegacyOrderNumber(): Promise<string> {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  try {
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`);
    return `ORD-${date}-${String((count || 0) + 1).padStart(3, "0")}`;
  } catch {
    return `ORD-${date}-${Date.now().toString(36)}`;
  }
}

async function createOrderLegacy(shopId: string, input: { customer_name?: string; customer_phone?: string; status?: string; priority?: string; due_date?: string | null; items: { product_id?: string; product_name: string; quantity: number; unit_price: number }[]; notes?: string }) {
  const orderNumber = await generateLegacyOrderNumber();
  const total = input.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const payload: Record<string, unknown> = {
    shop_id: shopId,
    order_number: orderNumber,
    customer_name: input.customer_name || null,
    customer_phone: input.customer_phone || null,
    status: input.status || "pending",
    total,
    notes: input.notes || null,
  };
  if (input.priority) payload.priority = input.priority;
  if (input.due_date != null) payload.due_date = input.due_date || null;

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert(payload as any)
    .select()
    .single();
  if (orderErr) throw orderErr;

  const items = input.items.map((i) => ({
    order_id: order.id,
    product_id: i.product_id || null,
    quantity: i.quantity,
    unit_price: i.unit_price,
  }));
  const { error: itemsErr } = await supabase.from("order_items").insert(items as any);
  if (itemsErr) throw itemsErr;

  return order;
}

async function updateOrderLegacy(id: string, updates: { status?: string; priority?: string; due_date?: string | null; notes?: string | null }) {
  const payload: Record<string, unknown> = {};
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.due_date !== undefined) payload.due_date = updates.due_date ?? null;
  if (updates.notes !== undefined) payload.notes = updates.notes ?? null;
  if (Object.keys(payload).length === 0) return null;

  const { data: order, error } = await supabase.from("orders").update(payload).eq("id", id).select("*, order_items(*)").single();
  if (error) throw error;

  // If order is completed and no sale is linked yet, record sale
  if (updates.status === "completed" && !(order as any).sale_id && (order as any).order_items?.length) {
    try {
      const items = (order as any).order_items.map((it: any) => ({
        product_id: it.product_id,
        product_name: it.product_name,
        unit_price: Number(it.unit_price) || 0,
        quantity: Number(it.quantity) || 1,
      }));

      let customerName: string | null = null;
      if (order.customer_id) {
        const { data: cust } = await supabase
          .from("customers")
          .select("name")
          .eq("id", order.customer_id)
          .maybeSingle();
        customerName = cust?.name || null;
      }

      const { data: sale } = await (supabase as any).rpc("complete_sale_transaction", {
        p_customer_id: order.customer_id ?? null,
        p_customer_name: customerName,
        p_payment_method: "Cash",
        p_items: items,
      });

      if (sale?.id) {
        await supabase.from("orders").update({ sale_id: sale.id }).eq("id", id);
      }
    } catch (e) {
      console.warn("Could not auto-record sale for completed order:", e);
    }
  }

  return order;
}

async function deleteOrderLegacy(id: string) {
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw error;
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data ?? [];
      } catch (e) {
        if (isOrdersTableError(e)) return [];
        throw e;
      }
    },
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*, order_items(*), order_notes(*)")
          .eq("id", id)
          .single();
        if (error) throw error;
        return data;
      } catch (e) {
        if (isOrdersTableError(e)) return null;
        throw e;
      }
    },
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { customer_name?: string; customer_phone?: string; status?: string; priority?: string; due_date?: string | null; items: { product_id?: string; product_name: string; quantity: number; unit_price: number }[]; notes?: string }) => {
      const shopId = await getUserShopId();
      if (!shopId) throw new Error("No shop found");
      let order: any;
      try {
        const { data, error } = await (supabase as any).rpc("create_order_transaction", {
          p_customer_name: input.customer_name ?? null,
          p_customer_phone: input.customer_phone ?? null,
          p_priority: input.priority ?? "medium",
          p_due_date: input.due_date ?? null,
          p_notes: input.notes ?? null,
          p_items: input.items,
        });
        if (error) throw error;
        order = data;
      } catch (error) {
        if (!isMissingRpcError(error, "create_order_transaction")) throw error;
        order = await createOrderLegacy(shopId, input);
      }
      try {
        await createShopNotification({
          shopId,
          title: "New order created",
          message: `Order ${order.order_number} was created${input.customer_name ? ` for ${input.customer_name}` : ""}.`,
          type: "order",
          url: "/orders",
        });
      } catch {
        // keep order creation successful even if background push delivery fails
      }
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
      let data: any;
      try {
        const result = await (supabase as any).rpc("update_order_transaction", {
          p_order_id: id,
          p_status: status,
          p_priority: null,
          p_due_date: null,
          p_notes: null,
          p_set_due_date: false,
          p_set_notes: false,
        });
        if (result.error) throw result.error;
        data = result.data;
      } catch (error) {
        if (!isMissingRpcError(error, "update_order_transaction")) throw error;
        data = await updateOrderLegacy(id, { status });
      }
      if (data?.shop_id) {
        try {
          await createShopNotification({
            shopId: data.shop_id,
            title: "Order updated",
            message: `Order ${data.order_number} is now ${status}.`,
            type: "order",
            url: "/orders",
          });
        } catch {
          // keep order update successful even if background push delivery fails
        }
      }
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (variables.status === "completed") {
        queryClient.invalidateQueries({ queryKey: ["sales"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        queryClient.invalidateQueries({ queryKey: ["sales", "today"] });
        queryClient.invalidateQueries({ queryKey: ["sales", "summary"] });
        queryClient.invalidateQueries({ queryKey: ["sales", "range"] });
        toast.success("Order completed & recorded into Sales & ERP!");
      } else {
        toast.success("Order updated");
      }
    },
    onError: (e) => toast.error("Failed: " + (e as Error).message),
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; priority?: string; due_date?: string | null; notes?: string | null }) => {
      if (
        updates.status === undefined &&
        updates.priority === undefined &&
        updates.due_date === undefined &&
        updates.notes === undefined
      ) {
        return null;
      }
      try {
        const { data, error } = await (supabase as any).rpc("update_order_transaction", {
          p_order_id: id,
          p_status: updates.status ?? null,
          p_priority: updates.priority ?? null,
          p_due_date: updates.due_date === undefined ? null : updates.due_date,
          p_notes: updates.notes === undefined ? null : updates.notes,
          p_set_due_date: updates.due_date !== undefined,
          p_set_notes: updates.notes !== undefined,
        });
        if (error) throw error;
        return data;
      } catch (error) {
        if (!isMissingRpcError(error, "update_order_transaction")) throw error;
        return updateOrderLegacy(id, updates);
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (variables.status === "completed") {
        queryClient.invalidateQueries({ queryKey: ["sales"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        queryClient.invalidateQueries({ queryKey: ["sales", "today"] });
        queryClient.invalidateQueries({ queryKey: ["sales", "summary"] });
        queryClient.invalidateQueries({ queryKey: ["sales", "range"] });
        toast.success("Order completed & recorded into Sales & ERP!");
      } else {
        toast.success("Order updated");
      }
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
      try {
        const { error } = await (supabase as any).rpc("delete_order_to_recycle_bin", {
          p_order_id: id,
        });
        if (!error) return;
      } catch {}

      try {
        const { error } = await (supabase as any).rpc("delete_order_transaction", {
          p_order_id: id,
        });
        if (error) throw error;
      } catch (error) {
        if (!isMissingRpcError(error, "delete_order_transaction")) throw error;
        await deleteOrderLegacy(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["recycle_bin"] });
      toast.success("Order moved to Recycle Bin (retained for 7 days)");
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
      try {
        const shopId = await getUserShopId();
        if (!shopId) return 0;
        const { count, error } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shopId)
          .eq("status", "pending");
        if (error) throw error;
        return count || 0;
      } catch (e) {
        if (isOrdersTableError(e)) return 0;
        throw e;
      }
    },
  });
}
