import { useMemo } from "react";
import { useSalesByDateRange } from "@/hooks/useSales";
import { useExpensesByDateRange } from "@/hooks/useExpenses";
import { useProducts } from "@/hooks/useProducts";

export function usePnLReport(start: string | null, end: string | null) {
  const { data: sales = [], isLoading: salesLoading } = useSalesByDateRange(start, end);
  const { data: expenses = [], isLoading: expensesLoading } = useExpensesByDateRange(start, end);

  const report = useMemo(() => {
    const revenue = sales.reduce((sum, s: any) => sum + Number(s.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, e: any) => sum + Number(e.amount || 0), 0);
    // Placeholder COGS estimate if buying_price_at_sale is not available in joined rows.
    const estimatedCogs = sales.reduce((sum, s: any) => {
      const items = Array.isArray(s.sale_items) ? s.sale_items : [];
      return sum + items.reduce((acc: number, it: any) => acc + Number(it.buying_price_at_sale || 0) * Number(it.quantity || 0), 0);
    }, 0);
    const grossProfit = revenue - estimatedCogs;
    const netProfit = grossProfit - totalExpenses;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    return { revenue, totalExpenses, estimatedCogs, grossProfit, netProfit, netMargin };
  }, [sales, expenses]);

  return { ...report, isLoading: salesLoading || expensesLoading };
}

export function useInventoryValueReport() {
  const { data: products = [], isLoading } = useProducts();
  const report = useMemo(() => {
    const stockValue = products.reduce((sum, p) => sum + Number(p.stock || 0) * Number(p.buying_price || 0), 0);
    const retailValue = products.reduce((sum, p) => sum + Number(p.stock || 0) * Number(p.selling_price || 0), 0);
    const potentialProfit = retailValue - stockValue;
    return { stockValue, retailValue, potentialProfit };
  }, [products]);
  return { ...report, isLoading };
}
