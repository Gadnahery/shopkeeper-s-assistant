import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { logAudit } from "@/lib/audit";

export type OtherIncome = Tables<"other_income">;
export type OtherIncomeInsert = TablesInsert<"other_income">;

export function useOtherIncome() {
  return useQuery({
    queryKey: ["other_income"],
    queryFn: async () => {
      const { data, error } = await supabase.from("other_income").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useOtherIncomeByDateRange(startDate: string | null, endDate: string | null) {
  return useQuery({
    queryKey: ["other_income", "range", startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return [];
      const { data, error } = await supabase
        .from("other_income")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useCreateOtherIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (income: OtherIncomeInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in");
      const { data: profile } = await supabase.from("profiles").select("shop_id").eq("user_id", user.id).maybeSingle();
      if (!profile?.shop_id) throw new Error("No business found");
      const { data, error } = await supabase.from("other_income").insert({ ...income, shop_id: profile.shop_id }).select().single();
      if (error) throw error;
      await logAudit({ action: "other_income_created", entityType: "other_income", entityId: data.id, metadata: { amount: data.amount, category: data.category } });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["other_income"] });
      toast.success("Income recorded");
    },
    onError: (error) => toast.error(`Failed: ${error.message}`),
  });
}

export function useUpdateOtherIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<OtherIncomeInsert> }) => {
      const { data, error } = await supabase
        .from("other_income")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await logAudit({
        action: "other_income_updated",
        entityType: "other_income",
        entityId: id,
        metadata: { amount: data.amount, category: data.category },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["other_income"] });
      toast.success("Income updated");
    },
    onError: (error) => toast.error(`Failed to update income: ${error.message}`),
  });
}

export function useDeleteOtherIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("other_income").delete().eq("id", id);
      if (error) throw error;
      await logAudit({ action: "other_income_deleted", entityType: "other_income", entityId: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["other_income"] });
      toast.success("Income deleted");
    },
    onError: (error) => toast.error(`Failed: ${error.message}`),
  });
}