import { useNavigate } from "react-router-dom";
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
import { useTodaySales } from "@/hooks/useSales";
import { useLowStockProducts, useProducts } from "@/hooks/useProducts";
import { useWeeklySalesTrend, useStockByCategory } from "@/hooks/useShopData";
import { motion } from "framer-motion";
import { useState } from "react";
import { Calculator } from "@/components/Calculator";

const PRIMARY_TEAL = "#0D9488";
const PRIMARY_GRADIENT = "url(#primaryGradient)";

export default function Dashboard() {
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { profile } = useAuth();
  const { data: todaySales, isLoading: salesLoading } = useTodaySales();
  const { data: lowStockProducts } = useLowStockProducts();
  const { data: allProducts } = useProducts();
  const { data: weeklyTrend } = useWeeklySalesTrend();
  const { data: categoryData } = useStockByCategory();

  const shopName = profile?.shops?.name || "Smart Money";
  const formatNumber = (num: number) => num.toLocaleString("en-US");

  const cashPercent = todaySales?.total ? Math.round((todaySales.cash / todaySales.total) * 100) : 0;
  const mpesaPercent = 100 - cashPercent;

  const donutColors = ["#0D9488", "#D97706", "#6366F1", "#DB2777", "#0D9488", "#7C3AED"];
  const fallbackCategoryData = categoryData?.length
    ? categoryData.map((c, i) => ({ ...c, color: donutColors[i % donutColors.length] }))
    : [{ name: "No data", value: 1, color: "#374151" }];

  const kpiData = [
    {
      title: t("dashboard.todaySales"),
      value: salesLoading ? "..." : formatNumber(todaySales?.total || 0),
      subtitle: "TSH",
      icon: LayoutGrid,
      link: "/reports",
      linkDaily: true,
    },
    {
      title: t("dashboard.transactions"),
      value: salesLoading ? "..." : (todaySales?.count || 0).toString(),
      subtitle: t("dashboard.receiptsIssued"),
      icon: FileText,
      link: "/reports",
      linkDaily: true,
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
      linkDaily: true,
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

      <motion.div variants={item} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {shopName}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-xl border-border bg-card hover:bg-muted hover:border-primary/30 transition-colors"
          onClick={() => setCalculatorOpen(true)}
          title="Calculator"
        >
          <CalculatorIcon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
        </Button>
      </motion.div>

      <motion.div variants={container} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <motion.div key={kpi.title} variants={item}>
            <Card
              className={`group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:bg-muted hover:shadow-md ${
                kpi.link ? "cursor-pointer" : ""
              }`}
              onClick={
                kpi.link
                  ? () => navigate(kpi.link! + (kpi.linkDaily ? "?range=daily" : ""))
                  : undefined
              }
            >
              <CardContent className="p-5">
                <kpi.icon
                  className="absolute right-4 top-4 h-8 w-8 text-primary/20 transition-opacity duration-200 group-hover:opacity-35"
                  strokeWidth={1.5}
                />
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {kpi.title}
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {kpi.value}
                </p>
                {kpi.link ? (
                  <button
                    className="mt-1 text-xs font-medium text-primary hover:text-primary/90 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(kpi.link! + (kpi.linkDaily ? "?range=daily" : ""));
                    }}
                  >
                    {kpi.subtitle}
                  </button>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">{kpi.subtitle}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={item} className="grid gap-6 lg:grid-cols-5">
        <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:col-span-3 transition-colors hover:bg-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">
              {t("dashboard.salesTrend")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyTrend || []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PRIMARY_TEAL} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={PRIMARY_TEAL} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
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
                  stroke={PRIMARY_TEAL}
                  strokeWidth={2}
                  fill={PRIMARY_GRADIENT}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:col-span-2 transition-colors hover:bg-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">
              {t("dashboard.stockByCategory")}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("dashboard.totalItems")}
                  </span>
                  <span className="text-2xl font-bold text-foreground">{allProducts?.length || 0}</span>
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
                    <span className="text-sm text-muted-foreground truncate flex-1 min-w-0">
                      {cat.name}
                    </span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      {cat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">
              {t("dashboard.alerts")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No alerts at this time.</p>
              ) : (
                alerts.map((alert, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted"
                  >
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {alert.title}{" "}
                        <span className="font-semibold text-primary">{alert.badge}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">{alert.subtitle}</p>
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
          className="gap-2 rounded-xl bg-primary hover:bg-primary/90 font-medium"
          onClick={() => navigate("/sales")}
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          {t("dashboard.newSale")}
        </Button>
        <Button
          variant="outline"
          className="gap-2 rounded-xl border-border bg-card hover:bg-muted hover:border-primary/30"
          onClick={() => navigate("/inventory/add")}
        >
          <Package className="h-4 w-4" strokeWidth={1.5} />
          {t("dashboard.addProduct")}
        </Button>
        <Button
          variant="outline"
          className="gap-2 rounded-xl border-border bg-card hover:bg-muted hover:border-primary/30"
          onClick={() => navigate("/expenses")}
        >
          <Receipt className="h-4 w-4" strokeWidth={1.5} />
          {t("dashboard.recordExpense")}
        </Button>
      </motion.div>
    </motion.div>
  );
}
