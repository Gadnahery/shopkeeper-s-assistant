import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, FileText, FileSpreadsheet, Loader2, Package, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSalesByDateRange } from "@/hooks/useSales";
import { useExpensesByDateRange } from "@/hooks/useExpenses";
import { useProducts } from "@/hooks/useProducts";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { exportToCSV, exportToPrintablePDF } from "@/utils/exportData";
import { PageLoader } from "@/components/PageLoader";
import { motion } from "framer-motion";

type DateRangeType = "daily" | "weekly" | "monthly" | "custom";

function getRangeForType(type: DateRangeType, customStart?: Date, customEnd?: Date): { start: string; end: string } {
  const now = new Date();
  switch (type) {
    case "daily":
      return { start: format(startOfDay(now), "yyyy-MM-dd"), end: format(endOfDay(now), "yyyy-MM-dd") };
    case "weekly":
      return { start: format(startOfWeek(now), "yyyy-MM-dd"), end: format(endOfWeek(now), "yyyy-MM-dd") };
    case "monthly":
      return { start: format(startOfMonth(now), "yyyy-MM-dd"), end: format(endOfMonth(now), "yyyy-MM-dd") };
    case "custom":
      if (customStart && customEnd) {
        return { start: format(customStart, "yyyy-MM-dd"), end: format(customEnd, "yyyy-MM-dd") };
      }
      return { start: format(subDays(now, 7), "yyyy-MM-dd"), end: format(now, "yyyy-MM-dd") };
    default:
      return { start: format(startOfMonth(now), "yyyy-MM-dd"), end: format(endOfMonth(now), "yyyy-MM-dd") };
  }
}

export default function Reports() {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const rangeParam = searchParams.get("range") as DateRangeType | null;
  const [rangeType, setRangeType] = useState<DateRangeType>(rangeParam && ["daily", "weekly", "monthly", "custom"].includes(rangeParam) ? rangeParam : "monthly");
  useEffect(() => {
    if (rangeParam && ["daily", "weekly", "monthly", "custom"].includes(rangeParam)) setRangeType(rangeParam);
  }, [rangeParam]);
  const [customStart, setCustomStart] = useState<Date | undefined>(subDays(new Date(), 7));
  const [customEnd, setCustomEnd] = useState<Date | undefined>(new Date());
  const [customOpen, setCustomOpen] = useState(false);
  const [reportTab, setReportTab] = useState<"sales" | "inventory" | "profit">("sales");

  const { start, end } = useMemo(
    () => getRangeForType(rangeType, customStart, customEnd),
    [rangeType, customStart, customEnd]
  );

  const { data: sales, isLoading } = useSalesByDateRange(start, end);
  const { data: expenses } = useExpensesByDateRange(start, end);
  const { data: products } = useProducts();

  if (sales === undefined || isLoading) {
    return <PageLoader message="Loading reports..." messageSw="Inapakia ripoti..." language={language} />;
  }

  const formatNumber = (num: number) => num.toLocaleString("en-US");
  const formatK = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  const totalSales = sales?.reduce((sum, s) => sum + Number(s.total), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const profit = totalSales - totalExpenses;
  const stockValue = products?.reduce((sum, p) => sum + Number(p.buying_price) * Number(p.stock), 0) || 0;
  const lowStockCount = products?.filter((p) => p.stock <= p.low_stock_alert).length || 0;
  const cashTotal = sales?.filter((s) => s.payment_method === "Cash").reduce((sum, s) => sum + Number(s.total), 0) || 0;
  const mpesaTotal = sales?.filter((s) => s.payment_method === "M-Pesa").reduce((sum, s) => sum + Number(s.total), 0) || 0;

  const productSales: Record<string, number> = {};
  sales?.forEach((sale) => {
    (sale.sale_items as any[])?.forEach((item: any) => {
      productSales[item.product_name] = (productSales[item.product_name] || 0) + Number(item.total);
    });
  });

  const bestSellingProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount], index) => ({
      name,
      amount,
      percentage: index === 0 ? 100 : Math.round((amount / (Object.values(productSales)[0] || 1)) * 100),
    }));

  const recentTransactions =
    sales?.slice(0, 10).map((sale) => ({
      date: format(new Date(sale.created_at), "dd MMM, hh:mm a"),
      invoice: sale.invoice_number,
      customer: (sale as any).customer_name || (sale.customers as any)?.name || t("sales.walkIn"),
      amount: Number(sale.total),
      payment: sale.payment_method,
      status: sale.status,
    })) || [];

  const handleExportCSV = () => {
    if (!recentTransactions.length) return;
    exportToCSV(recentTransactions, "sales_report");
  };

  const handleExportPDF = () => {
    if (!recentTransactions.length) return;
    exportToPrintablePDF(
      t("reports.salesSummary"),
      [t("expenses.date"), t("sales.invoice"), t("reports.customer"), t("reports.amountTsh"), t("reports.payment"), t("reports.status")],
      recentTransactions.map((tx) => [tx.date, tx.invoice, tx.customer, formatNumber(tx.amount), tx.payment, tx.status])
    );
  };

  const rangeLabel =
    rangeType === "daily"
      ? format(new Date(), "dd MMM yyyy")
      : rangeType === "weekly"
        ? `${format(new Date(start), "dd MMM")} - ${format(new Date(end), "dd MMM yyyy")}`
        : rangeType === "monthly"
          ? format(new Date(start), "MMMM yyyy")
          : `${format(customStart!, "dd MMM")} - ${format(customEnd!, "dd MMM yyyy")}`;

  const categoryColors = ["hsl(160, 65%, 50%)", "hsl(36, 100%, 50%)", "hsl(220, 13%, 25%)", "hsl(220, 14%, 80%)"];
  const categoryData = Object.entries(productSales)
    .slice(0, 4)
    .map(([name, value], i) => ({ name, value, color: categoryColors[i % categoryColors.length] }));

  // Sales trend: daily totals for the period
  const salesByDate: Record<string, number> = {};
  sales?.forEach((s) => {
    const d = format(new Date(s.created_at), "yyyy-MM-dd");
    salesByDate[d] = (salesByDate[d] || 0) + Number(s.total);
  });
  const trendData = Object.entries(salesByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date: format(new Date(date), "dd MMM"), amount }));

  // Top customers by spend
  const customerSpend: Record<string, { name: string; total: number }> = {};
  sales?.forEach((s) => {
    const custId = (s as any).customer_id || "walk-in";
    const name = (s as any).customer_name || (s.customers as any)?.name || t("sales.walkIn");
    if (!customerSpend[custId]) customerSpend[custId] = { name, total: 0 };
    customerSpend[custId].total += Number(s.total);
  });
  const topCustomers = Object.entries(customerSpend)
    .map(([, v]) => v)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Expense breakdown by category
  const expenseByCategory: Record<string, number> = {};
  expenses?.forEach((e) => {
    const cat = (e as any).category || t("reports.noData");
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(e.amount);
  });
  const expenseData = Object.entries(expenseByCategory).map(([name, value], i) => ({
    name,
    value,
    color: categoryColors[i % categoryColors.length],
  }));

  const lowStockProducts = products?.filter((p) => p.stock <= (p.low_stock_alert ?? 5)).slice(0, 15) || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Select value={rangeType} onValueChange={(v: DateRangeType) => setRangeType(v)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{t("reports.daily")}</SelectItem>
              <SelectItem value="weekly">{t("reports.weekly")}</SelectItem>
              <SelectItem value="monthly">{t("reports.monthly")}</SelectItem>
              <SelectItem value="custom">{t("reports.custom")}</SelectItem>
            </SelectContent>
          </Select>
          {rangeType === "custom" && (
            <Popover open={customOpen} onOpenChange={setCustomOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {rangeLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto">
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm font-medium">{t("reports.from")}</p>
                    <Calendar mode="single" selected={customStart} onSelect={(d) => d && setCustomStart(d)} />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">{t("reports.to")}</p>
                    <Calendar mode="single" selected={customEnd} onSelect={(d) => d && setCustomEnd(d)} />
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all" 
                    onClick={() => setCustomOpen(false)}
                  >
                    {t("common.save")}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
          {rangeType !== "custom" && (
            <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
              <CalendarIcon className="h-4 w-4 text-foreground/60 dark:text-foreground/70 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
              <span className="text-sm">{rangeLabel}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 hover:border-blue-500/30 dark:hover:border-blue-400/40" onClick={handleExportPDF}>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
            {t("reports.exportPdf")}
          </Button>
          <Button variant="outline" className="gap-2 hover:border-blue-500/30 dark:hover:border-blue-400/40" onClick={handleExportCSV}>
            <FileSpreadsheet className="h-4 w-4 text-blue-600 dark:text-blue-400 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
            {t("reports.exportExcel")}
          </Button>
        </div>
      </div>

      <Tabs value={reportTab} onValueChange={(v) => setReportTab(v as "sales" | "inventory" | "profit")}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="sales" className="gap-2">
            <FileText className="h-4 w-4 dark:drop-shadow-[0_0_3px_rgba(59,130,246,0.2)]" />
            {t("reports.salesTab")}
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="h-4 w-4 dark:drop-shadow-[0_0_3px_rgba(20,184,166,0.2)]" />
            {t("reports.inventoryTab")}
          </TabsTrigger>
          <TabsTrigger value="profit" className="gap-2">
            <TrendingUp className="h-4 w-4 dark:drop-shadow-[0_0_3px_rgba(34,197,94,0.2)]" />
            {t("reports.profitLoss")}
          </TabsTrigger>
        </TabsList>

      <TabsContent value="sales" className="space-y-6 mt-6">
      <Card>
        <CardContent className="p-4 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70 dark:text-foreground/80">{t("reports.salesPeriod")}</p>
          <p className="mt-2 text-2xl md:text-3xl font-bold text-foreground dark:text-foreground">Tsh {formatNumber(totalSales)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4 md:gap-6">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-teal-500 dark:bg-teal-400 dark:shadow-[0_0_6px_rgba(20,184,166,0.5)]" />
              <span className="text-sm font-semibold text-foreground dark:text-foreground">{formatNumber(cashTotal)}</span>
              <span className="text-sm text-foreground/70 dark:text-foreground/80">{t("sales.cash")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500 dark:bg-blue-400 dark:shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
              <span className="text-sm font-semibold text-foreground dark:text-foreground">{formatNumber(mpesaTotal)}</span>
              <span className="text-sm text-foreground/70 dark:text-foreground/80">{t("sales.mpesa")}</span>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border/50 p-3 hover:border-orange-500/20 dark:hover:border-orange-400/30 transition-colors">
              <p className="text-xs text-foreground/70 dark:text-foreground/80">{t("reports.expenses")}</p>
              <p className="text-lg font-bold text-destructive dark:text-destructive">Tsh {formatNumber(totalExpenses)}</p>
            </div>
            <div className="rounded-lg border border-border/50 p-3 hover:border-green-500/20 dark:hover:border-green-400/30 transition-colors">
              <p className="text-xs text-foreground/70 dark:text-foreground/80">{t("reports.netProfit")}</p>
              <p className={`text-lg font-bold ${profit >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive dark:text-destructive"}`}>Tsh {formatNumber(profit)}</p>
            </div>
            <div className="rounded-lg border border-border/50 p-3 hover:border-blue-500/20 dark:hover:border-blue-400/30 transition-colors">
              <p className="text-xs text-foreground/70 dark:text-foreground/80">{t("reports.inventoryValuation")}</p>
              <p className="text-lg font-bold text-foreground dark:text-foreground">Tsh {formatNumber(stockValue)}</p>
            </div>
            <div className="rounded-lg border border-border/50 p-3 hover:border-orange-500/20 dark:hover:border-orange-400/30 transition-colors">
              <p className="text-xs text-foreground/70 dark:text-foreground/80">{t("reports.lowStock")}</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{lowStockCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Trend Chart */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{t("reports.salesTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatK(v)} />
                  <Tooltip formatter={(v: number) => [`Tsh ${formatNumber(v)}`, ""]} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{t("reports.bestSelling")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : bestSellingProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-foreground/70 dark:text-foreground/80">{t("reports.noSalesData")}</p>
            ) : (
              bestSellingProducts.map((product) => (
                <div key={product.name} className="flex items-center gap-4">
                  <span className="w-28 truncate text-sm md:w-32">{product.name}</span>
                  <div className="flex-1">
                    <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${product.percentage}%` }} />
                    </div>
                  </div>
                  <span className="w-16 text-right text-sm font-medium">{formatK(product.amount)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{t("reports.topCustomers")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCustomers.length === 0 ? (
              <p className="py-8 text-center text-sm text-foreground/70 dark:text-foreground/80">{t("reports.noSalesData")}</p>
            ) : (
              topCustomers.map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <span className="truncate text-sm">{c.name}</span>
                  <span className="font-medium">Tsh {formatNumber(c.total)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{t("reports.salesByCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-8 md:flex-row">
              <div className="h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData.length ? categoryData : [{ name: t("reports.noData"), value: 1, color: "#ccc" }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {(categoryData.length ? categoryData : [{ name: t("reports.noData"), value: 1, color: "#ccc" }]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">{t("reports.recentTransactions")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("expenses.date")}</TableHead>
                    <TableHead>{t("sales.invoice")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("reports.customer")}</TableHead>
                    <TableHead>{t("reports.amount")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("reports.payment")}</TableHead>
                    <TableHead>{t("reports.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-foreground/70 dark:text-foreground/80">
                        {t("reports.noSalesYet")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentTransactions.map((tx, index) => (
                      <TableRow key={index}>
                        <TableCell className="whitespace-nowrap text-foreground/70 dark:text-foreground/80">{tx.date}</TableCell>
                        <TableCell className="font-medium">{tx.invoice}</TableCell>
                        <TableCell className="hidden md:table-cell">{tx.customer}</TableCell>
                        <TableCell className="font-medium">{formatNumber(tx.amount)}</TableCell>
                        <TableCell className="hidden md:table-cell">{tx.payment}</TableCell>
                        <TableCell>
                          <Badge className="bg-success/10 text-success hover:bg-success/20">{t("reports.completed")}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="inventory" className="space-y-6 mt-6">
        <Card>
          <CardHeader><CardTitle>{t("reports.inventoryValuation")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-foreground/70 dark:text-foreground/80">{t("reports.totalValue")}</p>
                <p className="text-2xl font-bold text-foreground dark:text-foreground">Tsh {formatNumber(stockValue)}</p>
              </div>
              <div className="rounded-lg border border-border/50 p-4 hover:border-blue-500/20 dark:hover:border-blue-400/30 transition-colors">
                <p className="text-sm text-foreground/70 dark:text-foreground/80">{t("reports.totalProducts")}</p>
                <p className="text-2xl font-bold text-foreground dark:text-foreground">{products?.length ?? 0}</p>
              </div>
              <div className="rounded-lg border border-border/50 p-4 hover:border-orange-500/20 dark:hover:border-orange-400/30 transition-colors">
                <p className="text-sm text-foreground/70 dark:text-foreground/80">{t("reports.lowStock")}</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{lowStockCount}</p>
              </div>
              <div className="rounded-lg border border-border/50 p-4 hover:border-red-500/20 dark:hover:border-red-400/30 transition-colors">
                <p className="text-sm text-foreground/70 dark:text-foreground/80">{t("reports.outOfStock")}</p>
                <p className="text-2xl font-bold text-destructive">{products?.filter((p) => p.stock <= 0).length ?? 0}</p>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="mb-2 font-medium">{t("reports.lowStockProducts")}</h4>
              <div className="max-h-64 overflow-auto rounded-lg border">
                <Table>
                  <TableHeader><TableRow><TableHead>{t("reports.product")}</TableHead><TableHead>{t("inventory.stock")}</TableHead><TableHead>{t("reports.cost")}</TableHead><TableHead>{t("reports.value")}</TableHead><TableHead>{t("inventory.low")}</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {lowStockProducts.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="py-8 text-center text-foreground/70 dark:text-foreground/80">{t("reports.noData")}</TableCell></TableRow>
                    ) : lowStockProducts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{language === "sw" && p.name_sw ? p.name_sw : p.name}</TableCell>
                        <TableCell>{p.stock}</TableCell>
                        <TableCell>Tsh {formatNumber(Number(p.buying_price))}</TableCell>
                        <TableCell className="font-medium">Tsh {formatNumber(Number(p.buying_price) * p.stock)}</TableCell>
                        <TableCell><Badge variant="destructive" className="text-xs">{t("inventory.low")}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="mb-2 font-medium">{t("reports.valueByProduct")}</h4>
              <div className="max-h-64 overflow-auto rounded-lg border">
                <Table>
                  <TableHeader><TableRow><TableHead>{t("reports.product")}</TableHead><TableHead>{t("inventory.stock")}</TableHead><TableHead>{t("reports.cost")}</TableHead><TableHead>{t("reports.value")}</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {products?.slice(0, 20).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{language === "sw" && p.name_sw ? p.name_sw : p.name}</TableCell>
                        <TableCell>{p.stock}</TableCell>
                        <TableCell>Tsh {formatNumber(Number(p.buying_price))}</TableCell>
                        <TableCell className="font-medium">Tsh {formatNumber(Number(p.buying_price) * p.stock)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="profit" className="space-y-6 mt-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>{t("reports.profitAndLoss")}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between border-b py-3">
                  <span className="font-medium">{t("reports.salesRevenue")}</span>
                  <span className="font-bold text-green-600">Tsh {formatNumber(totalSales)}</span>
                </div>
                <div className="flex justify-between border-b py-3">
                  <span className="font-medium">{t("reports.expenses")}</span>
                  <span className="font-bold text-destructive">- Tsh {formatNumber(totalExpenses)}</span>
                </div>
                <div className="flex justify-between py-4 text-lg font-bold">
                  <span>{t("reports.netProfit")}</span>
                  <span className={profit >= 0 ? "text-green-600" : "text-destructive"}>Tsh {formatNumber(profit)}</span>
                </div>
                {totalSales > 0 && (
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-foreground/70 dark:text-foreground/80">{t("reports.profitMargin")}</p>
                    <p className="text-2xl font-bold">{(100 * profit / totalSales).toFixed(1)}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t("reports.expenseBreakdown")}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-6 md:flex-row">
                <div className="h-40 w-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseData.length ? expenseData : [{ name: t("reports.noData"), value: 1, color: "#ccc" }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        dataKey="value"
                      >
                        {(expenseData.length ? expenseData : [{ name: t("reports.noData"), value: 1, color: "#ccc" }]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {expenseData.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm">{cat.name}</span>
                      </span>
                      <span className="text-sm font-medium">Tsh {formatNumber(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      </Tabs>
    </motion.div>
  );
}
