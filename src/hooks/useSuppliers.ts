import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Supplier = Tables<"suppliers"> & { pending_payment?: number };
export type SupplierInsert = TablesInsert<"suppliers"> & { pending_payment?: number };
export type SupplierUpdate = TablesUpdate<"suppliers"> & { pending_payment?: number };

async function getUserShopId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("shop_id").eq("user_id", user.id).maybeSingle();
  return data?.shop_id || null;
}

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async (): Promise<Supplier[]> => {
      const { data, error } = await supabase.from("suppliers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((s) => ({ ...s, pending_payment: 0 }));
    },
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (supplier: Partial<SupplierInsert> & { name: string }) => {
      const shopId = supplier.shop_id || (await getUserShopId());
      if (!shopId) throw new Error("No shop found");
      const { pending_payment, ...cleanSupplier } = supplier;
      const final: TablesInsert<"suppliers"> = {
        name: cleanSupplier.name,
        shop_id: shopId,
        contact_person: cleanSupplier.contact_person || null,
        phone: cleanSupplier.phone || null,
        email: cleanSupplier.email || null,
        address: cleanSupplier.address || null,
        notes: cleanSupplier.notes || null,
      };
      const { data, error } = await supabase.from("suppliers").insert(final).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Supplier created"); },
    onError: (error) => { toast.error("Failed: " + error.message); },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SupplierUpdate> & { id: string }) => {
      const { pending_payment, ...cleanUpdates } = updates;
      const { data, error } = await supabase.from("suppliers").update(cleanUpdates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Supplier updated"); },
    onError: (error) => { toast.error("Failed: " + error.message); },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Supplier deleted"); },
    onError: (error) => { toast.error("Failed: " + error.message); },
  });
}
