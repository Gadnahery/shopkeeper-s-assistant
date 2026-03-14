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
  ArrowRight,
  Store,
  Sparkles,
  ShieldAlert,
  Boxes,
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
import { useSalesByDateRange, useSalesSummaryByRange } from "@/hooks/useSales";
import { useLowStockProducts, useProducts } from "@/hooks/useProducts";
import { useStockByCategory } from "@/hooks/useShopData";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Calculator } from "@/components/Calculator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { PageLoader } from "@/components/PageLoader";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { buildCategoryChartData, buildSalesTrendData } from "@/pages/dashboard/chartData";

type KpiRange = "today" | "week" | "month" | "custom";

function getRange(r: KpiRange, customRange?: DateRange): { start: string; end: string; labelKey: string } {
  const now = new Date();
  switch (r) {
    case "today":
      return { start: format(startOfDay(now), "yyyy-MM-dd"), end: format(endOfDay(now), "yyyy-MM-dd"), labelKey: "dashboard.daily" };
    case "week":
      return { start: format(startOfWeek(now), "yyyy-MM-dd"), end: format(endOfWeek(now), "yyyy-MM-dd"), labelKey: "dashboard.weekly" };
    case "month":
      return { start: format(startOfMonth(now), "yyyy-MM-dd"), end: format(endOfMonth(now), "yyyy-MM-dd"), labelKey: "dashboard.monthly" };
    case "custom":
      if (customRange?.from && customRange?.to) {
        return {
          start: format(startOfDay(customRange.from), "yyyy-MM-dd"),
          end: format(endOfDay(customRange.to), "yyyy-MM-dd"),
          labelKey: "reports.custom",
        };
      }
      return { start: format(startOfDay(now), "yyyy-MM-dd"), end: format(endOfDay(now), "yyyy-MM-dd"), labelKey: "reports.custom" };
    default:
      return getRange("today", customRange);
  }
}

export default function Dashboard() {
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [kpiRange, setKpiRange] = useState<KpiRange>("today");
  const [customRange, setCustomRange] = useState<DateRange | undefined>({ from: new Date(), to: new Date() });
  const [customOpen, setCustomOpen] = useState(false);
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const range = useMemo(() => getRange(kpiRange, customRange), [kpiRange, customRange]);
  const { data: rangeSales, isLoading: salesLoading } = useSalesSummaryByRange(range.start, range.end);
  const { data: detailedSales, isLoading: detailedSalesLoading } = useSalesByDateRange(range.start, range.end);
  const { data: lowStockProducts, isLoading: lowStockLoading } = useLowStockProducts();
  const { data: allProducts, isLoading: productsLoading } = useProducts();
  const { data: categoryData, isLoading: categoryLoading } = useStockByCategory();

  const shopName = profile?.shops?.name || "Smart Money";
  const formatNumber = (num: number) => num.toLocaleString("en-US");

  const cashPercent = rangeSales?.total ? Math.round((rangeSales.cash / rangeSales.total) * 100) : 0;
  const mpesaPercent = 100 - cashPercent;
  const inventoryCount = allProducts?.length || 0;
  const lowStockCount = lowStockProducts?.length || 0;
  const chartData = useMemo(
    () => buildSalesTrendData(detailedSales, range.start, range.end),
    [detailedSales, range.end, range.start],
  );

  if (
    rangeSales === undefined ||
    detailedSales === undefined ||
    salesLoading ||
    detailedSalesLoading ||
    lowStockLoading ||
    productsLoading ||
    categoryLoading
  ) {
    return <PageLoader message="Loading dashboard..." messageSw="Inapakia dashibodi..." language={language} />;
  }

  const donutColors = ["#0D9488", "#D97706", "#6366F1", "#DB2777", "#0D9488", "#7C3AED"];
  const categoryChartData = buildCategoryChartData(categoryData, donutColors);
  const hasSalesInRange = chartData.some((point) => point.sales > 0);
  const hasCategoryData = categoryChartData.length > 0;

  const spotlightStats = [
    {
      label: language === "sw" ? "Bidhaa zote" : "Products in catalog",
      value: formatNumber(inventoryCount),
      tone: "text-foreground",
      hint: language === "sw" ? "Katalogi hai" : "Live catalog",
    },
    {
      label: language === "sw" ? "Zinahitaji uangalizi" : "Need attention",
      value: formatNumber(lowStockCount),
      tone: lowStockCount > 0 ? "text-orange-600 dark:text-orange-400" : "text-foreground",
      hint: language === "sw" ? "Low stock" : "Low stock",
    },
    {
      label: language === "sw" ? "Mapato ya kipindi" : "Revenue in range",
      value: `TSH ${formatNumber(rangeSales?.total || 0)}`,
      tone: "text-primary",
      hint: language === "sw" ? "Kipindi ulichochagua" : "Selected range",
    },
    {
      label: language === "sw" ? "Fedha taslimu" : "Cash collected",
      value: `TSH ${formatNumber(rangeSales?.cash || 0)}`,
      tone: "text-foreground",
      hint: language === "sw" ? "Leo hadi sasa" : "Cash share",
    },
  ];

  const commandTiles = [
    {
      label: language === "sw" ? "Mauzo ya haraka" : "Fast checkout",
      value: t("dashboard.newSale"),
      caption: language === "sw" ? "Anza kuuza mara moja" : "Start a sale instantly",
      icon: Sparkles,
      className: "border-transparent bg-[linear-gradient(145deg,#0f766e,#0284c7)] text-white shadow-[0_28px_70px_-36px_rgba(2,132,199,0.65)]",
      action: () => { playSound("click"); navigate("/sales"); },
    },
    {
      label: language === "sw" ? "Afya ya stoki" : "Stock health",
      value: `${formatNumber(lowStockCount)}`,
      caption: language === "sw" ? "Bidhaa za kuangaliwa" : "Items needing review",
      icon: ShieldAlert,
      className: "border-border/70 bg-background/72 text-foreground",
      action: () => { playSound("click"); navigate("/inventory"); },
    },
    {
      label: language === "sw" ? "Makundi ya bidhaa" : "Category mix",
      value: `${formatNumber(categoryData?.length || 0)}`,
      caption: language === "sw" ? "Makundi yanayofuatiliwa" : "Tracked categories",
      icon: Boxes,
      className: "border-border/70 bg-background/72 text-foreground",
      action: () => { playSound("click"); navigate("/reports"); },
    },
  ];

  const kpiData = [
    {
      title: t("dashboard.todaySales"),
      value: salesLoading ? "..." : formatNumber(rangeSales?.total || 0),
      subtitle: "TSH",
      icon: LayoutGrid,
      link: "/reports",
      linkRange: kpiRange,
      accent: "from-primary/20 to-primary/5",
    },
    {
      title: t("dashboard.transactions"),
      value: salesLoading ? "..." : (rangeSales?.count || 0).toString(),
      subtitle: t("dashboard.receiptsIssued"),
      icon: FileText,
      link: "/reports",
      linkRange: kpiRange,
      accent: "from-blue-500/20 to-blue-500/5",
    },
    {
      title: t("dashboard.lowStock"),
      value: `${lowStockProducts?.length || 0} ${t("common.items")}`,
      subtitle: t("dashboard.checkInventory"),
      icon: AlertTriangle,
      link: "/inventory",
      accent: "from-orange-500/20 to-orange-500/5",
    },
    {
      title: t("dashboard.cashVsMpesa"),
      value: `${cashPercent}% / ${mpesaPercent}%`,
      subtitle: t("dashboard.paymentSplit"),
      icon: CreditCard,
      link: "/reports",
      linkRange: kpiRange,
      accent: "from-fuchsia-500/20 to-fuchsia-500/5",
    },
  ];

  const alerts = lowStockProducts?.slice(0, 3).map((p) => ({
    title: `Low stock: ${p.name}`,
    subtitle: `${t("inventory.stock")}: ${p.stock} / Alert: ${p.low_stock_alert}`,
    badge: `(${p.stock} left)`,
  })) || [];

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
  const rangeLabel =
    kpiRange === "custom" && customRange?.from && customRange?.to
      ? `${format(customRange.from, "dd MMM")} - ${format(customRange.to, "dd MMM yyyy")}`
      : t(range.labelKey);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <Calculator open={calculatorOpen} onOpenChange={setCalculatorOpen} />

      <motion.section variants={item} className="section-shell relative max-w-full overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.22),transparent_34%),radial-gradient(circle_at_bottom_left,hsl(var(--accent-foreground)/0.08),transparent_28%)]" />
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.92fr)]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-primary">
                  <Store className="mr-1.5 h-3.5 w-3.5" />
                  {language === "sw" ? "Muhtasari wa Leo" : "Daily command center"}
                </Badge>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {shopName}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
                    {t("dashboard.subtitle")}
                  </p>
                </div>
              </div>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <Select value={kpiRange} onValueChange={(v: KpiRange) => setKpiRange(v)}>
                  <SelectTrigger className="h-11 w-full rounded-2xl border-border/70 bg-background/70 sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">{t("dashboard.daily")}</SelectItem>
                    <SelectItem value="week">{t("dashboard.weekly")}</SelectItem>
                    <SelectItem value="month">{t("dashboard.monthly")}</SelectItem>
                    <SelectItem value="custom">{t("reports.custom")}</SelectItem>
                  </SelectContent>
                </Select>
                {kpiRange === "custom" ? (
                  <Popover open={customOpen} onOpenChange={setCustomOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-11 w-full rounded-2xl border-border/70 bg-background/75 sm:w-auto">
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        <span className="truncate">{rangeLabel}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="range"
                        numberOfMonths={2}
                        selected={customRange}
                        onSelect={(value) => {
                          setCustomRange(value);
                          if (value?.from && value?.to) {
                            setCustomOpen(false);
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                ) : null}
                <Button
                  variant="outline"
                  size="default"
                  className="h-11 w-full rounded-2xl border-border/70 bg-background/75 sm:w-auto"
                  onClick={() => setCalculatorOpen(true)}
                  title="Calculator"
                >
                  <CalculatorIcon className="h-5 w-5 text-foreground/70" strokeWidth={1.5} />
                  <span className="font-medium">{t("dashboard.calculator")}</span>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              {spotlightStats.map((stat) => (
                <div key={stat.label} className="rounded-[1.3rem] border border-border/60 bg-background/68 p-4 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className={`mt-3 text-2xl font-bold ${stat.tone}`}>{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {commandTiles.map((tile) => (
              <button
                key={tile.label}
                className={`rounded-[1.4rem] border p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/20 ${tile.className}`}
                onClick={tile.action}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] opacity-80">{tile.label}</span>
                  <tile.icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-2xl font-bold">{tile.value}</p>
                <div className="mt-2 flex items-center text-sm font-medium opacity-85">
                  <span>{tile.caption}</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.div variants={container} className="responsive-grid-wide">
        {kpiData.map((kpi) => (
          <motion.div key={kpi.title} variants={item}>
            <Card
              className={`group relative overflow-hidden border-border/70 bg-card/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-card ${
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
              <div className={`absolute inset-0 bg-gradient-to-br ${kpi.accent} opacity-100`} />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--card)/0.15),hsl(var(--card)/0.76))]" />
              <CardContent className="relative p-5">
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
        <Card className="section-shell overflow-hidden lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground dark:text-foreground">
              {t("dashboard.salesTrend")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <Skeleton className="h-[220px] w-full rounded-xl" />
            ) : !hasSalesInRange ? (
              <EmptyState
                title={language === "sw" ? "Hakuna mauzo kwenye kipindi hiki" : "No sales in this range"}
                description={language === "sw" ? "Jaribu kuchagua kipindi kingine au ongeza mauzo mapya." : "Try a different range or record new sales to populate the trend chart."}
                icon={<LayoutGrid className="h-8 w-8" />}
              />
            ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 16, bottom: 4 }}>
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  minTickGap={24}
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

        <Card className="section-shell overflow-hidden lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground dark:text-foreground">
              {t("dashboard.stockByCategory")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <Skeleton className="h-[220px] w-full rounded-xl" />
            ) : !hasCategoryData ? (
              <EmptyState
                title={language === "sw" ? "Hakuna data ya makundi" : "No category data yet"}
                description={language === "sw" ? "Ongeza bidhaa zenye makundi ili mchoro huu uonekane vizuri." : "Add categorized products to populate the stock distribution chart."}
                icon={<Boxes className="h-8 w-8" />}
              />
            ) : (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative h-40 w-40 flex-shrink-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={64}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="transparent"
                    >
                      {categoryChartData.map((entry, index) => (
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
                {categoryChartData.slice(0, 5).map((cat) => (
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
        <Card className="section-shell overflow-hidden">
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

      <motion.div variants={item} className="grid gap-3 sm:grid-cols-3">
        <Button
          className="h-12 gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-blue-600 font-medium"
          onClick={() => { playSound("click"); navigate("/sales"); }}
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          {t("dashboard.newSale")}
        </Button>
        <Button
          variant="outline"
          className="h-12 gap-2 rounded-2xl border-border/70 bg-background/70"
          onClick={() => { playSound("click"); navigate("/inventory/add"); }}
        >
          <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
          {t("dashboard.addProduct")}
        </Button>
        <Button
          variant="outline"
          className="h-12 gap-2 rounded-2xl border-border/70 bg-background/70"
          onClick={() => { playSound("click"); navigate("/expenses"); }}
        >
          <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
          {t("dashboard.recordExpense")}
        </Button>
      </motion.div>
    </motion.div>
  );
}
