import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Calendar as CalendarIcon,
  CreditCard,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Package,
  Printer,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSalesByDateRange } from "@/hooks/useSales";
import { useExpensesByDateRange } from "@/hooks/useExpenses";
import { useOtherIncomeByDateRange } from "@/hooks/useOtherIncome";
import { useProducts } from "@/hooks/useProducts";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { exportToCSV, exportToPrintablePDF } from "@/utils/exportData";
import { PageLoader } from "@/components/PageLoader";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

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
  const { formatMoney, formatNumber } = useShopFormatting();
  const [searchParams] = useSearchParams();

  const rangeParam = searchParams.get("range") as DateRangeType | null;
  const [rangeType, setRangeType] = useState<DateRangeType>(
    rangeParam && ["daily", "weekly", "monthly", "custom"].includes(rangeParam) ? rangeParam : "monthly",
  );

  useEffect(() => {
    if (rangeParam && ["daily", "weekly", "monthly", "custom"].includes(rangeParam)) {
      setRangeType(rangeParam);
    }
  }, [rangeParam]);

  const [customRange, setCustomRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 7), to: new Date() });
  const [customOpen, setCustomOpen] = useState(false);
  const [reportTab, setReportTab] = useState<string>("sales");

  const { start, end } = useMemo(
    () => getRangeForType(rangeType, customRange?.from, customRange?.to),
    [rangeType, customRange],
  );

  const { data: sales, isLoading: salesLoading } = useSalesByDateRange(start, end);
  const { data: expenses, isLoading: expensesLoading } = useExpensesByDateRange(start, end);
  const { data: otherIncome, isLoading: otherIncomeLoading } = useOtherIncomeByDateRange(start, end);
  const { data: products, isLoading: productsLoading } = useProducts();

  if (sales === undefined || salesLoading || expensesLoading || otherIncomeLoading || productsLoading) {
    return <PageLoader message="Loading reports..." messageSw="Inapakia ripoti..." language={language} />;
  }

  const totalSales = (sales || []).reduce((sum, s) => sum + Number(s.total || 0), 0);
  const totalOtherIncome = (otherIncome || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalRevenue = totalSales + totalOtherIncome;
  const totalExpenses = (expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const stockValuation = (products || []).reduce((sum, p) => sum + Number(p.buying_price || 0) * Number(p.stock || 0), 0);

  // Payment Breakdown
  const cashTotal = (sales || []).filter((s) => s.payment_method === "Cash").reduce((sum, s) => sum + Number(s.total || 0), 0);
  const mpesaTotal = (sales || []).filter((s) => s.payment_method === "M-Pesa").reduce((sum, s) => sum + Number(s.total || 0), 0);
  const otherPayTotal = totalRevenue - cashTotal - mpesaTotal;

  const paymentChartData = [
    { name: "Cash", value: cashTotal, color: "#1a1d29" },
    { name: "M-Pesa / Mobile", value: mpesaTotal, color: "#d99a4e" },
    { name: "Other", value: otherPayTotal > 0 ? otherPayTotal : 0, color: "#9ca3af" },
  ].filter((p) => p.value > 0);

  // Top Selling Items
  const productSalesMap: Record<string, { name: string; total: number; qty: number }> = {};
  (sales || []).forEach((sale) => {
    ((sale.sale_items as any[]) || []).forEach((item: any) => {
      const key = item.product_name || "Item";
      if (!productSalesMap[key]) {
        productSalesMap[key] = { name: key, total: 0, qty: 0 };
      }
      productSalesMap[key].total += Number(item.total || 0);
      productSalesMap[key].qty += Number(item.quantity || 1);
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const handleExportCSV = () => {
    if (!sales?.length) return;
    exportToCSV(
      sales.map((s) => ({
        ID: s.id,
        Date: format(new Date(s.created_at), "yyyy-MM-dd HH:mm"),
        Customer: (s as any).customer_name || "Walk-in",
        Total: s.total,
        Payment: s.payment_method,
      })),
      `sales-report-${rangeType}`,
    );
  };

  const handlePrintPDF = () => {
    exportToPrintablePDF({
      title: `${language === "sw" ? "Ripoti ya Biashara" : "Business Performance Report"} (${rangeType.toUpperCase()})`,
      period: `${start} to ${end}`,
      stats: [
        { label: language === "sw" ? "Jumla ya Mapato" : "Total Revenue", value: formatMoney(totalRevenue) },
        { label: language === "sw" ? "Jumla ya Matumizi" : "Total Expenses", value: formatMoney(totalExpenses) },
        { label: language === "sw" ? "Faida Halisi" : "Net Profit", value: formatMoney(netProfit) },
      ],
      items: (sales || []).map((s) => ({
        date: format(new Date(s.created_at), "yyyy-MM-dd HH:mm"),
        customer: (s as any).customer_name || "Walk-in",
        method: s.payment_method,
        total: formatMoney(s.total),
      })),
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 4 Olly KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Revenue */}
        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("reports.totalSales")}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <DollarSign className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{formatMoney(totalRevenue)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{sales?.length || 0} sales + {otherIncome?.length || 0} other income</p>
          </div>
        </Card>

        {/* KPI 2: Expenses */}
        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("reports.totalExpenses")}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{formatMoney(totalExpenses)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{expenses?.length || 0} {language === "sw" ? "vipengele vya matumizi" : "expense line items"}</p>
          </div>
        </Card>

        {/* KPI 3: Net Profit */}
        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("reports.netProfit")}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <TrendingUp className="h-4 w-4 text-[var(--success-text)]" />
            </div>
          </div>
          <div className="mt-3">
            <p className={cn("text-2xl font-bold tracking-tight", netProfit >= 0 ? "text-[var(--success-text)]" : "text-destructive")}>
              {formatMoney(netProfit)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {totalSales > 0 ? `${Math.round((netProfit / totalSales) * 100)}% margin` : "0% margin"}
            </p>
          </div>
        </Card>

        {/* KPI 4: Stock Valuation */}
        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("reports.inventoryValue")}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <Package className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{formatMoney(stockValuation)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{products?.length || 0} {language === "sw" ? "bidhaa zilizopo" : "products in stock"}</p>
          </div>
        </Card>
      </div>

      {/* Main Reports Card */}
      <Card className="border border-border bg-card shadow-xs">
        {/* Header Controls */}
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={reportTab} onValueChange={setReportTab}>
            <TabsList className="bg-muted p-1 rounded-xl">
              <TabsTrigger value="sales" className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                {t("reports.salesReport")}
              </TabsTrigger>
              <TabsTrigger value="profit" className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                {t("reports.profitReport")}
              </TabsTrigger>
              <TabsTrigger value="inventory" className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                {t("reports.inventoryReport")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Select value={rangeType} onValueChange={(v: DateRangeType) => setRangeType(v)}>
              <SelectTrigger className="h-9 w-32 rounded-xl border-border bg-background text-xs font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-popover text-xs">
                <SelectItem value="daily">{t("reports.daily")}</SelectItem>
                <SelectItem value="weekly">{t("reports.weekly")}</SelectItem>
                <SelectItem value="monthly">{t("reports.monthly")}</SelectItem>
                <SelectItem value="custom">{t("reports.custom")}</SelectItem>
              </SelectContent>
            </Select>

            {rangeType === "custom" && (
              <Popover open={customOpen} onOpenChange={setCustomOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 rounded-xl border-border text-xs">
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    <span>Custom</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={customRange}
                    onSelect={(val) => {
                      setCustomRange(val);
                      if (val?.from && val?.to) setCustomOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-9 rounded-xl border-border text-xs gap-1"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintPDF}
              className="h-9 rounded-xl border-border text-xs gap-1"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>

        {/* Tab 1: Sales Analysis */}
        {reportTab === "sales" && (
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              {/* Payment Mix Donut */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 lg:col-span-2">
                <h3 className="text-xs font-bold uppercase text-foreground mb-3">{t("reports.paymentMethods")}</h3>
                {paymentChartData.length === 0 ? (
                  <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">
                    {language === "sw" ? "Hakuna data ya malipo" : "No payment data in range"}
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={44}
                            outerRadius={62}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="transparent"
                          >
                            {paymentChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      {paymentChartData.map((p) => (
                        <div key={p.name} className="flex items-center gap-1.5 text-xs">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="text-muted-foreground">{p.name}:</span>
                          <span className="font-semibold text-foreground">{formatMoney(p.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Top Selling Products */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 lg:col-span-3">
                <h3 className="text-xs font-bold uppercase text-foreground mb-3">{t("reports.topSelling")}</h3>
                {topProducts.length === 0 ? (
                  <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">
                    {language === "sw" ? "Hakuna mauzo ya bidhaa" : "No product sales in range"}
                  </div>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    {topProducts.map((p) => {
                      const maxVal = topProducts[0]?.total || 1;
                      const pct = Math.round((p.total / maxVal) * 100);

                      return (
                        <div key={p.name} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-foreground truncate max-w-[200px]">{p.name} ({p.qty} pcs)</span>
                            <span className="font-bold text-foreground">{formatMoney(p.total)}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Transactions Table */}
            <div className="internal-table-scroll rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-xs font-semibold">
                    <TableHead>{t("sales.date")}</TableHead>
                    <TableHead>{t("sales.customer")}</TableHead>
                    <TableHead>{t("sales.paymentMethod")}</TableHead>
                    <TableHead className="text-right">{t("sales.total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(sales || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                        {language === "sw" ? "Hakuna miamala kwenye kipindi hiki." : "No transactions recorded in this range."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (sales || []).slice(0, 15).map((s) => (
                      <TableRow key={s.id} className="text-xs">
                        <TableCell className="font-medium text-foreground">
                          {format(new Date(s.created_at), "MMM d, yyyy · HH:mm")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {(s as any).customer_name || (language === "sw" ? "Moja kwa moja" : "Walk-in")}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-foreground">
                            {s.payment_method}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-foreground">{formatMoney(s.total)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Tab 2: Profit & Loss */}
        {reportTab === "profit" && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <span className="text-xs font-medium text-muted-foreground">{t("reports.grossSales")}</span>
                <p className="mt-2 text-xl font-bold text-foreground">{formatMoney(totalRevenue)}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <span className="text-xs font-medium text-muted-foreground">{t("reports.operatingExpenses")}</span>
                <p className="mt-2 text-xl font-bold text-destructive">-{formatMoney(totalExpenses)}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <span className="text-xs font-medium text-muted-foreground">{t("reports.netProfit")}</span>
                <p className={cn("mt-2 text-xl font-bold", netProfit >= 0 ? "text-[var(--success-text)]" : "text-destructive")}>
                  {formatMoney(netProfit)}
                </p>
              </div>
            </div>

            <div className="internal-table-scroll rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-xs font-semibold">
                    <TableHead>{language === "sw" ? "Aina ya Gharama / Mapato" : "Income / Expense Line"}</TableHead>
                    <TableHead className="text-right">{language === "sw" ? "Kiasi (TSH)" : "Amount"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="text-xs">
                    <TableCell className="font-semibold text-foreground">{language === "sw" ? "Mapato ya Mauzo" : "Sales Revenue"}</TableCell>
                    <TableCell className="text-right font-bold text-[var(--success-text)]">+{formatMoney(totalSales)}</TableCell>
                  </TableRow>
                  <TableRow className="text-xs">
                    <TableCell className="font-semibold text-foreground">{language === "sw" ? "Mapato Mengine" : "Other Income"}</TableCell>
                    <TableCell className="text-right font-bold text-[var(--success-text)]">+{formatMoney(totalOtherIncome)}</TableCell>
                  </TableRow>
                  {(expenses || []).map((e) => (
                    <TableRow key={e.id} className="text-xs">
                      <TableCell className="text-muted-foreground">{e.title || e.category} ({e.category})</TableCell>
                      <TableCell className="text-right font-medium text-destructive">-{formatMoney(e.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 border-border bg-muted/40 text-xs font-bold">
                    <TableCell className="text-foreground">{language === "sw" ? "Faida Halisi ya Biashara" : "Net Business Profit"}</TableCell>
                    <TableCell className={cn("text-right", netProfit >= 0 ? "text-[var(--success-text)]" : "text-destructive")}>
                      {formatMoney(netProfit)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Tab 3: Inventory Health */}
        {reportTab === "inventory" && (
          <div className="p-5 space-y-4">
            <div className="internal-table-scroll rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-xs font-semibold">
                    <TableHead>{t("inventory.code")}</TableHead>
                    <TableHead>{t("inventory.name")}</TableHead>
                    <TableHead className="text-center">{t("inventory.stock")}</TableHead>
                    <TableHead className="text-right">{t("inventory.buyingPrice")}</TableHead>
                    <TableHead className="text-right">{language === "sw" ? "Thamani ya Stoki" : "Total Valuation"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(products || []).map((p) => {
                    const lineVal = Number(p.stock || 0) * Number(p.buying_price || 0);
                    return (
                      <TableRow key={p.id} className="text-xs">
                        <TableCell className="font-bold text-foreground">{p.barcode || p.sku || "PROD"}</TableCell>
                        <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                        <TableCell className="text-center font-bold text-foreground">{p.stock} pcs</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatMoney(p.buying_price)}</TableCell>
                        <TableCell className="text-right font-bold text-foreground">{formatMoney(lineVal)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
