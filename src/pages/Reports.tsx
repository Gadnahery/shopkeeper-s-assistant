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
import { calculatePnL } from "@/lib/financials";
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

  const pnl = useMemo(() => {
    return calculatePnL(sales || [], expenses || [], otherIncome || []);
  }, [sales, expenses, otherIncome]);

  const totalSales = pnl.grossSales;
  const netRevenue = pnl.revenue;
  const cogs = pnl.cogs;
  const grossProfit = pnl.grossProfit;
  const totalExpenses = pnl.totalExpenses;
  const totalOtherIncome = pnl.totalOtherIncome;
  const netProfit = pnl.netProfit;
  const taxCollected = pnl.taxCollected;
  const netMargin = pnl.netMargin;
  const stockValuation = (products || []).reduce((sum, p) => sum + Number(p.buying_price || 0) * Number(p.stock || 0), 0);

  // Payment Breakdown including Split and Credit
  const cashTotal = (sales || []).reduce((sum, s) => {
    const m = String(s.payment_method || "").toLowerCase();
    if (m === "cash") return sum + Number(s.total || 0);
    if (m === "split") return sum + Number(s.cash_amount || 0);
    return sum;
  }, 0);

  const mpesaTotal = (sales || []).reduce((sum, s) => {
    const m = String(s.payment_method || "").toLowerCase();
    if (m === "m-pesa" || m === "mpesa") return sum + Number(s.total || 0);
    if (m === "split") return sum + Number(s.mpesa_amount || 0);
    return sum;
  }, 0);

  const creditTotal = (sales || []).reduce((sum, s) => {
    const m = String(s.payment_method || "").toLowerCase();
    if (m === "credit") return sum + Number(s.total || 0);
    return sum;
  }, 0);

  const otherPayTotal = Math.max(0, totalSales - cashTotal - mpesaTotal - creditTotal);

  const paymentChartData = [
    { name: "Cash", value: cashTotal, color: "#1a1d29" },
    { name: "M-Pesa / Mobile", value: mpesaTotal, color: "#d99a4e" },
    { name: language === "sw" ? "Mkopo" : "Credit", value: creditTotal, color: "#f59e0b" },
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
      {/* 4 Olly KPI Stat Cards (2x2 on Mobile, 4 cols on Desktop) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {/* KPI 1: Revenue */}
        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{t("reports.totalSales")}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{formatMoney(totalRevenue)}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{sales?.length || 0} sales + {otherIncome?.length || 0} other</p>
          </div>
        </Card>

        {/* KPI 2: Expenses */}
        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{t("reports.totalExpenses")}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{formatMoney(totalExpenses)}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{expenses?.length || 0} {language === "sw" ? "vipengele" : "line items"}</p>
          </div>
        </Card>

        {/* KPI 3: Net Profit */}
        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{t("reports.netProfit")}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--success-text)]" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className={cn("text-base sm:text-2xl font-bold tracking-tight truncate", netProfit >= 0 ? "text-[var(--success-text)]" : "text-destructive")}>
              {formatMoney(netProfit)}
            </p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">
              {totalSales > 0 ? `${Math.round((netProfit / totalSales) * 100)}% margin` : "0% margin"}
            </p>
          </div>
        </Card>

        {/* KPI 4: Stock Valuation */}
        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{t("reports.inventoryValue")}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{formatMoney(stockValuation)}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">
              {(products || []).filter((p) => p.item_type !== "service" && p.track_inventory !== false).length} {language === "sw" ? "bidhaa za stoo" : "physical items"}
            </p>
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-muted/20 p-3.5">
                <span className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Mauzo (Bila Kodi)" : "Net Revenue"}</span>
                <p className="mt-1 text-lg sm:text-xl font-bold text-foreground">{formatMoney(netRevenue)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Gross: {formatMoney(totalSales)}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3.5">
                <span className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Gharama ya Mauzo (COGS)" : "Cost of Goods Sold"}</span>
                <p className="mt-1 text-lg sm:text-xl font-bold text-amber-600">-{formatMoney(cogs)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{language === "sw" ? "Gharama halisi ya mzigo" : "Historical item cost"}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3.5">
                <span className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Faida Ghafi" : "Gross Profit"}</span>
                <p className="mt-1 text-lg sm:text-xl font-bold text-blue-600">{formatMoney(grossProfit)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{netRevenue > 0 ? `${((grossProfit / netRevenue) * 100).toFixed(1)}% margin` : "0%"}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3.5">
                <span className="text-xs font-medium text-muted-foreground">{t("reports.netProfit")}</span>
                <p className={cn("mt-1 text-lg sm:text-xl font-bold", netProfit >= 0 ? "text-[var(--success-text)]" : "text-destructive")}>
                  {formatMoney(netProfit)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{netMargin.toFixed(1)}% net margin</p>
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
                    <TableCell className="font-semibold text-foreground">{language === "sw" ? "Mapato Halisi ya Mauzo (Bila Kodi)" : "Net Sales Revenue (Excl. Tax)"}</TableCell>
                    <TableCell className="text-right font-bold text-[var(--success-text)]">+{formatMoney(netRevenue)}</TableCell>
                  </TableRow>
                  <TableRow className="text-xs">
                    <TableCell className="text-muted-foreground pl-6">{language === "sw" ? "Chini: Gharama ya Bidhaa Zilizouzwa (COGS)" : "Less: Cost of Goods Sold (COGS)"}</TableCell>
                    <TableCell className="text-right font-medium text-amber-600">-{formatMoney(cogs)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/20 text-xs font-semibold border-y border-border">
                    <TableCell className="text-foreground">{language === "sw" ? "= Faida Ghafi (Gross Profit)" : "= Gross Profit"}</TableCell>
                    <TableCell className="text-right font-bold text-blue-600">{formatMoney(grossProfit)}</TableCell>
                  </TableRow>
                  <TableRow className="text-xs">
                    <TableCell className="font-semibold text-foreground">{language === "sw" ? "+ Mapato Mengine" : "+ Other Income"}</TableCell>
                    <TableCell className="text-right font-bold text-[var(--success-text)]">+{formatMoney(totalOtherIncome)}</TableCell>
                  </TableRow>
                  {(expenses || []).map((e) => (
                    <TableRow key={e.id} className="text-xs">
                      <TableCell className="text-muted-foreground pl-6">{e.title || (e as any).description || e.category} ({e.category})</TableCell>
                      <TableCell className="text-right font-medium text-destructive">-{formatMoney(e.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/20 text-xs font-semibold border-y border-border">
                    <TableCell className="text-foreground">{language === "sw" ? "- Jumla ya Gharama za Uendeshaji" : "- Total Operating Expenses"}</TableCell>
                    <TableCell className="text-right font-bold text-destructive">-{formatMoney(totalExpenses)}</TableCell>
                  </TableRow>
                  <TableRow className="border-t-2 border-border bg-muted/40 text-xs font-bold">
                    <TableCell className="text-foreground">{language === "sw" ? "Faida Halisi ya Biashara (Net Profit)" : "Net Business Profit"}</TableCell>
                    <TableCell className={cn("text-right font-black text-sm", netProfit >= 0 ? "text-[var(--success-text)]" : "text-destructive")}>
                      {formatMoney(netProfit)}
                    </TableCell>
                  </TableRow>
                  {taxCollected > 0 && (
                    <TableRow className="text-xs text-muted-foreground bg-amber-50/50 dark:bg-amber-950/20">
                      <TableCell className="italic">{language === "sw" ? "Kodi ya Mauzo Iliyokusanywa (Deni la Serikali / Haijahesabiwa kwenye Faida)" : "Tax Collected (Payable Liability / Excluded from Profit)"}</TableCell>
                      <TableCell className="text-right font-semibold text-amber-700 dark:text-amber-400">{formatMoney(taxCollected)}</TableCell>
                    </TableRow>
                  )}
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
                    const isService = p.item_type === "service" || p.track_inventory === false;
                    const lineVal = Number(p.stock || 0) * Number(p.buying_price || 0);
                    return (
                      <TableRow key={p.id} className="text-xs">
                        <TableCell className="font-bold text-foreground">{p.barcode || p.sku || "PROD"}</TableCell>
                        <TableCell className="font-medium text-foreground">
                          <span>{p.name}</span>
                          {isService && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                              {language === "sw" ? "Huduma" : "Service"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-bold text-foreground">
                          {isService ? <span className="text-muted-foreground font-normal">—</span> : `${p.stock} pcs`}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {isService ? "—" : formatMoney(p.buying_price)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-foreground">
                          {isService ? "—" : formatMoney(lineVal)}
                        </TableCell>
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
