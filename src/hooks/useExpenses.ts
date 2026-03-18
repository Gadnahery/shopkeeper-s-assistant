import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { logAudit } from "@/lib/audit";

export type Expense = Tables<"expenses">;
export type ExpenseInsert = TablesInsert<"expenses">;
export type ExpenseUpdate = TablesUpdate<"expenses">;

async function getUserShopId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("shop_id").eq("user_id", user.id).maybeSingle();
  return data?.shop_id || null;
}

export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useExpenseCategories() {
  return useQuery({
    queryKey: ["expense_categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expense_categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expense: ExpenseInsert) => {
      const final = { ...expense };
      if (!final.shop_id) { final.shop_id = await getUserShopId(); }
      const { data, error } = await supabase.from("expenses").insert(final).select().single();
      if (error) throw error;
      await logAudit({
        action: "expense_created",
        entityType: "expenses",
        entityId: data.id,
        metadata: {
          category: data.category,
          amount: Number(data.amount || 0),
          description: data.description,
        },
      });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["expenses"] }); toast.success("Expense recorded"); },
    onError: (error) => { toast.error("Failed: " + error.message); },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: ExpenseUpdate & { id: string }) => {
      const { data, error } = await supabase.from("expenses").update(updates).eq("id", id).select().single();
      if (error) throw error;
      await logAudit({
        action: "expense_updated",
        entityType: "expenses",
        entityId: data.id,
        metadata: {
          category: data.category,
          amount: Number(data.amount || 0),
          description: data.description,
        },
      });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["expenses"] }); toast.success("Expense updated"); },
    onError: (error) => { toast.error("Failed: " + error.message); },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      await logAudit({
        action: "expense_deleted",
        entityType: "expenses",
        entityId: id,
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["expenses"] }); toast.success("Expense deleted"); },
    onError: (error) => { toast.error("Failed: " + error.message); },
  });
}

export function useExpensesByDateRange(startDate: string | null, endDate: string | null) {
  return useQuery({
    queryKey: ["expenses", "range", startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return [];
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useExpenseStats() {
  return useQuery({
    queryKey: ["expenses", "stats"],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data, error } = await supabase.from("expenses").select("amount, category").gte("date", startOfMonth);
      if (error) throw error;
      const total = data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const byCategory: Record<string, number> = {};
      data?.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount); });
      return { total, byCategory };
    },
  });
}
