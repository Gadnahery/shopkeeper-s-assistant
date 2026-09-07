import { useMemo } from "react";
import { useSalesByDateRange } from "@/hooks/useSales";
import { useExpensesByDateRange } from "@/hooks/useExpenses";
import { useOtherIncomeByDateRange } from "@/hooks/useOtherIncome";
import { useProducts } from "@/hooks/useProducts";
import { calculatePnL, type FinancialPnL } from "@/lib/financials";

export function usePnLReport(start: string | null, end: string | null) {
  const { data: sales = [], isLoading: salesLoading } = useSalesByDateRange(start, end);
  const { data: expenses = [], isLoading: expensesLoading } = useExpensesByDateRange(start, end);
  const { data: otherIncome = [], isLoading: otherIncomeLoading } = useOtherIncomeByDateRange(start, end);

  const report = useMemo<FinancialPnL>(() => {
    return calculatePnL(sales || [], expenses || [], otherIncome || []);
  }, [sales, expenses, otherIncome]);

  return { ...report, isLoading: salesLoading || expensesLoading || otherIncomeLoading };
}

export function useInventoryValueReport() {
  const { data: products = [], isLoading } = useProducts();
  const report = useMemo(() => {
    const stockValue = (products || []).reduce((sum, p) => sum + Number(p.stock || 0) * Number(p.buying_price || 0), 0);
    const retailValue = (products || []).reduce((sum, p) => sum + Number(p.stock || 0) * Number(p.selling_price || 0), 0);
    const potentialProfit = retailValue - stockValue;
    return { stockValue, retailValue, potentialProfit };
  }, [products]);
  return { ...report, isLoading };
}
