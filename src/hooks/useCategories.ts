import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; name_sw?: string | null; description?: string | null }) => {
      const shopId = await getUserShopId();
      if (!shopId) throw new Error("No shop found");
      const payload: Record<string, unknown> = { name: input.name, name_sw: input.name_sw ?? null, description: input.description ?? null, shop_id: shopId };
      const { data, error } = await supabase
        .from("categories")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created");
    },
    onError: (e) => toast.error("Failed: " + (e as Error).message),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; name_sw?: string | null; description?: string | null }) => {
      const payload: Record<string, unknown> = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.name_sw !== undefined) payload.name_sw = updates.name_sw;
      if (updates.description !== undefined) payload.description = updates.description;
      const { data, error } = await supabase
        .from("categories")
        .update(Object.keys(payload).length ? payload : { name: updates.name, name_sw: updates.name_sw, description: updates.description })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated");
    },
    onError: (e) => toast.error("Failed: " + (e as Error).message),
  });
}

function isCategoryInUseError(e: unknown): boolean {
  const msg = (e as Error)?.message ?? "";
  return msg.includes("products_category_id_fkey") || msg.includes("foreign key constraint");
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
    },
    onError: (e) => {
      if (isCategoryInUseError(e)) {
        toast.error(
          "This category is used by some products. Run the database migration (005_categories_delete_set_null.sql) so that deleting a category will move those products to “No category”."
        );
      } else {
        toast.error("Failed: " + (e as Error).message);
      }
    },
  });
}
