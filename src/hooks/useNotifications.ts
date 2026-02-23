import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export function useNotifications() {
  const { shopId } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!shopId) return;
    const channel = supabase
      .channel(`notifications:${shopId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `shop_id=eq.${shopId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", shopId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, queryClient]);

  const query = useQuery({
    queryKey: ["notifications", shopId],
    queryFn: async () => {
      if (!shopId) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!shopId,
  });

  const unreadCount = query.data?.filter((n) => !n.read_at).length ?? 0;

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!shopId) return;
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("shop_id", shopId)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return { ...query, unreadCount, markAsRead, markAllRead };
}
