import { useNavigate } from "react-router-dom";
import { playSound } from "@/lib/sounds";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  FileText,
  AlertTriangle,
  CreditCard,
  Plus,
  Package,
  Receipt,
  Calculator as CalculatorIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSalesSummaryByRange } from "@/hooks/useSales";
import { useLowStockProducts, useProducts } from "@/hooks/useProducts";
import { useWeeklySalesTrend, useStockByCategory } from "@/hooks/useShopData";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Calculator } from "@/components/Calculator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

const PRIMARY_TEAL = "#0D9488";
const PRIMARY_GRADIENT = "url(#primaryGradient)";

type KpiRange = "today" | "week" | "month";

function getRange(r: KpiRange): { start: string; end: string; labelKey: string } {
  const now = new Date();
  switch (r) {
    case "today":
      return { start: format(startOfDay(now), "yyyy-MM-dd"), end: format(endOfDay(now), "yyyy-MM-dd"), labelKey: "dashboard.daily" };
    case "week":
      return { start: format(startOfWeek(now), "yyyy-MM-dd"), end: format(endOfWeek(now), "yyyy-MM-dd"), labelKey: "dashboard.weekly" };
    case "month":
      return { start: format(startOfMonth(now), "yyyy-MM-dd"), end: format(endOfMonth(now), "yyyy-MM-dd"), labelKey: "dashboard.monthly" };
    default:
      return getRange("today");
  }
}

export default function Dashboard() {
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [kpiRange, setKpiRange] = useState<KpiRange>("today");
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { profile } = useAuth();
  const range = useMemo(() => getRange(kpiRange), [kpiRange]);
  const { data: rangeSales, isLoading: salesLoading } = useSalesSummaryByRange(range.start, range.end);
  const { data: lowStockProducts } = useLowStockProducts();
  const { data: allProducts } = useProducts();
  const { data: weeklyTrend } = useWeeklySalesTrend();
  const { data: categoryData } = useStockByCategory();

  const shopName = profile?.shops?.name || "Smart Money";
  const formatNumber = (num: number) => num.toLocaleString("en-US");

  const cashPercent = rangeSales?.total ? Math.round((rangeSales.cash / rangeSales.total) * 100) : 0;
  const mpesaPercent = 100 - cashPercent;

  const donutColors = ["#0D9488", "#D97706", "#6366F1", "#DB2777", "#0D9488", "#7C3AED"];
  const fallbackCategoryData = categoryData?.length
    ? categoryData.map((c, i) => ({ ...c, color: donutColors[i % donutColors.length] }))
    : [{ name: "No data", value: 1, color: "#374151" }];

  const kpiData = [
    {
      title: t("dashboard.todaySales"),
      value: salesLoading ? "..." : formatNumber(rangeSales?.total || 0),
      subtitle: "TSH",
      icon: LayoutGrid,
      link: "/reports",
      linkRange: kpiRange,
    },
    {
      title: t("dashboard.transactions"),
      value: salesLoading ? "..." : (rangeSales?.count || 0).toString(),
      subtitle: t("dashboard.receiptsIssued"),
      icon: FileText,
      link: "/reports",
      linkRange: kpiRange,
    },
    {
      title: t("dashboard.lowStock"),
      value: `${lowStockProducts?.length || 0} ${t("common.items")}`,
      subtitle: t("dashboard.checkInventory"),
      icon: AlertTriangle,
      link: "/inventory",
    },
    {
      title: t("dashboard.cashVsMpesa"),
      value: `${cashPercent}% / ${mpesaPercent}%`,
      subtitle: t("dashboard.paymentSplit"),
      icon: CreditCard,
      link: "/reports",
      linkRange: kpiRange,
    },
  ];

  const alerts = lowStockProducts?.slice(0, 3).map((p) => ({
    title: `Low stock: ${p.name}`,
    subtitle: `${t("inventory.stock")}: ${p.stock} / Alert: ${p.low_stock_alert}`,
    badge: `(${p.stock} left)`,
  })) || [];

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <Calculator open={calculatorOpen} onOpenChange={setCalculatorOpen} />

      <motion.div variants={item} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {shopName}
          </h1>
          <p className="mt-0.5 text-sm text-foreground/70 dark:text-foreground/80">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={kpiRange} onValueChange={(v: KpiRange) => setKpiRange(v)}>
            <SelectTrigger className="w-36 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{t("dashboard.daily")}</SelectItem>
              <SelectItem value="week">{t("dashboard.weekly")}</SelectItem>
              <SelectItem value="month">{t("dashboard.monthly")}</SelectItem>
            </SelectContent>
          </Select>
        <Button
          variant="outline"
          size="default"
          className="h-10 gap-2 shrink-0 rounded-xl border-border bg-card hover:bg-muted hover:border-blue-500/30 dark:hover:border-blue-400/40 transition-colors"
          onClick={() => setCalculatorOpen(true)}
          title="Calculator"
        >
          <CalculatorIcon className="h-5 w-5 text-foreground/70 dark:text-foreground/80 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" strokeWidth={1.5} />
          <span className="hidden sm:inline font-medium">{t("dashboard.calculator")}</span>
        </Button>
        </div>
      </motion.div>

      <motion.div variants={container} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <motion.div key={kpi.title} variants={item}>
            <Card
              className={`group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:bg-muted hover:shadow-md hover:border-primary/20 ${
                kpi.link ? "cursor-pointer" : ""
              }`}
              onClick={
                kpi.link
                  ? () => {
                      playSound("click");
                      navigate(kpi.link! + (kpi.linkRange ? `?range=${kpi.linkRange === "today" ? "daily" : kpi.linkRange === "week" ? "weekly" : "monthly"}` : ""));
                    }
                  : undefined
              }
            >
              <CardContent className="p-5 glass-card">
                <kpi.icon
                  className={`absolute right-4 top-4 h-8 w-8 transition-all duration-200 group-hover:scale-110 ${
                    kpi.title.includes("Sales") || kpi.title.includes("Mauzo")
                      ? "text-blue-500/40 dark:text-blue-400/50 dark:drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                      : kpi.title.includes("Transactions") || kpi.title.includes("Miamala")
                      ? "text-teal-500/40 dark:text-teal-400/50 dark:drop-shadow-[0_0_8px_rgba(20,184,166,0.4)]"
                      : kpi.title.includes("Stock") || kpi.title.includes("Stoki")
                      ? "text-orange-500/40 dark:text-orange-400/50 dark:drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                      : "text-blue-500/40 dark:text-blue-400/50 dark:drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                  }`}
                  strokeWidth={1.5}
                />
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70 dark:text-foreground/80">
                  {kpi.title}
                </p>
                {salesLoading && (kpi.title === t("dashboard.todaySales") || kpi.title === t("dashboard.transactions") || kpi.title === t("dashboard.cashVsMpesa")) ? (
                  <Skeleton className="mt-2 h-8 w-28" />
                ) : (
                  <p className="mt-2 text-2xl font-bold tracking-tight text-foreground dark:text-foreground">
                    {kpi.value}
                  </p>
                )}
                {kpi.link ? (
                  <button
                    className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      playSound("click");
                      navigate(kpi.link! + (kpi.linkRange ? `?range=${kpi.linkRange === "today" ? "daily" : kpi.linkRange === "week" ? "weekly" : "monthly"}` : ""));
                    }}
                  >
                    {kpi.subtitle}
                  </button>
                ) : (
                  <p className="mt-1 text-xs text-foreground/60 dark:text-foreground/70">{kpi.subtitle}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={item} className="grid gap-6 lg:grid-cols-5">
        <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:col-span-3 transition-colors hover:bg-muted hover:border-blue-500/20 glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground dark:text-foreground">
              {t("dashboard.salesTrend")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <Skeleton className="h-[220px] w-full rounded-xl" />
            ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyTrend || []} margin={{ top: 8, right: 16, left: 16, bottom: 4 }}>
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  interval={0}
                  padding={{ left: 12, right: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip
                  formatter={(value: number) => [`Tsh ${formatNumber(value)}`, "Sales"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                  }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  fill="url(#blueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:col-span-2 transition-colors hover:bg-muted hover:border-teal-500/20 glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground dark:text-foreground">
              {t("dashboard.stockByCategory")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <Skeleton className="h-[220px] w-full rounded-xl" />
            ) : (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative h-40 w-40 flex-shrink-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fallbackCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={64}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="transparent"
                    >
                      {fallbackCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/70 dark:text-foreground/80">
                    {t("dashboard.totalItems")}
                  </span>
                  <span className="text-2xl font-bold text-foreground dark:text-foreground">{allProducts?.length || 0}</span>
                </div>
              </div>
              <div className="flex-1 space-y-3 w-full min-w-0">
                {fallbackCategoryData.slice(0, 5).map((cat) => (
                  <div
                    key={cat.name}
                    className="flex items-center gap-2"
                  >
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm text-foreground/70 dark:text-foreground/80 truncate flex-1 min-w-0">
                      {cat.name}
                    </span>
                    <span className="text-sm font-semibold text-foreground dark:text-foreground tabular-nums">
                      {cat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground dark:text-foreground">
              {t("dashboard.alerts")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <EmptyState
                  title={t("dashboard.alerts")}
                  description={t("dashboard.checkInventory")}
                  icon={<AlertTriangle className="h-8 w-8" />}
                />
              ) : (
                alerts.map((alert, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted border border-orange-500/10 dark:border-orange-400/20"
                  >
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-orange-500 dark:bg-orange-400 dark:shadow-[0_0_6px_rgba(249,115,22,0.5)] flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground dark:text-foreground">
                        {alert.title}{" "}
                        <span className="font-bold text-orange-600 dark:text-orange-400">{alert.badge}</span>
                      </p>
                      <p className="text-sm text-foreground/70 dark:text-foreground/80">{alert.subtitle}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap gap-3">
        <Button
          className="gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 font-medium shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] duration-200"
          onClick={() => { playSound("click"); navigate("/sales"); }}
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          {t("dashboard.newSale")}
        </Button>
        <Button
          variant="outline"
          className="gap-2 rounded-xl border-border bg-card hover:bg-muted hover:border-blue-500/30 dark:hover:border-blue-400/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => { playSound("click"); navigate("/inventory/add"); }}
        >
          <Package className="h-4 w-4 text-blue-600 dark:text-blue-400 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" strokeWidth={1.5} />
          {t("dashboard.addProduct")}
        </Button>
        <Button
          variant="outline"
          className="gap-2 rounded-xl border-border bg-card hover:bg-muted hover:border-blue-500/30 dark:hover:border-blue-400/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => { playSound("click"); navigate("/expenses"); }}
        >
          <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" strokeWidth={1.5} />
          {t("dashboard.recordExpense")}
        </Button>
      </motion.div>
    </motion.div>
  );
}
