import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid, FileText, AlertTriangle, CreditCard,
  Plus, Package, Receipt, Loader2,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTodaySales } from "@/hooks/useSales";
import { useLowStockProducts, useProducts } from "@/hooks/useProducts";
import { useWeeklySalesTrend, useStockByCategory } from "@/hooks/useShopData";
import { motion } from "framer-motion";

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: todaySales, isLoading: salesLoading } = useTodaySales();
  const { data: lowStockProducts } = useLowStockProducts();
  const { data: allProducts } = useProducts();
  const { data: weeklyTrend } = useWeeklySalesTrend();
  const { data: categoryData } = useStockByCategory();

  const formatNumber = (num: number) => num.toLocaleString("en-US");

  const cashPercent = todaySales?.total ? Math.round((todaySales.cash / todaySales.total) * 100) : 0;
  const mpesaPercent = 100 - cashPercent;

  const fallbackCategoryData = categoryData?.length ? categoryData : [
    { name: "No data", value: 1, color: "hsl(220, 14%, 80%)" },
  ];

  const kpiData = [
    {
      title: t("dashboard.todaySales"),
      value: salesLoading ? "..." : formatNumber(todaySales?.total || 0),
      subtitle: "TSH • All payment methods",
      icon: LayoutGrid,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: t("dashboard.transactions"),
      value: salesLoading ? "..." : (todaySales?.count || 0).toString(),
      subtitle: t("dashboard.receiptsIssued"),
      icon: FileText,
      iconBg: "bg-secondary/10",
      iconColor: "text-secondary",
    },
    {
      title: t("dashboard.lowStock"),
      value: `${lowStockProducts?.length || 0} ${t("common.items")}`,
      subtitle: t("dashboard.checkInventory"),
      icon: AlertTriangle,
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
      link: true,
    },
    {
      title: t("dashboard.cashVsMpesa"),
      value: `${cashPercent}% / ${mpesaPercent}%`,
      subtitle: t("dashboard.paymentSplit"),
      icon: CreditCard,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
  ];

  const alerts = lowStockProducts?.slice(0, 3).map((p) => ({
    title: `Low stock: ${p.name}`,
    subtitle: `${t("inventory.stock")}: ${p.stock} / Alert: ${p.low_stock_alert}`,
    badge: `(${p.stock} left)`,
  })) || [];

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-foreground">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
      </motion.div>

      <motion.div variants={container} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <motion.div key={kpi.title} variants={item}>
            <Card className="h-full">
              <CardContent className="p-4 md:p-6">
                <div className={`mb-3 inline-flex rounded-lg p-2 ${kpi.iconBg}`}>
                  <kpi.icon className={`h-4 w-4 md:h-5 md:w-5 ${kpi.iconColor}`} />
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">{kpi.title}</p>
                <p className="mt-1 text-lg md:text-2xl font-bold text-foreground">{kpi.value}</p>
                {kpi.link ? (
                  <button className="mt-1 text-xs md:text-sm font-medium text-destructive hover:underline" onClick={() => navigate("/inventory")}>
                    {kpi.subtitle}
                  </button>
                ) : (
                  <p className="mt-1 text-xs md:text-sm text-muted-foreground">{kpi.subtitle}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={item} className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">{t("dashboard.salesTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyTrend || []}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis hide />
                <Tooltip formatter={(value: number) => [`Tsh ${formatNumber(value)}`, 'Sales']} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{t("dashboard.stockByCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative h-36 w-36 md:h-40 md:w-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={fallbackCategoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                      {fallbackCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-muted-foreground">{t("dashboard.totalItems")}</span>
                  <span className="text-lg font-bold">{allProducts?.length || 0}</span>
                </div>
              </div>
              <div className="space-y-2 w-full">
                {fallbackCategoryData.slice(0, 5).map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm text-muted-foreground truncate">{cat.name}</span>
                    <span className="ml-auto text-sm font-medium">{cat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{t("dashboard.alerts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No alerts at this time.</p>
              ) : (
                alerts.map((alert, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-destructive flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {alert.title} <span className="font-semibold text-destructive">{alert.badge}</span>
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
        <Button className="gap-2" onClick={() => navigate("/sales")}>
          <Plus className="h-4 w-4" />
          {t("dashboard.newSale")}
        </Button>
        <Button className="gap-2 bg-secondary hover:bg-secondary/90" onClick={() => navigate("/inventory/add")}>
          <Package className="h-4 w-4" />
          {t("dashboard.addProduct")}
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => navigate("/expenses")}>
          <Receipt className="h-4 w-4" />
          {t("dashboard.recordExpense")}
        </Button>
      </motion.div>
    </motion.div>
  );
}