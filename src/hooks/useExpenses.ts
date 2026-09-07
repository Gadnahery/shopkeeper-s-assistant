import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { logAudit } from "@/lib/audit";
import { useAuth } from "@/contexts/AuthContext";

export interface Expense extends Omit<Tables<"expenses">, "title"> {
  title?: string;
  description: string;
}

export type ExpenseInsert = Partial<TablesInsert<"expenses">> & {
  amount: number;
  category: string;
  description?: string;
  title?: string;
  shop_id?: string;
  date?: string | null;
  notes?: string | null;
  payment_method?: string | null;
};

export type ExpenseUpdate = Partial<TablesUpdate<"expenses">> & {
  amount?: number;
  category?: string;
  description?: string;
  title?: string;
  date?: string | null;
  notes?: string | null;
  payment_method?: string | null;
};

export function useExpenses() {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ["expenses", shopId],
    queryFn: async () => {
      let query = supabase.from("expenses").select("*").order("date", { ascending: false });
      if (shopId) {
        query = query.eq("shop_id", shopId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((e: any) => ({
        ...e,
        title: e.description || e.title || "",
        description: e.description || e.title || "",
      })) as Expense[];
    },
    enabled: !!shopId,
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
  const { shopId } = useAuth();

  return useMutation({
    mutationFn: async (expense: ExpenseInsert) => {
      const final: any = { ...expense };
      if (!final.shop_id) {
        final.shop_id = shopId;
      }
      const desc = (final.description || final.title || "").trim() || "Expense";
      final.description = desc;
      // Remove 'title' so PostgREST doesn't reject if the column isn't in PostgreSQL schema
      delete final.title;

      const { data, error } = await supabase.from("expenses").insert(final).select().single();
      if (error) throw error;
      const formatted: Expense = {
        ...(data as any),
        title: (data as any).description || (data as any).title || desc,
        description: (data as any).description || (data as any).title || desc,
      };
      await logAudit({
        action: "expense_created",
        entityType: "expenses",
        entityId: formatted.id,
        metadata: {
          category: formatted.category,
          amount: Number(formatted.amount || 0),
          title: formatted.title,
          notes: formatted.notes,
        },
      });
      return formatted;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense recorded");
    },
    onError: (error) => { toast.error("Failed: " + error.message); },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: ExpenseUpdate & { id: string }) => {
      const finalUpdates: any = { ...updates };
      if (finalUpdates.title || finalUpdates.description) {
        finalUpdates.description = (finalUpdates.description || finalUpdates.title || "").trim();
      }
      delete finalUpdates.title;

      const { data, error } = await supabase.from("expenses").update(finalUpdates).eq("id", id).select().single();
      if (error) throw error;
      const formatted: Expense = {
        ...(data as any),
        title: (data as any).description || (data as any).title || "",
        description: (data as any).description || (data as any).title || "",
      };
      await logAudit({
        action: "expense_updated",
        entityType: "expenses",
        entityId: formatted.id,
        metadata: {
          category: formatted.category,
          amount: Number(formatted.amount || 0),
          title: formatted.title,
          notes: formatted.notes,
        },
      });
      return formatted;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense updated");
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense deleted");
    },
    onError: (error) => { toast.error("Failed: " + error.message); },
  });
}

export function useExpensesByDateRange(startDate: string | null, endDate: string | null) {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ["expenses", "range", shopId, startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return [];
      let query = supabase
        .from("expenses")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (shopId) {
        query = query.eq("shop_id", shopId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((e: any) => ({
        ...e,
        title: e.description || e.title || "",
        description: e.description || e.title || "",
      })) as Expense[];
    },
    enabled: !!startDate && !!endDate && !!shopId,
  });
}

export function useExpenseStats() {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ["expenses", "stats", shopId],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      let query = supabase.from("expenses").select("amount, category").gte("date", startOfMonth);
      if (shopId) {
        query = query.eq("shop_id", shopId);
      }
      const { data, error } = await query;
      if (error) throw error;
      const total = data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const byCategory: Record<string, number> = {};
      data?.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount); });
      return { total, byCategory };
    },
    enabled: !!shopId,
  });
}
