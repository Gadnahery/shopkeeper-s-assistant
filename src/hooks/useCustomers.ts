import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

export type Customer = Tables<"customers"> & { customer_type?: string };
export type CustomerInsert = TablesInsert<"customers"> & { customer_type?: string };
export type CustomerUpdate = TablesUpdate<"customers"> & { customer_type?: string };

export interface CustomerPayment {
  id: string;
  shop_id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  reference?: string | null;
  notes?: string | null;
  recorded_by?: string | null;
  created_at: string;
}

export function useCustomers() {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ["customers", shopId],
    queryFn: async (): Promise<Customer[]> => {
      let query = supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (shopId) {
        query = query.eq("shop_id", shopId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((c) => ({ ...c, customer_type: "Retail" }));
    },
    enabled: !!shopId,
  });
}

export function useCustomerPayments(customerId: string | null) {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ["customer_payments", shopId, customerId],
    queryFn: async (): Promise<CustomerPayment[]> => {
      if (!customerId) return [];
      try {
        let query = (supabase.from("customer_payments" as any) as any)
          .select("*")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false });

        if (shopId) {
          query = query.eq("shop_id", shopId);
        }

        const { data, error } = await query;
        if (error) {
          console.warn("Could not query customer_payments table:", error.message);
          return [];
        }
        return data || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!customerId && !!shopId,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { shopId } = useAuth();

  return useMutation({
    mutationFn: async (customer: Partial<CustomerInsert> & { name: string }) => {
      const activeShopId = customer.shop_id || shopId;
      if (!activeShopId) throw new Error("No shop found");
      const { customer_type, ...cleanCustomer } = customer;
      const final: TablesInsert<"customers"> = {
        name: cleanCustomer.name,
        shop_id: activeShopId,
        phone: cleanCustomer.phone || null,
        email: cleanCustomer.email || null,
        address: cleanCustomer.address || null,
        notes: cleanCustomer.notes || null,
        credit_balance: cleanCustomer.credit_balance || 0,
        credit_limit: cleanCustomer.credit_limit || 0,
        loyalty_points: cleanCustomer.loyalty_points || 0,
        total_spent: cleanCustomer.total_spent || 0,
      };
      const { data, error } = await supabase.from("customers").insert(final).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created");
    },
    onError: (error) => { toast.error("Failed: " + error.message); },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CustomerUpdate> & { id: string }) => {
      const { customer_type, ...cleanUpdates } = updates;
      const { data, error } = await supabase.from("customers").update(cleanUpdates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated");
    },
    onError: (error) => { toast.error("Failed: " + error.message); },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted");
    },
    onError: (error) => { toast.error("Failed: " + error.message); },
  });
}

export function useRecordCustomerPayment() {
  const queryClient = useQueryClient();
  const { shopId } = useAuth();

  return useMutation({
    mutationFn: async ({
      customerId,
      amount,
      paymentMethod = "Cash",
      reference,
      notes,
    }: {
      customerId: string;
      amount: number;
      paymentMethod?: string;
      reference?: string;
      notes?: string;
    }) => {
      if (!shopId) throw new Error("Shop ID is required");
      if (amount <= 0) throw new Error("Payment amount must be greater than zero");

      try {
        const { data, error } = await (supabase as any).rpc("record_customer_payment", {
          p_customer_id: customerId,
          p_amount: amount,
          p_payment_method: paymentMethod,
          p_reference: reference || null,
          p_notes: notes || null,
        });

        if (error) throw error;
        return data;
      } catch (err: any) {
        // Resilient fallback if RPC not yet deployed
        console.warn("RPC record_customer_payment failed, falling back to direct update:", err.message);
        const { data: cust, error: fetchErr } = await supabase
          .from("customers")
          .select("credit_balance")
          .eq("id", customerId)
          .single();
        if (fetchErr) throw fetchErr;

        const currentBal = Number(cust?.credit_balance || 0);
        const newBal = Math.max(0, currentBal - amount);

        const { data: updated, error: updErr } = await supabase
          .from("customers")
          .update({ credit_balance: newBal })
          .eq("id", customerId)
          .select()
          .single();
        if (updErr) throw updErr;

        try {
          await (supabase.from("customer_payments" as any) as any).insert({
            shop_id: shopId,
            customer_id: customerId,
            amount,
            payment_method: paymentMethod,
            reference: reference || null,
            notes: notes || null,
          });
        } catch {
          // ignore if table doesn't exist
        }

        return { new_balance: newBal, amount };
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer_payments", shopId, vars.customerId] });
      toast.success("Payment recorded successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to record payment: " + error.message);
    },
  });
}
