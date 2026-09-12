import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import {
  ShoppingBag,
  Package,
  Users,
  Receipt,
  Plus,
  CalendarDays,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
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
  DASHBOARD_PERIOD_LABELS,
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
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatMoney } = useShopFormatting();
  const { profile, user } = useAuth();

  const [period, setPeriod] = useState<DashboardPeriod>("today");
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"activity" | "trends" | "alerts">("activity");

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
  const { data: lowStockProducts } = useLowStockProducts();
  const { data: customersList } = useCustomers();
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

  // 7-day trend data for mobile trends tab
  const mobileTrendData = useMemo(() => {
    const days = [6, 5, 4, 3, 2, 1, 0].map((d) => subDays(new Date(), d));
    const salesKey = language === "sw" ? "Mauzo" : "Sales";
    const profitKey = language === "sw" ? "Faida" : "Profit";

    return days.map((dateObj) => {
      const dayStr = format(dateObj, "yyyy-MM-dd");
      const daySales = (allSales || []).filter(
        (s) => s.status === "completed" && toLocalDayString(s.created_at) === dayStr
      );
      const dayExpenses = (expensesList || []).filter(
        (e) => toLocalDayString(e.date || e.created_at) === dayStr
      );
      const dayIncome = (otherIncomeList || []).filter(
        (i) => toLocalDayString(i.date || i.created_at) === dayStr
      );
      const dayPnl = calculatePnL(daySales, dayExpenses, dayIncome);
      return {
        name: format(dateObj, "EEE"),
        [salesKey]: dayPnl.grossSales,
        [profitKey]: dayPnl.netProfit,
      };
    });
  }, [allSales, expensesList, otherIncomeList, language]);

  // Mobile recent activity items
  const mobileRecentSales = useMemo(() => {
    const source = (periodSales.length > 0 ? periodSales : allSales || [])
      .filter((s) => s.status === "completed")
      .slice(0, 4);

    return source.map((sale) => {
      const items = Array.isArray(sale.sale_items) ? sale.sale_items : [];
      const firstItem = items[0];
      const title =
        firstItem?.product_name ||
        sale.invoice_number ||
        (language === "sw" ? "Muamala wa mauzo" : "Sale Transaction");
      const customer =
        sale.customer_name ||
        sale.customers?.name ||
        (language === "sw" ? "Mteja wa kawaida" : "Walk-in");
      const payment = sale.payment_method || "Cash";
      const dateFormatted = sale.created_at ? format(new Date(sale.created_at), "d MMM, HH:mm") : "";
      const subtitle = `${customer} · ${payment} · ${dateFormatted}`;

      return {
        id: sale.id,
        title,
        subtitle,
        amount: `+${formatMoney(Number(sale.total || 0))}`,
      };
    });
  }, [periodSales, allSales, language, formatMoney]);

  const isInitialLoading = salesLoading && productsLoading;
  const salesTrendKey = language === "sw" ? "Mauzo" : "Sales";
  const profitTrendKey = language === "sw" ? "Faida" : "Profit";

  return (
    <div>
      {/* ========================================================================= */}
      {/* 1. DESKTOP ZERO-SCROLL COMMAND CENTER (hidden md:flex flex-col gap-2.5)  */}
      {/* ========================================================================= */}
      <div className="hidden md:flex flex-col gap-2.5 pb-2">
        {/* Row 0: Slim Greeting & Period Selector Bar */}
        <DashboardGreeting
          userName={userName}
          shopName={shopName}
          language={language}
          period={period}
          onPeriodChange={setPeriod}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />

        {/* Row 1: 8-col Primary KPIs + 4-col Needs Attention Side-by-Side */}
        <div className="grid grid-cols-12 gap-2.5 items-stretch">
          <div className="col-span-8">
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
          </div>

          <div className="col-span-4">
            <NeedsAttention
              language={language}
              formatMoney={formatMoney}
              outOfStockCount={outOfStockCount}
              lowStockCount={lowStockCount}
              customerDebtTotal={customerDebtTotal}
              debtorsCount={debtorsCount}
              pendingOrdersCount={pendingOrdersCount}
              pendingPurchasesCount={pendingPurchasesCount}
              compact={true}
            />
          </div>
        </div>

        {/* Row 2: 6-col Chart + 3-col Top Products + 3-col Recent Sales Side-by-Side */}
        <div className="grid grid-cols-12 gap-2.5 items-stretch">
          <div className="col-span-6">
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

          <div className="col-span-3">
            <TopSellingProducts
              periodSales={periodSales}
              language={language}
              formatMoney={formatMoney}
            />
          </div>

          <div className="col-span-3">
            <RecentSalesList
              sales={periodSales.length > 0 ? periodSales : allSales || []}
              language={language}
              formatMoney={formatMoney}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE COMPACT SINGLE-SCREEN VIEW (md:hidden space-y-3 pb-8)          */}
      {/* ========================================================================= */}
      <div className="space-y-3 pb-8 md:hidden">
        {/* Mobile Header: Shop & Today Date */}
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg font-black tracking-tight text-foreground">
            Overview — {shopName}
          </h1>
          <p className="text-xs text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d yyyy")}
          </p>
        </div>

        {/* Mobile Period Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {(["today", "week", "month", "year", "all"] as Exclude<DashboardPeriod, "custom">[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap",
                period === p
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs font-bold"
                  : "border border-border/80 bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {DASHBOARD_PERIOD_LABELS[p][language]}
            </button>
          ))}

          {/* Custom Date Popover */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  setPeriod("custom");
                  setCalendarOpen(true);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap",
                  period === "custom"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs font-bold"
                    : "border border-border/80 bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarDays className="h-3 w-3" />
                <span>
                  {period === "custom" && customRange.from
                    ? customRange.to
                      ? `${format(customRange.from, "dd MMM")} – ${format(customRange.to, "dd MMM")}`
                      : format(customRange.from, "dd MMM")
                    : language === "sw"
                    ? "Maalum"
                    : "Custom"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border border-border" align="end">
              <Calendar
                mode="range"
                selected={{ from: customRange.from, to: customRange.to }}
                onSelect={(range) => {
                  setCustomRange({ from: range?.from, to: range?.to });
                  if (range?.from && range?.to) {
                    setPeriod("custom");
                    setCalendarOpen(false);
                  }
                }}
                numberOfMonths={1}
                disabled={{ after: new Date() }}
                className="p-3"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Mobile Period Sales Hero Card */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {language === "sw" ? "MAUZO YA KIPINDI" : "PERIOD SALES"}
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {period === "custom"
                ? customRange.from && customRange.to
                  ? `${format(customRange.from, "dd MMM")} – ${format(customRange.to, "dd MMM")}`
                  : language === "sw" ? "Maalum" : "Custom"
                : DASHBOARD_PERIOD_LABELS[period]?.[language] || "Today"}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-2xl font-black tracking-tight text-foreground">
                {formatMoney(pnl.grossSales)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {periodSales.length} {language === "sw" ? "mauzo yamekamilika" : "sales completed"}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/sales?view=new")}
              className="h-8 rounded-full bg-neutral-950 px-3.5 text-xs font-bold text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950"
            >
              <Plus className="h-3.5 w-3.5 mr-1 text-amber-500" />
              <span>{language === "sw" ? "Uza" : "Sell"}</span>
            </Button>
          </div>

          {/* 3-Column Mini Metrics */}
          <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-border/60 pt-3">
            <div className="rounded-xl bg-muted/40 p-2 text-center">
              <p className="text-[10px] font-medium text-muted-foreground">
                {language === "sw" ? "Iliyolipwa" : "Cash In"}
              </p>
              <p className="text-xs font-bold text-emerald-600 truncate mt-0.5">
                {formatMoney(cashReceivedVal)}
              </p>
            </div>
            <div
              className="rounded-xl bg-muted/40 p-2 text-center cursor-pointer active:scale-98 transition-transform"
              onClick={() => navigate("/customers")}
            >
              <p className="text-[10px] font-medium text-muted-foreground">
                {language === "sw" ? "Madeni" : "Due"}
              </p>
              <p className="text-xs font-bold text-amber-600 truncate mt-0.5">
                {formatMoney(customerDebtTotal)}
              </p>
            </div>
            <div
              className="rounded-xl bg-muted/40 p-2 text-center cursor-pointer active:scale-98 transition-transform"
              onClick={() => navigate("/expenses")}
            >
              <p className="text-[10px] font-medium text-muted-foreground">
                {language === "sw" ? "Faida Halisi" : "Net Profit"}
              </p>
              <p className={cn("text-xs font-bold truncate mt-0.5", pnl.netProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {pnl.netProfit < 0 ? `-${formatMoney(Math.abs(pnl.netProfit))}` : formatMoney(pnl.netProfit)}
              </p>
            </div>
          </div>
        </div>

        {/* 4 Primary Touch Action Buttons */}
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => navigate("/sales?view=new")}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-2.5 shadow-2xs active:scale-95 transition-transform"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-2xs">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-semibold text-foreground truncate">
              {language === "sw" ? "Mauzo" : "Sale"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/inventory?new=true")}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-2.5 shadow-2xs active:scale-95 transition-transform"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
              <Package className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-semibold text-foreground truncate">
              {language === "sw" ? "+ Stoki" : "+ Stock"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/customers")}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-2.5 shadow-2xs active:scale-95 transition-transform"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Users className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-semibold text-foreground truncate">
              {language === "sw" ? "Madeni" : "Debts"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/expenses?new=true")}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-2.5 shadow-2xs active:scale-95 transition-transform"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
              <Receipt className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-semibold text-foreground truncate">
              {language === "sw" ? "+ Gharama" : "+ Expense"}
            </span>
          </button>
        </div>

        {/* Mobile Segmented Control */}
        <div className="flex rounded-xl border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setMobileTab("activity")}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all",
              mobileTab === "activity"
                ? "bg-card text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {language === "sw" ? "Miamala" : "Activity"}
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("trends")}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all",
              mobileTab === "trends"
                ? "bg-card text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {language === "sw" ? "Mwelekeo" : "Trends"}
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("alerts")}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
              mobileTab === "alerts"
                ? "bg-card text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{language === "sw" ? "Tahadhari" : "Alerts"}</span>
            {(lowStockCount + outOfStockCount) > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {lowStockCount + outOfStockCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Segment Content */}
        {mobileTab === "activity" && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {language === "sw" ? "MIAMALA YA KARIBUNI" : "RECENT ACTIVITY"}
              </span>
              <button
                onClick={() => navigate("/sales")}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {language === "sw" ? "Zote" : "View All"}
              </button>
            </div>

            {mobileRecentSales.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                {language === "sw" ? "Hakuna miamala kwa sasa." : "No transactions recorded yet."}
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {mobileRecentSales.map((act) => (
                  <div
                    key={act.id}
                    onClick={() => navigate("/sales")}
                    className="flex items-center gap-3 px-4 py-3 active:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-foreground">
                        {act.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {act.subtitle}
                      </p>
                    </div>
                    <span className="text-xs font-black text-emerald-600 shrink-0">
                      {act.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {mobileTab === "trends" && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              {language === "sw" ? "Mwelekeo wa Mauzo na Faida (Siku 7)" : "7-Day Sales & Profit Trend"}
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mobileTrendData} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    dy={6}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 10 }}
                    formatter={(val: unknown) => formatMoney(Number(val) || 0)}
                  />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
                  <Line type="monotone" dataKey={salesTrendKey} stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey={profitTrendKey} stroke="#059669" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {mobileTab === "alerts" && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {language === "sw" ? "Bidhaa Zenye Stoki Ndogo" : "Low Stock Alerts"}
              </span>
              <button
                onClick={() => navigate("/inventory")}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {language === "sw" ? "Tazama Stoki" : "View Inventory"}
              </button>
            </div>

            {lowStockCount === 0 && outOfStockCount === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                {language === "sw"
                  ? "Stoki yote iko katika kiwango cha kuridhisha."
                  : "All stock levels are healthy."}
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {(lowStockProducts || []).slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate("/inventory")}
                    className="flex items-center justify-between px-4 py-3 active:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {language === "sw" ? "Tahadhari" : "Alert limit"}: {item.low_stock_alert ?? 5}
                      </p>
                    </div>
                    <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400 shrink-0">
                      {item.stock} pcs
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
