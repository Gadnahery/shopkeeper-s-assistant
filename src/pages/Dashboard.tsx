import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  ShoppingCart,
  Factory,
  Banknote,
  Package,
  Users,
  Receipt,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Plus,
  ChevronRight,
  Wallet,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, subDays, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSales } from "@/hooks/useSales";
import { usePurchases } from "@/hooks/usePurchases";
import { useProductionBatches } from "@/hooks/useProduction";
import { useExpenses } from "@/hooks/useExpenses";
import { useOtherIncome } from "@/hooks/useOtherIncome";
import { useProducts, useLowStockProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { cn } from "@/lib/utils";

type Period = "today" | "week" | "month" | "year" | "all";

function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  delta,
  deltaType,
  icon: Icon,
  colorClass,
  bgColorClass,
  onClick,
}: {
  title: string;
  value: string;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral";
  icon: React.ElementType;
  colorClass: string;
  bgColorClass: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn("stat-card", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <div className="flex gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${bgColorClass}`}>
          <Icon className={`h-5 w-5 ${colorClass}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-medium text-muted-foreground truncate">{title}</h3>
          <p className="money-display-sm mt-1 truncate">{value}</p>
          {delta && (
            <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 mt-1.5 text-xs font-medium">
              {deltaType === "positive" && <ArrowUp className="h-3 w-3 text-emerald-600 shrink-0" />}
              {deltaType === "negative" && <ArrowDown className="h-3 w-3 text-rose-600 shrink-0" />}
              <span className={cn(
                "shrink-0",
                deltaType === "positive" ? "text-emerald-600" : deltaType === "negative" ? "text-rose-600" : "text-muted-foreground"
              )}>
                {delta}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="page-section">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="page-section p-5">
      <Skeleton className="h-4 w-48 mb-5" />
      <Skeleton className="h-56 w-full rounded-lg" />
    </div>
  );
}

const PERIOD_LABELS: Record<Period, Record<"en" | "sw", string>> = {
  today: { en: "Today", sw: "Leo" },
  week: { en: "This week", sw: "Wiki hii" },
  month: { en: "This month", sw: "Mwezi huu" },
  year: { en: "This year", sw: "Mwaka huu" },
  all: { en: "All time", sw: "Muda wote" },
};

function getPeriodDates(period: Period): { start: string; end: string } {
  const now = new Date();
  const end = format(now, "yyyy-MM-dd");
  switch (period) {
    case "today": return { start: end, end };
    case "week": return { start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"), end };
    case "month": return { start: format(startOfMonth(now), "yyyy-MM-dd"), end };
    case "year": return { start: format(startOfYear(now), "yyyy-MM-dd"), end };
    case "all": return { start: "1970-01-01", end };
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { formatMoney } = useShopFormatting();
  const { profile } = useAuth();
  const [period, setPeriod] = useState<Period>("today");

  const shopName = profile?.shops?.name || "WiseCash";

  // Queries
  const { data: allSales, isLoading: salesLoading } = useSales();
  const { data: purchasesList, isLoading: purchasesLoading } = usePurchases();
  const { data: productionList } = useProductionBatches();
  const { data: expensesList, isLoading: expensesLoading } = useExpenses();
  const { data: otherIncomeList } = useOtherIncome();
  const { data: allProducts, isLoading: productsLoading } = useProducts();
  const { data: lowStockProducts, isLoading: lowStockLoading } = useLowStockProducts();
  const { data: customersList } = useCustomers();

  // Active period date boundaries
  const { start: periodStart, end: periodEnd } = useMemo(() => getPeriodDates(period), [period]);

  const isDateInPeriod = (dateStr?: string | null) => {
    if (!dateStr) return false;
    if (period === "all") return true;
    const d = dateStr.slice(0, 10);
    return d >= periodStart && d <= periodEnd;
  };

  // Synchronize all period-sensitive business streams
  const periodSales = useMemo(() => {
    return (allSales || []).filter((s) => s.status === "completed" && isDateInPeriod(s.created_at));
  }, [allSales, periodStart, periodEnd, period]);

  const periodPurchases = useMemo(() => {
    return (purchasesList || []).filter((p) => isDateInPeriod(p.created_at));
  }, [purchasesList, periodStart, periodEnd, period]);

  const periodProduction = useMemo(() => {
    return (productionList || []).filter((b) => isDateInPeriod(b.created_at));
  }, [productionList, periodStart, periodEnd, period]);

  const periodExpenses = useMemo(() => {
    return (expensesList || []).filter((e) => isDateInPeriod(e.date || e.created_at));
  }, [expensesList, periodStart, periodEnd, period]);

  const periodOtherIncome = useMemo(() => {
    return (otherIncomeList || []).filter((i) => isDateInPeriod(i.date || i.created_at));
  }, [otherIncomeList, periodStart, periodEnd, period]);

  // Product cost mapping for accurate Cost of Goods Sold (COGS)
  const productCostMap = useMemo(() => {
    const map = new Map<string, number>();
    (allProducts || []).forEach((p) => {
      map.set(p.id, Number(p.buying_price) || 0);
    });
    return map;
  }, [allProducts]);

  // Financial KPI calculations
  const totalSalesVal = useMemo(
    () => periodSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0),
    [periodSales]
  );

  const totalPurchasesVal = useMemo(
    () => periodPurchases.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0),
    [periodPurchases]
  );

  const totalProductionCostVal = useMemo(
    () => periodProduction.reduce((sum, b) => sum + (Number(b.total_cost) || 0), 0),
    [periodProduction]
  );

  const cashReceivedVal = useMemo(() => {
    return periodSales
      .filter((s) => s.payment_method === "Cash" || s.payment_method === "M-Pesa")
      .reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  }, [periodSales]);

  const stockValueVal = useMemo(
    () => (allProducts || []).reduce((sum, p) => sum + (Number(p.stock) || 0) * (Number(p.buying_price) || 0), 0),
    [allProducts]
  );

  const customersOweVal = useMemo(
    () => (customersList || []).reduce((sum, c) => sum + (Number(c.credit_balance) || 0), 0),
    [customersList]
  );

  const totalExpensesVal = useMemo(
    () => periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [periodExpenses]
  );

  const totalOtherIncomeVal = useMemo(
    () => periodOtherIncome.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [periodOtherIncome]
  );

  // Period Cost of Goods Sold (COGS)
  const periodCogsVal = useMemo(() => {
    return periodSales.reduce((sum, s) => {
      const items = (s.sale_items as any[]) || [];
      const saleCost = items.reduce((itemSum, item) => {
        const unitCost = productCostMap.get(item.product_id) ?? (Number(item.unit_price) * 0.75);
        return itemSum + (Number(item.quantity) || 1) * unitCost;
      }, 0);
      return sum + saleCost;
    }, 0);
  }, [periodSales, productCostMap]);

  // ERP Accounting: Gross Profit = Sales - COGS
  const grossProfitVal = totalSalesVal - periodCogsVal;

  // Net Profit = Gross Profit + Other Income - Operating Expenses
  // If negative, represents true Net Loss (never clamped to 0)
  const netProfitVal = grossProfitVal + totalOtherIncomeVal - totalExpensesVal;

  // Chart data — last 7 days
  const chartData = useMemo(() => {
    const days = [6, 5, 4, 3, 2, 1, 0].map((d) => format(subDays(new Date(), d), "yyyy-MM-dd"));
    return days.map((dayStr) => {
      const daySalesList = (allSales || []).filter(
        (s) => s.status === "completed" && (s.created_at || "").startsWith(dayStr)
      );
      const daySales = daySalesList.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
      const dayExpenses = (expensesList || [])
        .filter((e) => (e.date || e.created_at || "").startsWith(dayStr))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const dayCogs = daySalesList.reduce((sum, s) => {
        const items = (s.sale_items as any[]) || [];
        return sum + items.reduce((iSum, item) => iSum + (Number(item.quantity) || 1) * (productCostMap.get(item.product_id) ?? (Number(item.unit_price) * 0.75)), 0);
      }, 0);
      const dayProfit = daySales - dayCogs - dayExpenses;
      return {
        name: format(new Date(dayStr + "T00:00:00"), "dd MMM"),
        date: dayStr,
        [language === "sw" ? "Mauzo" : "Sales"]: daySales,
        [language === "sw" ? "Matumizi" : "Expenses"]: dayExpenses,
        [language === "sw" ? "Faida" : "Profit"]: dayProfit,
      };
    });
  }, [allSales, expensesList, productCostMap, language]);

  // Recent activities
  const recentActivities = useMemo(() => {
    const acts = [
      ...(allSales || []).slice(0, 10).map((s) => ({
        type: "sale",
        title: `Sale #${s.id.slice(0, 6).toUpperCase()}`,
        subtitle: s.payment_method || "Cash",
        date: s.created_at,
        amount: `+${formatMoney(s.total)}`,
        isPositive: true,
        icon: ShoppingBag,
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-950/40",
      })),
      ...(expensesList || []).slice(0, 10).map((e) => ({
        type: "expense",
        title: e.title || (language === "sw" ? "Gharama" : "Expense"),
        subtitle: e.category || "General",
        date: e.date || e.created_at,
        amount: `-${formatMoney(e.amount)}`,
        isPositive: false,
        icon: Receipt,
        color: "text-rose-600",
        bg: "bg-rose-50 dark:bg-rose-950/40",
      })),
      ...(purchasesList || []).slice(0, 10).map((p) => ({
        type: "purchase",
        title: `${language === "sw" ? "Ununuzi" : "Purchase"}: ${p.supplier_name || "Supplier"}`,
        subtitle: `${p.items_count || 1} ${language === "sw" ? "bidhaa" : "items"}`,
        date: p.created_at,
        amount: `-${formatMoney(p.total_amount)}`,
        isPositive: false,
        icon: ShoppingCart,
        color: "text-violet-600",
        bg: "bg-violet-50 dark:bg-violet-950/40",
      })),
      ...(otherIncomeList || []).slice(0, 5).map((income) => ({
        type: "income",
        title: income.title,
        subtitle: income.category,
        date: income.date,
        amount: `+${formatMoney(income.amount)}`,
        isPositive: true,
        icon: Banknote,
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
      })),
    ];
    return acts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
  }, [allSales, purchasesList, expensesList, otherIncomeList, formatMoney, language]);

  const kpiLoading = salesLoading || purchasesLoading || expensesLoading || productsLoading;
  const salesLabelKey = language === "sw" ? "Mauzo" : "Sales";
  const expensesLabelKey = language === "sw" ? "Matumizi" : "Expenses";
  const profitLabelKey = language === "sw" ? "Faida" : "Profit";

  const [mobileTab, setMobileTab] = useState<"activity" | "trends" | "alerts">("activity");

  return (
    <div className="space-y-4 sm:space-y-5 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {language === "sw" ? `Habari, ${shopName}` : `Overview — ${shopName}`}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {format(new Date(), language === "sw" ? "EEEE, dd MMMM yyyy" : "EEEE, MMMM dd yyyy")}
          </p>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-xs self-start sm:self-auto">
          {(["today", "week", "month", "year", "all"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-lg px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium transition-all",
                period === p
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {PERIOD_LABELS[p][language]}
            </button>
          ))}
        </div>
      </div>

      {/* MOBILE COMPACT VIEW (md:hidden) — Simple, light, no excessive scrolling */}
      <div className="space-y-3.5 md:hidden">
        {/* Mobile Hero Card */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {language === "sw" ? "Mauzo ya Kipindi" : "Period Sales"}
            </span>
            <span className="badge-neutral text-[10px]">
              {PERIOD_LABELS[period][language]}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-2xl font-black tracking-tight text-foreground">{formatMoney(totalSalesVal)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {periodSales.length} {language === "sw" ? "miamala ya mauzo" : "sales completed"}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/sales")}
              className="h-8 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5 mr-1 text-accent" />
              <span>{language === "sw" ? "Uza" : "Sell"}</span>
            </Button>
          </div>

          {/* 3-Column Mini Metrics */}
          <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-border/60 pt-3">
            <div className="rounded-xl bg-muted/40 p-2 text-center">
              <p className="text-[10px] font-medium text-muted-foreground">{language === "sw" ? "Iliyolipwa" : "Cash In"}</p>
              <p className="text-xs font-bold text-emerald-600 truncate mt-0.5">{formatMoney(cashReceivedVal)}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-2 text-center cursor-pointer" onClick={() => navigate("/customers")}>
              <p className="text-[10px] font-medium text-muted-foreground">{language === "sw" ? "Madeni" : "Due"}</p>
              <p className="text-xs font-bold text-amber-600 truncate mt-0.5">{formatMoney(customersOweVal)}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-2 text-center cursor-pointer" onClick={() => navigate("/expenses")}>
              <p className="text-[10px] font-medium text-muted-foreground">{language === "sw" ? "Faida Halisi" : "Net Profit"}</p>
              <p className={cn("text-xs font-bold truncate mt-0.5", netProfitVal >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {netProfitVal < 0 ? `-${formatMoney(Math.abs(netProfitVal))}` : formatMoney(netProfitVal)}
              </p>
            </div>
          </div>
        </div>

        {/* 4 Primary Touch Actions */}
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => navigate("/sales")}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-2.5 shadow-2xs active:scale-95 transition-transform"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-2xs">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-semibold text-foreground truncate">{language === "sw" ? "Mauzo" : "Sale"}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/inventory?new=true")}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-2.5 shadow-2xs active:scale-95 transition-transform"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <Package className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-semibold text-foreground truncate">{language === "sw" ? "+ Stoki" : "+ Stock"}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/customers")}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-2.5 shadow-2xs active:scale-95 transition-transform"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Users className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-semibold text-foreground truncate">{language === "sw" ? "Madeni" : "Debts"}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/expenses?new=true")}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-2.5 shadow-2xs active:scale-95 transition-transform"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
              <Receipt className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-semibold text-foreground truncate">{language === "sw" ? "+ Gharama" : "+ Expense"}</span>
          </button>
        </div>

        {/* Mobile Segmented Control */}
        <div className="flex rounded-xl border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setMobileTab("activity")}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all",
              mobileTab === "activity" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {language === "sw" ? "Miamala" : "Activity"}
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("trends")}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all",
              mobileTab === "trends" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {language === "sw" ? "Mwelekeo" : "Trends"}
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("alerts")}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
              mobileTab === "alerts" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{language === "sw" ? "Stoki Ndogo" : "Alerts"}</span>
            {lowStockProducts && lowStockProducts.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {lowStockProducts.length}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Segment Content */}
        {mobileTab === "activity" && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {language === "sw" ? "Miamala ya Karibuni" : "Recent Activity"}
              </span>
              <button
                onClick={() => navigate("/sales")}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {language === "sw" ? "Zote" : "View All"}
              </button>
            </div>
            {recentActivities.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                {language === "sw" ? "Hakuna miamala kwa sasa." : "No transactions recorded yet."}
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {recentActivities.slice(0, 5).map((act, index) => (
                  <div key={index} className="flex items-center gap-3 px-4 py-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${act.bg}`}>
                      <act.icon className={`h-3.5 w-3.5 ${act.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">{act.title}</p>
                      <p className="text-[10px] text-muted-foreground">{act.subtitle}</p>
                    </div>
                    <span className={cn("text-xs font-bold shrink-0", act.isPositive ? "text-emerald-600" : "text-foreground")}>
                      {act.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {mobileTab === "trends" && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              {language === "sw" ? "Mwelekeo wa Mauzo na Faida (Siku 7)" : "7-Day Sales & Profit Trend"}
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} dy={6} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} width={34} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 10 }}
                    formatter={(val: unknown) => formatMoney(Number(val) || 0)}
                  />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
                  <Line type="monotone" dataKey={salesLabelKey} stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey={profitLabelKey} stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {mobileTab === "alerts" && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {language === "sw" ? "Bidhaa Zenye Stoki Ndogo" : "Low Stock Alerts"}
              </span>
              <button
                onClick={() => navigate("/inventory")}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {language === "sw" ? "Stoki" : "View Inventory"}
              </button>
            </div>
            {lowStockProducts && lowStockProducts.length > 0 ? (
              <div className="divide-y divide-border/60">
                {lowStockProducts.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{language === "sw" ? "Kiwango cha tahadhari" : "Limit"}: {item.low_stock_alert ?? 5}</p>
                    </div>
                    <span className="badge-warning shrink-0">{item.stock} pcs</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground">
                {language === "sw" ? "Stoki yote iko katika kiwango cha kuridhisha." : "All stock levels are healthy."}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DESKTOP EXPANDED VIEW (hidden md:block) — 8 Full ERP StatCards */}
      <div className="hidden md:block space-y-4">
        {/* Row 1: Sales, Purchases, Production, Cash Received */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5">
          {kpiLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title={language === "sw" ? "Jumla ya Mauzo" : "Total Sales"}
                value={formatMoney(totalSalesVal)}
                delta={periodSales.length > 0 ? `${periodSales.length} ${language === "sw" ? "miamala" : "orders"}` : undefined}
                deltaType="neutral"
                icon={ShoppingBag}
                colorClass="text-blue-600"
                bgColorClass="bg-blue-50 dark:bg-blue-950/40"
                onClick={() => navigate("/sales")}
              />
              <StatCard
                title={language === "sw" ? "Jumla ya Manunuzi" : "Total Purchases"}
                value={formatMoney(totalPurchasesVal)}
                delta={periodPurchases.length > 0 ? `${periodPurchases.length} ${language === "sw" ? "shehena" : "purchases"}` : undefined}
                deltaType="neutral"
                icon={ShoppingCart}
                colorClass="text-purple-600"
                bgColorClass="bg-purple-50 dark:bg-purple-950/40"
                onClick={() => navigate("/purchases")}
              />
              <StatCard
                title={language === "sw" ? "Gharama ya Uzalishaji" : "Total Production Cost"}
                value={formatMoney(totalProductionCostVal)}
                delta={periodProduction.length > 0 ? `${periodProduction.length} ${language === "sw" ? "awamu" : "batches"}` : undefined}
                deltaType="neutral"
                icon={Factory}
                colorClass="text-amber-600"
                bgColorClass="bg-amber-50 dark:bg-amber-950/40"
                onClick={() => navigate("/production")}
              />
              <StatCard
                title={language === "sw" ? "Pesa Zilizopokelewa" : "Cash Received"}
                value={formatMoney(cashReceivedVal)}
                delta={totalSalesVal > 0 ? `${Math.round((cashReceivedVal / totalSalesVal) * 100)}% collected` : undefined}
                deltaType="positive"
                icon={Banknote}
                colorClass="text-emerald-600"
                bgColorClass="bg-emerald-50 dark:bg-emerald-950/40"
              />
            </>
          )}
        </div>

        {/* Row 2: Stock Value, Customers Owe, Expenses, Net Profit */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5">
          {kpiLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title={language === "sw" ? "Thamani ya Stoki" : "Stock Value"}
                value={formatMoney(stockValueVal)}
                delta={`${(allProducts || []).length} ${language === "sw" ? "bidhaa" : "items"}`}
                deltaType="neutral"
                icon={Package}
                colorClass="text-cyan-600"
                bgColorClass="bg-cyan-50 dark:bg-cyan-950/40"
                onClick={() => navigate("/inventory")}
              />
              <StatCard
                title={language === "sw" ? "Madeni ya Wateja" : "Customers Owe"}
                value={formatMoney(customersOweVal)}
                delta={customersOweVal > 0 ? `${language === "sw" ? "Inasubiri" : "Outstanding"}` : `${language === "sw" ? "Hakuna madeni" : "Settled"}`}
                deltaType={customersOweVal > 0 ? "negative" : "positive"}
                icon={Users}
                colorClass="text-rose-600"
                bgColorClass="bg-rose-50 dark:bg-rose-950/40"
                onClick={() => navigate("/customers")}
              />
              <StatCard
                title={language === "sw" ? "Jumla ya Matumizi" : "Total Expenses"}
                value={formatMoney(totalExpensesVal)}
                delta={periodExpenses.length > 0 ? `${periodExpenses.length} ${language === "sw" ? "rekodi" : "entries"}` : undefined}
                deltaType="neutral"
                icon={Receipt}
                colorClass="text-orange-600"
                bgColorClass="bg-orange-50 dark:bg-orange-950/40"
                onClick={() => navigate("/expenses")}
              />
              <StatCard
                title={language === "sw" ? "Faida Halisi" : "Net Profit"}
                value={netProfitVal < 0 ? `-${formatMoney(Math.abs(netProfitVal))}` : formatMoney(netProfitVal)}
                delta={
                  totalSalesVal > 0
                    ? `${((netProfitVal / totalSalesVal) * 100).toFixed(1)}% margin`
                    : netProfitVal < 0
                    ? "Net Loss"
                    : "Balanced"
                }
                deltaType={netProfitVal > 0 ? "positive" : netProfitVal < 0 ? "negative" : "neutral"}
                icon={TrendingUp}
                colorClass={netProfitVal >= 0 ? "text-emerald-600" : "text-rose-600"}
                bgColorClass={netProfitVal >= 0 ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-rose-50 dark:bg-rose-950/40"}
                onClick={() => navigate("/reports")}
              />
            </>
          )}
        </div>
      </div>

      {/* Charts Row (Desktop) */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-4">
        {salesListLoading || expensesLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            {/* Chart 1: Sales vs Expenses vs Profit */}
            <div className="page-section p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5">
                {language === "sw" ? "Mauzo vs Matumizi vs Faida" : "Sales vs Expenses vs Profit"}
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} width={40} />
                    <Tooltip
                      contentStyle={{ borderRadius: 10, border: "1px solid hsl(var(--border))", fontSize: 11 }}
                      formatter={(val: unknown) => formatMoney(Number(val) || 0)}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Line type="monotone" dataKey={salesLabelKey} stroke="#3b82f6" strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey={expensesLabelKey} stroke="#f43f5e" strokeWidth={2} dot={{ r: 2.5 }} />
                    <Line type="monotone" dataKey={profitLabelKey} stroke="#10b981" strokeWidth={2} dot={{ r: 2.5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Net Profit Trend */}
            <div className="page-section p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5">
                {language === "sw" ? "Mwelekeo wa Faida Halisi" : "Net Profit Trend"}
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} width={40} />
                    <Tooltip
                      contentStyle={{ borderRadius: 10, border: "1px solid hsl(var(--border))", fontSize: 11 }}
                      formatter={(val: unknown) => formatMoney(Number(val) || 0)}
                    />
                    <Area type="monotone" dataKey={profitLabelKey} stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#gradProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Row: Low Stock + Recent Activities (Desktop) */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low Stock Alerts */}
        <SectionCard
          title={language === "sw" ? "Tahadhari za Stoki Ndogo" : "Low Stock Alerts"}
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate("/inventory")} className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground">
              {language === "sw" ? "Tazama Stoki" : "View All"}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          }
        >
          {lowStockLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : lowStockProducts && lowStockProducts.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{language === "sw" ? "Bidhaa" : "Product"}</th>
                  <th className="text-right">{language === "sw" ? "Iliyobaki" : "Stock"}</th>
                  <th className="text-right">{language === "sw" ? "Kiwango" : "Limit"}</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.slice(0, 5).map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="font-medium truncate max-w-[180px]">{item.name}</span>
                      </div>
                    </td>
                    <td className="text-right">
                      <span className="badge-warning">{item.stock}</span>
                    </td>
                    <td className="text-right text-muted-foreground text-xs">{item.low_stock_alert ?? 5}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state py-10">
              <div className="empty-state-icon">
                <Package className="h-7 w-7" />
              </div>
              <p className="text-sm font-medium text-foreground">{language === "sw" ? "Stoki Iko Sawa" : "Stock levels healthy"}</p>
              <p className="text-xs text-muted-foreground">{language === "sw" ? "Hakuna bidhaa zenye stoki ndogo." : "No items are running low."}</p>
            </div>
          )}
        </SectionCard>

        {/* Recent Activity */}
        <SectionCard
          title={language === "sw" ? "Miamala ya Hivi Karibuni" : "Recent Activity"}
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate("/sales")} className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground">
              {language === "sw" ? "Tazama Zaidi" : "View All"}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          }
        >
          {kpiLoading || expensesLoading || purchasesLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ) : recentActivities.length > 0 ? (
            <div className="divide-y divide-border">
              {recentActivities.map((act, index) => (
                <div key={index} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${act.bg}`}>
                    <act.icon className={`h-3.5 w-3.5 ${act.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground max-w-[200px]">{act.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{act.subtitle}</p>
                  </div>
                  <span className={cn(
                    "text-xs font-bold shrink-0",
                    act.isPositive ? "text-emerald-600" : "text-foreground"
                  )}>
                    {act.amount}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state py-10">
              <div className="empty-state-icon">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <p className="text-sm font-medium text-foreground">{language === "sw" ? "Hakuna Miamala" : "No recent activity"}</p>
              <Button size="sm" onClick={() => navigate("/sales")} className="mt-1 h-8 text-xs rounded-xl">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                {language === "sw" ? "Anza Mauzo" : "Start a Sale"}
              </Button>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
