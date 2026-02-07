import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

/** Hook to get weekly sales trend from real data */
export function useWeeklySalesTrend() {
  return useQuery({
    queryKey: ["sales", "weekly-trend"],
    queryFn: async () => {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 6);
      
      const { data, error } = await supabase
        .from("sales")
        .select("total, created_at")
        .gte("created_at", weekAgo.toISOString());
      
      if (error) throw error;
      
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const salesByDay: Record<string, number> = {};
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekAgo);
        d.setDate(d.getDate() + i);
        salesByDay[days[d.getDay()]] = 0;
      }
      
      data?.forEach(sale => {
        const day = days[new Date(sale.created_at).getDay()];
        salesByDay[day] = (salesByDay[day] || 0) + Number(sale.total);
      });
      
      return Object.entries(salesByDay).map(([day, sales]) => ({ day, sales }));
    },
  });
}

/** Hook to get stock by category from real data */
export function useStockByCategory() {
  return useQuery({
    queryKey: ["products", "by-category"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("stock, categories(name)");
      
      if (error) throw error;
      
      const categories: Record<string, number> = {};
      data?.forEach(p => {
        const catName = (p.categories as any)?.name || "Uncategorized";
        categories[catName] = (categories[catName] || 0) + p.stock;
      });
      
      const colors = [
        "hsl(160, 65%, 50%)",
        "hsl(36, 100%, 50%)",
        "hsl(220, 65%, 55%)",
        "hsl(340, 65%, 50%)",
        "hsl(280, 65%, 50%)",
        "hsl(220, 14%, 80%)",
      ];
      
      return Object.entries(categories).map(([name, value], i) => ({
        name,
        value,
        color: colors[i % colors.length],
      }));
    },
  });
}

/** Hook to get recent sales for dashboard */
export function useRecentSales(limit = 5) {
  return useQuery({
    queryKey: ["sales", "recent", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, customers(name), sale_items(*)")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}
