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
import { useSalesSummaryByRange, useSalesByDateRange } from "@/hooks/useSales";
import { usePurchases } from "@/hooks/usePurchases";
import { useProductionBatches } from "@/hooks/useProduction";
import { useExpenses } from "@/hooks/useExpenses";
import { useOtherIncome } from "@/hooks/useOtherIncome";
import { useProducts, useLowStockProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { cn } from "@/lib/utils";

type Period = "today" | "week" | "month" | "year";

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
};

function getPeriodDates(period: Period): { start: string; end: string } {
  const now = new Date();
  const end = format(now, "yyyy-MM-dd");
  switch (period) {
    case "today": return { start: end, end };
    case "week": return { start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"), end };
    case "month": return { start: format(startOfMonth(now), "yyyy-MM-dd"), end };
    case "year": return { start: format(startOfYear(now), "yyyy-MM-dd"), end };
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { formatMoney } = useShopFormatting();
  const { profile } = useAuth();
  const [period, setPeriod] = useState<Period>("week");

  const shopName = profile?.shops?.name || "WiseCash";

  // Date range
  const sevenDaysAgo = format(subDays(new Date(), 6), "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");
  const { start: periodStart } = getPeriodDates(period);

  // Queries — load independently for skeleton support
  const { data: rangeSales, isLoading: salesLoading } = useSalesSummaryByRange(sevenDaysAgo, today);
  const { data: salesList, isLoading: salesListLoading } = useSalesByDateRange(sevenDaysAgo, today);
  const { data: purchasesList, isLoading: purchasesLoading } = usePurchases();
  const { data: productionList } = useProductionBatches();
  const { data: expensesList, isLoading: expensesLoading } = useExpenses();
  const { data: otherIncomeList } = useOtherIncome();
  const { data: allProducts } = useProducts();
  const { data: lowStockProducts, isLoading: lowStockLoading } = useLowStockProducts();
  const { data: customersList } = useCustomers();

  // KPI calculations
  const totalSalesVal = useMemo(
    () => (salesList || []).reduce((sum, s) => sum + (Number(s.total) || 0), 0),
    [salesList]
  );
  const totalPurchasesVal = useMemo(
    () => (purchasesList || []).reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0),
    [purchasesList]
  );
  const stockValueVal = useMemo(
    () => (allProducts || []).reduce((sum, p) => sum + (Number(p.stock) || 0) * (Number(p.buying_price) || 0), 0),
    [allProducts]
  );
  const customersOweVal = useMemo(
    () => (customersList || []).reduce((sum, c) => sum + (Number(c.credit_balance) || 0), 0),
    [customersList]
  );
  const totalExpensesVal = useMemo(
    () => (expensesList || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expensesList]
  );
  const otherIncomeVal = useMemo(
    () => (otherIncomeList || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [otherIncomeList]
  );
  const totalRevenueVal = totalSalesVal + otherIncomeVal;
  const grossProfitVal = Math.max(0, totalSalesVal - totalPurchasesVal);
  const netProfitVal = Math.max(0, totalRevenueVal - totalExpensesVal);

  // Chart data — last 7 days
  const chartData = useMemo(() => {
    const days = [6, 5, 4, 3, 2, 1, 0].map((d) => format(subDays(new Date(), d), "yyyy-MM-dd"));
    return days.map((dayStr) => {
      const daySales = (salesList || [])
        .filter((s) => (s.created_at || "").startsWith(dayStr))
        .reduce((sum, s) => sum + (Number(s.total) || 0), 0);
      const dayExpenses = (expensesList || [])
        .filter((e) => (e.date || e.created_at || "").startsWith(dayStr))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const profit = Math.max(0, daySales - dayExpenses);
      return {
        name: format(new Date(dayStr + "T00:00:00"), "dd MMM"),
        [language === "sw" ? "Mauzo" : "Sales"]: daySales,
        [language === "sw" ? "Matumizi" : "Expenses"]: dayExpenses,
        [language === "sw" ? "Faida" : "Profit"]: profit,
      };
    });
  }, [salesList, expensesList, language]);

  // Recent activities
  const recentActivities = useMemo(() => {
    const acts = [
      ...(salesList || []).map((s) => ({
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
      ...(expensesList || []).map((e) => ({
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
      ...(purchasesList || []).map((p) => ({
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
      ...(otherIncomeList || []).map((income) => ({
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
  }, [salesList, purchasesList, expensesList, otherIncomeList, formatMoney, language]);

  const kpiLoading = salesLoading || salesListLoading;
  const salesLabelKey = language === "sw" ? "Mauzo" : "Sales";
  const expensesLabelKey = language === "sw" ? "Matumizi" : "Expenses";
  const profitLabelKey = language === "sw" ? "Faida" : "Profit";

  return (
    <div className="space-y-5 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {language === "sw" ? `Habari, ${shopName}` : `Overview — ${shopName}`}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {format(new Date(), language === "sw" ? "EEEE, dd MMMM yyyy" : "EEEE, MMMM dd yyyy")}
          </p>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1 shadow-xs self-start sm:self-auto">
          {(["today", "week", "month", "year"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
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

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
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
              icon={ShoppingBag}
              colorClass="text-blue-600"
              bgColorClass="bg-blue-50 dark:bg-blue-950/40"
              onClick={() => navigate("/sales")}
            />
            <StatCard
              title={language === "sw" ? "Pesa Zilizopokelewa" : "Cash Received"}
              value={formatMoney(totalSalesVal)}
              icon={Wallet}
              colorClass="text-emerald-600"
              bgColorClass="bg-emerald-50 dark:bg-emerald-950/40"
            />
            <StatCard
              title={language === "sw" ? "Madeni ya Wateja" : "Outstanding"}
              value={formatMoney(customersOweVal)}
              icon={Users}
              colorClass="text-amber-600"
              bgColorClass="bg-amber-50 dark:bg-amber-950/40"
              onClick={() => navigate("/customers")}
            />
            <StatCard
              title={language === "sw" ? "Faida Halisi" : "Net Profit"}
              value={formatMoney(netProfitVal)}
              icon={TrendingUp}
              colorClass="text-emerald-600"
              bgColorClass="bg-emerald-50 dark:bg-emerald-950/40"
              onClick={() => navigate("/expenses")}
            />
          </>
        )}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpiLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title={language === "sw" ? "Jumla ya Manunuzi" : "Purchases"}
              value={formatMoney(totalPurchasesVal)}
              icon={ShoppingCart}
              colorClass="text-violet-600"
              bgColorClass="bg-violet-50 dark:bg-violet-950/40"
              onClick={() => navigate("/purchases")}
            />
            <StatCard
              title={language === "sw" ? "Jumla ya Matumizi" : "Expenses"}
              value={formatMoney(totalExpensesVal)}
              icon={Receipt}
              colorClass="text-rose-600"
              bgColorClass="bg-rose-50 dark:bg-rose-950/40"
              onClick={() => navigate("/expenses")}
            />
            <StatCard
              title={language === "sw" ? "Thamani ya Stoki" : "Stock Value"}
              value={formatMoney(stockValueVal)}
              icon={Package}
              colorClass="text-cyan-600"
              bgColorClass="bg-cyan-50 dark:bg-cyan-950/40"
              onClick={() => navigate("/inventory")}
            />
            <StatCard
              title={language === "sw" ? "Faida ya Jumla" : "Gross Profit"}
              value={formatMoney(grossProfitVal)}
              icon={Banknote}
              colorClass="text-teal-600"
              bgColorClass="bg-teal-50 dark:bg-teal-950/40"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      {/* Bottom Row: Low Stock + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
