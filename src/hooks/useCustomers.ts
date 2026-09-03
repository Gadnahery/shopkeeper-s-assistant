import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Customer = Tables<"customers"> & { customer_type?: string };
export type CustomerInsert = TablesInsert<"customers"> & { customer_type?: string };
export type CustomerUpdate = TablesUpdate<"customers"> & { customer_type?: string };

async function getUserShopId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("shop_id").eq("user_id", user.id).maybeSingle();
  return data?.shop_id || null;
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async (): Promise<Customer[]> => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((c) => ({ ...c, customer_type: "Retail" }));
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customer: Partial<CustomerInsert> & { name: string }) => {
      const shopId = customer.shop_id || (await getUserShopId());
      if (!shopId) throw new Error("No shop found");
      const { customer_type, ...cleanCustomer } = customer;
      const final: TablesInsert<"customers"> = {
        name: cleanCustomer.name,
        shop_id: shopId,
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["customers"] }); toast.success("Customer created"); },
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["customers"] }); toast.success("Customer updated"); },
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["customers"] }); toast.success("Customer deleted"); },
    onError: (error) => { toast.error("Failed: " + error.message); },
  });
}
