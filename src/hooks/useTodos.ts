import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

function isTodosTableError(e: unknown): boolean {
  const msg = (e as Error)?.message ?? "";
  return /schema cache|table.*todos|relation.*todos/i.test(msg);
}

export function useTodos() {
  const { shopId } = useAuth();
  return useQuery({
    queryKey: ["todos", shopId],
    queryFn: async () => {
      try {
        if (!shopId) return [];
        const { data, error } = await supabase
          .from("todos")
          .select("*")
          .eq("shop_id", shopId)
          .order("due_date", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data ?? [];
      } catch (e) {
        if (isTodosTableError(e)) return [];
        throw e;
      }
    },
    enabled: !!shopId,
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  const { shopId } = useAuth();
  return useMutation({
    mutationFn: async (input: { title: string; description?: string; due_date?: string; due_time?: string; alert_at?: string }) => {
      if (!shopId) throw new Error("No shop found");
      const { data, error } = await supabase
        .from("todos")
        .insert({
          shop_id: shopId,
          title: input.title,
          description: input.description || null,
          due_date: input.due_date || null,
          due_time: input.due_time || null,
          alert_at: input.alert_at || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      toast.success("To-do added");
    },
    onError: (e) => toast.error("Failed: " + (e as Error).message),
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; description?: string; due_date?: string | null; due_time?: string | null; alert_at?: string | null; completed?: boolean }) => {
      const { data, error } = await supabase.from("todos").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      toast.success("To-do updated");
    },
    onError: (e) => toast.error("Failed: " + (e as Error).message),
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("todos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      toast.success("To-do deleted");
    },
    onError: (e) => toast.error("Failed: " + (e as Error).message),
  });
}
