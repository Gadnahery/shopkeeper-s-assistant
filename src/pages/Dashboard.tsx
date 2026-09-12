import { useState, useMemo } from "react";
import { format, subDays, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSales } from "@/hooks/useSales";
import { useProducts, useLowStockProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { useOrders } from "@/hooks/useOrders";
import { usePurchases } from "@/hooks/usePurchases";
import { useExpenses } from "@/hooks/useExpenses";
import { useOtherIncome } from "@/hooks/useOtherIncome";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { calculatePnL, calculateCashReceived } from "@/lib/financials";
import { toLocalDayString, isTimestampInLocalDayRange } from "@/lib/dateUtils";

import {
  DashboardGreeting,
  type DashboardPeriod,
} from "@/components/dashboard/DashboardGreeting";
import {
  DashboardKpis,
  DashboardKpiSkeleton,
} from "@/components/dashboard/DashboardKpis";
import { NeedsAttention } from "@/components/dashboard/NeedsAttention";
import { SalesPerformanceChart } from "@/components/dashboard/SalesPerformanceChart";
import { TopSellingProducts } from "@/components/dashboard/TopSellingProducts";
import { RecentSalesList } from "@/components/dashboard/RecentSalesList";

function getPeriodDates(period: Exclude<DashboardPeriod, "custom">): { start: string; end: string } {
  const now = new Date();
  const end = format(now, "yyyy-MM-dd");
  switch (period) {
    case "today":
      return { start: end, end };
    case "week":
      return { start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"), end };
    case "month":
      return { start: format(startOfMonth(now), "yyyy-MM-dd"), end };
    case "year":
      return { start: format(startOfYear(now), "yyyy-MM-dd"), end };
    case "all":
      return { start: "1970-01-01", end };
  }
}

export default function Dashboard() {
  const { language } = useLanguage();
  const { formatMoney } = useShopFormatting();
  const { profile, user } = useAuth();

  const [period, setPeriod] = useState<DashboardPeriod>("today");
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});

  const shopName = profile?.shops?.name || "WiseCash";
  const userName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "";

  // Active period date boundaries
  const { start: periodStart, end: periodEnd } = useMemo(() => {
    if (period === "custom") {
      const s = customRange.from ? format(customRange.from, "yyyy-MM-dd") : "1970-01-01";
      const e = customRange.to ? format(customRange.to, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
      return { start: s, end: e };
    }
    return getPeriodDates(period as Exclude<DashboardPeriod, "custom">);
  }, [period, customRange]);

  // Ensure sales query fetches enough history for comparisons and charts
  const sevenDaysAgoStr = useMemo(() => format(subDays(new Date(), 7), "yyyy-MM-dd"), []);
  const salesQueryOptions = useMemo(() => {
    if (period === "all" || period === "year") {
      return { limit: 1000 };
    }
    const earliestStart = periodStart < sevenDaysAgoStr ? periodStart : sevenDaysAgoStr;
    return {
      startDate: earliestStart,
      endDate: periodEnd,
    };
  }, [period, periodStart, periodEnd, sevenDaysAgoStr]);

  // Core Data Queries (All scoped by authenticated shop via Supabase RLS)
  const { data: allSales, isLoading: salesLoading } = useSales(salesQueryOptions);
  const { data: allProducts, isLoading: productsLoading } = useProducts();
  const { data: lowStockProducts, isLoading: lowStockLoading } = useLowStockProducts();
  const { data: customersList, isLoading: customersLoading } = useCustomers();
  const { data: ordersList } = useOrders();
  const { data: purchasesList } = usePurchases();
  const { data: expensesList } = useExpenses();
  const { data: otherIncomeList } = useOtherIncome();

  const isDateInPeriod = (dateStr?: string | null) => {
    if (!dateStr) return false;
    if (period === "all") return true;
    return isTimestampInLocalDayRange(dateStr, periodStart, periodEnd);
  };

  // Filter items for the active selected period
  const periodSales = useMemo(() => {
    return (allSales || []).filter(
      (s) => s.status === "completed" && isDateInPeriod(s.created_at)
    );
  }, [allSales, periodStart, periodEnd, period]);

  const periodExpenses = useMemo(() => {
    return (expensesList || []).filter((e) => isDateInPeriod(e.date || e.created_at));
  }, [expensesList, periodStart, periodEnd, period]);

  const periodOtherIncome = useMemo(() => {
    return (otherIncomeList || []).filter((i) => isDateInPeriod(i.date || i.created_at));
  }, [otherIncomeList, periodStart, periodEnd, period]);

  // Single source of truth financial calculations
  const pnl = useMemo(() => {
    return calculatePnL(periodSales, periodExpenses, periodOtherIncome);
  }, [periodSales, periodExpenses, periodOtherIncome]);

  const cashReceivedVal = useMemo(() => {
    return calculateCashReceived(periodSales);
  }, [periodSales]);

  // Previous period comparison for Sales growth
  const salesGrowthPercent = useMemo(() => {
    if (period === "today") {
      const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");
      const yesterdaySales = (allSales || []).filter(
        (s) => s.status === "completed" && toLocalDayString(s.created_at) === yesterdayStr
      );
      const yesterdayTotal = yesterdaySales.reduce((sum, s) => sum + Number(s.total || 0), 0);
      if (yesterdayTotal === 0) return null;
      return Math.round(((pnl.grossSales - yesterdayTotal) / yesterdayTotal) * 100);
    }
    return null;
  }, [period, allSales, pnl.grossSales]);

  // Cost data verification: check if physical products were sold without recorded cost
  const hasPhysicalItemsSoldWithoutCost = useMemo(() => {
    for (const sale of periodSales) {
      const items = Array.isArray(sale.sale_items) ? sale.sale_items : [];
      for (const item of items) {
        const isPhysical = item.item_type !== "service";
        const unitCost = Number(item.buying_price_at_sale ?? 0);
        if (isPhysical && unitCost === 0) {
          return true;
        }
      }
    }
    return false;
  }, [periodSales]);

  // Actionable exceptions for Needs Attention
  const outOfStockCount = useMemo(() => {
    return (allProducts || []).filter(
      (p) => p.track_inventory !== false && p.item_type !== "service" && Number(p.stock) <= 0
    ).length;
  }, [allProducts]);

  const lowStockCount = useMemo(() => {
    return (lowStockProducts || []).length;
  }, [lowStockProducts]);

  const customerDebtTotal = useMemo(() => {
    return (customersList || []).reduce(
      (sum, c) => sum + (Number(c.credit_balance) || 0),
      0
    );
  }, [customersList]);

  const debtorsCount = useMemo(() => {
    return (customersList || []).filter((c) => Number(c.credit_balance) > 0).length;
  }, [customersList]);

  const pendingOrdersCount = useMemo(() => {
    return (ordersList || []).filter(
      (o: any) => o.status === "pending" || o.status === "processing"
    ).length;
  }, [ordersList]);

  const pendingPurchasesCount = useMemo(() => {
    return (purchasesList || []).filter((p) => p.status === "pending").length;
  }, [purchasesList]);

  const isInitialLoading = salesLoading && productsLoading;

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Executive Header & Contextual Greeting */}
      <DashboardGreeting
        userName={userName}
        shopName={shopName}
        language={language}
        period={period}
        onPeriodChange={setPeriod}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
      />

      {/* 2. Primary 3 KPI Cards: Sales, Profit, Cash Received */}
      {isInitialLoading ? (
        <DashboardKpiSkeleton />
      ) : (
        <DashboardKpis
          period={period}
          language={language}
          formatMoney={formatMoney}
          totalSales={pnl.grossSales}
          orderCount={periodSales.length}
          netProfit={pnl.netProfit}
          grossProfit={pnl.grossProfit}
          cogs={pnl.cogs}
          revenue={pnl.revenue}
          totalExpenses={pnl.totalExpenses}
          cashReceived={cashReceivedVal}
          hasPhysicalItemsSoldWithoutCost={hasPhysicalItemsSoldWithoutCost}
          salesGrowthPercent={salesGrowthPercent}
          isLoading={salesLoading}
        />
      )}

      {/* 3. Needs Attention Section (Actionable exceptions only) */}
      <NeedsAttention
        language={language}
        formatMoney={formatMoney}
        outOfStockCount={outOfStockCount}
        lowStockCount={lowStockCount}
        customerDebtTotal={customerDebtTotal}
        debtorsCount={debtorsCount}
        pendingOrdersCount={pendingOrdersCount}
        pendingPurchasesCount={pendingPurchasesCount}
      />

      {/* 4. Sales Performance Chart & Top Selling Products (2-col on desktop, stacked on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        <div className="lg:col-span-2">
          <SalesPerformanceChart
            period={period}
            language={language}
            formatMoney={formatMoney}
            allSales={allSales || []}
            expensesList={expensesList || []}
            otherIncomeList={otherIncomeList || []}
            periodSales={periodSales}
            periodStart={periodStart}
            periodEnd={periodEnd}
            isLoading={salesLoading}
          />
        </div>

        <div className="lg:col-span-1">
          <TopSellingProducts
            periodSales={periodSales}
            language={language}
            formatMoney={formatMoney}
          />
        </div>
      </div>

      {/* 5. Recent Sales Stream (Full-width footer) */}
      <RecentSalesList
        sales={periodSales.length > 0 ? periodSales : allSales || []}
        language={language}
        formatMoney={formatMoney}
      />
    </div>
  );
}
