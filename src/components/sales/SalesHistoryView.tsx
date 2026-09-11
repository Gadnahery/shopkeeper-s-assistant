import { useState, useMemo } from "react";
import { format, subDays, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import {
  CalendarDays,
  ReceiptText,
  Pencil,
  Plus,
  Search,
  DollarSign,
  Wallet,
  CreditCard,
  ShoppingBag,
  Users,
  CheckCircle2,
  Filter,
  X,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { useShopSettings } from "@/hooks/useShopSettings";
import { useSales, useDeleteSale } from "@/hooks/useSales";
import { EditSaleDialog } from "./EditSaleDialog";
import { Receipt } from "@/components/Receipt";
import { PageLoader } from "@/components/PageLoader";
import { cn } from "@/lib/utils";
import { isTimestampInLocalDayRange } from "@/lib/dateUtils";

type Period = "today" | "week" | "month" | "year" | "all" | "custom";

const PERIOD_LABELS: Record<Period, Record<"en" | "sw", string>> = {
  today: { en: "Today", sw: "Leo" },
  week: { en: "This week", sw: "Wiki hii" },
  month: { en: "This month", sw: "Mwezi huu" },
  year: { en: "This year", sw: "Mwaka huu" },
  all: { en: "All time", sw: "Muda wote" },
  custom: { en: "Custom date", sw: "Tarehe maalum" },
};

function getPeriodDates(period: Exclude<Period, "custom">): { start: string; end: string } {
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

function safeFormatDate(dateVal?: string | Date | null, formatStr = "dd MMM yyyy, HH:mm"): string {
  if (!dateVal) return "";
  try {
    const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
    if (Number.isNaN(d.getTime())) return "";
    return format(d, formatStr);
  } catch {
    return "";
  }
}

interface SalesHistoryViewProps {
  onAddSale: () => void;
}

export function SalesHistoryView({ onAddSale }: SalesHistoryViewProps) {
  const { language } = useLanguage();
  const { formatMoney } = useShopFormatting();
  const { profile, role, isOwner } = useAuth();
  const { data: shopSettings } = useShopSettings();

  // Timeline / Period Filter - DEFAULTS TO "today"
  const [period, setPeriod] = useState<Period>("today");
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // Dialogs
  const [editingSale, setEditingSale] = useState<any | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<any | null>(null);
  const [deletingSale, setDeletingSale] = useState<any | null>(null);

  const deleteSale = useDeleteSale();
  const canEdit = isOwner || role === "manager" || role === "owner";

  // Date boundaries
  const { start: periodStart, end: periodEnd } = useMemo(() => {
    if (period === "custom") {
      const s = customRange.from ? format(customRange.from, "yyyy-MM-dd") : "1970-01-01";
      const e = customRange.to ? format(customRange.to, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
      return { start: s, end: e };
    }
    return getPeriodDates(period as Exclude<Period, "custom">);
  }, [period, customRange]);

  // Query sales
  const salesQueryOptions = useMemo(() => {
    if (period === "all") {
      return { limit: 500 };
    }
    return {
      startDate: periodStart,
      endDate: periodEnd,
    };
  }, [period, periodStart, periodEnd]);

  const { data: rawSales, isLoading: salesLoading } = useSales(salesQueryOptions);

  // Filter out drafts from sales history and ensure local day range
  const periodSales = useMemo(() => {
    return (rawSales || []).filter((s) => {
      if (s.status === "draft") return false;
      if (period !== "all" && s.created_at) {
        return isTimestampInLocalDayRange(s.created_at, periodStart, periodEnd);
      }
      return true;
    });
  }, [rawSales, period, periodStart, periodEnd]);

  // Period KPI Metrics
  const totalSalesVal = useMemo(() => {
    return periodSales.reduce((acc, s) => acc + Number(s.total || 0), 0);
  }, [periodSales]);

  const cashSalesVal = useMemo(() => {
    return periodSales.reduce((acc, s) => {
      const method = String(s.payment_method || "").toLowerCase();
      if (method === "cash") return acc + Number(s.total || 0);
      if (method === "split") return acc + Number(s.cash_amount || 0);
      return acc;
    }, 0);
  }, [periodSales]);

  const mpesaSalesVal = useMemo(() => {
    return periodSales.reduce((acc, s) => {
      const method = String(s.payment_method || "").toLowerCase();
      if (method === "m-pesa" || method === "mpesa") return acc + Number(s.total || 0);
      if (method === "split") return acc + Number(s.mpesa_amount || 0);
      return acc;
    }, 0);
  }, [periodSales]);

  const creditSalesVal = useMemo(() => {
    return periodSales.reduce((acc, s) => {
      const method = String(s.payment_method || "").toLowerCase();
      if (method === "credit") return acc + Number(s.total || 0);
      return acc;
    }, 0);
  }, [periodSales]);

  // Search & Payment Filtered Sales
  const filteredSales = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return periodSales.filter((s) => {
      // Payment filter
      if (paymentFilter !== "all") {
        const method = String(s.payment_method || "").toLowerCase();
        if (paymentFilter === "cash" && method !== "cash") return false;
        if (paymentFilter === "mpesa" && method !== "m-pesa" && method !== "mpesa") return false;
        if (paymentFilter === "split" && method !== "split") return false;
        if (paymentFilter === "credit" && method !== "credit") return false;
      }

      // Text search
      if (!q) return true;
      const invoice = String(s.invoice_number || "").toLowerCase();
      const cust = String(s.customer_name || s.customers?.name || "").toLowerCase();
      const itemsMatch = ((s.sale_items || []) as any[]).some((it) =>
        String(it.product_name || "").toLowerCase().includes(q)
      );
      return invoice.includes(q) || cust.includes(q) || itemsMatch;
    });
  }, [periodSales, searchQuery, paymentFilter]);

  // Format a sale into ReceiptData
  const receiptData = useMemo(() => {
    if (!receiptSale) return null;
    const items = ((receiptSale.sale_items || []) as any[]).map((it) => ({
      name: it.product_name || "Item",
      quantity: Number(it.quantity || 1),
      price: Number(it.unit_price || 0),
      total: Number(it.quantity || 1) * Number(it.unit_price || 0),
    }));

    return {
      invoiceNumber: receiptSale.invoice_number || `INV-${String(receiptSale.id).slice(0, 8).toUpperCase()}`,
      date: safeFormatDate(receiptSale.created_at, "dd MMM yyyy, hh:mm a"),
      customerName: receiptSale.customer_name || receiptSale.customers?.name || (language === "sw" ? "Mteja wa Kawaida" : "Walk-in"),
      cashier: profile?.full_name || undefined,
      items,
      subtotal: Number(receiptSale.subtotal || receiptSale.total || 0),
      discount: Number(receiptSale.discount_amount || 0),
      total: Number(receiptSale.total || 0),
      paymentMethod: receiptSale.payment_method || "Cash",
      mpesaCode: receiptSale.mpesa_code || undefined,
      cashAmount: receiptSale.cash_amount ? Number(receiptSale.cash_amount) : undefined,
      mpesaAmount: receiptSale.mpesa_amount ? Number(receiptSale.mpesa_amount) : undefined,
      shopName: (shopSettings as any)?.shop_name || "WiseCash",
      shopPhone: (shopSettings as any)?.phone || undefined,
      shopAddress: (shopSettings as any)?.address || undefined,
      receiptHeader: (shopSettings as any)?.receipt_header || undefined,
      receiptFooter: (shopSettings as any)?.receipt_footer || undefined,
      logoUrl: (shopSettings as any)?.logo_url || undefined,
      isOfflinePending: receiptSale.is_offline_pending || false,
    };
  }, [receiptSale, profile, shopSettings, language]);

  return (
    <div className="space-y-6">
      {/* Top Header with Title, Period Subtitle & Primary "Add Sale" Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {language === "sw" ? "Rekodi za Mauzo" : "Sales History"}
            </h1>
            <Badge variant="outline" className="font-semibold text-xs border-primary/30 text-primary bg-primary/5">
              {periodSales.length} {language === "sw" ? "Miamala" : "Transactions"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {period === "today"
              ? language === "sw"
                ? `Mauzo ya leo (${format(new Date(), "dd MMMM yyyy")})`
                : `Today's sales (${format(new Date(), "MMMM dd, yyyy")})`
              : period === "custom"
              ? customRange.from
                ? customRange.to
                  ? `${format(customRange.from, "dd MMM yyyy")} – ${format(customRange.to, "dd MMM yyyy")}`
                  : `${format(customRange.from, "dd MMM yyyy")} – ...`
                : language === "sw"
                ? "Chagua tarehe kwenye kalenda"
                : "Select date range from calendar"
              : PERIOD_LABELS[period]?.[language] || ""}
          </p>
        </div>

        {/* Action Buttons & "Add Sale" */}
        <div className="flex items-center gap-2.5">
          <Button
            onClick={onAddSale}
            className="h-10 rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 px-4 text-xs sm:text-sm font-bold shadow-sm gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>{language === "sw" ? "Uza Bidhaa (Mauzo Mapya)" : "Add Sale"}</span>
          </Button>
        </div>
      </div>

      {/* Timeline Toggle Bar (Matching Dashboard Experience) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-2.5 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(["today", "week", "month", "year", "all"] as Exclude<Period, "custom">[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all shrink-0",
                period === p
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {PERIOD_LABELS[p][language]}
            </button>
          ))}
        </div>

        {/* Custom Range Picker */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              onClick={() => {
                setPeriod("custom");
                setCalendarOpen(true);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold transition-all shrink-0",
                period === "custom"
                  ? "bg-primary text-primary-foreground shadow-xs border-primary font-bold"
                  : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>
                {period === "custom" && customRange.from
                  ? customRange.to
                    ? `${format(customRange.from, "dd MMM")} – ${format(customRange.to, "dd MMM")}`
                    : format(customRange.from, "dd MMM yyyy")
                  : language === "sw"
                  ? "Chagua Tarehe"
                  : "Custom Date"}
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
              numberOfMonths={2}
              disabled={{ after: new Date() }}
              className="p-3"
            />
            {period === "custom" && customRange.from && (
              <div className="border-t border-border p-2 flex justify-between items-center">
                <span className="text-[11px] text-muted-foreground px-2">
                  {customRange.to
                    ? `${format(customRange.from, "MMM dd")} → ${format(customRange.to, "MMM dd, yyyy")}`
                    : language === "sw"
                    ? "Chagua tarehe ya mwisho"
                    : "Pick end date"}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCustomRange({});
                    setPeriod("today");
                  }}
                  className="h-7 text-xs text-muted-foreground"
                >
                  {language === "sw" ? "Futa" : "Clear"}
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* 4 Olly KPI Stat Cards for the Period */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Total Sales */}
        <Card className="border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {language === "sw" ? "Jumla ya Mauzo" : "Total Revenue"}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">
              {formatMoney(totalSalesVal)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {periodSales.length} {language === "sw" ? "mauzo yaliyokamilika" : "completed sales"}
            </p>
          </div>
        </Card>

        {/* Cash Collected */}
        <Card className="border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {language === "sw" ? "Fedha Taslimu (Cash)" : "Cash Collected"}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">
              {formatMoney(cashSalesVal)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {totalSalesVal > 0 ? `${Math.round((cashSalesVal / totalSalesVal) * 100)}%` : "0%"}{" "}
              {language === "sw" ? "ya mauzo yote" : "of total"}
            </p>
          </div>
        </Card>

        {/* Mobile / M-Pesa */}
        <Card className="border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">M-Pesa / Mobile</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">
              {formatMoney(mpesaSalesVal)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {totalSalesVal > 0 ? `${Math.round((mpesaSalesVal / totalSalesVal) * 100)}%` : "0%"}{" "}
              {language === "sw" ? "ya mauzo yote" : "of total"}
            </p>
          </div>
        </Card>

        {/* Credit / Debt Sales */}
        <Card className="border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {language === "sw" ? "Mauzo ya Mkopo" : "Credit Sales"}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">
              {formatMoney(creditSalesVal)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {language === "sw" ? "Madeni ya wateja" : "Customer balances"}
            </p>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border bg-card p-3 shadow-xs">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={
                language === "sw"
                  ? "Tafuta kwa nambari ya ankara, jina la mteja, au bidhaa..."
                  : "Search by invoice #, customer name, or item..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 rounded-xl border-border bg-background pl-9 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <span className="text-[11px] font-semibold text-muted-foreground shrink-0 mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" />
              <span>{language === "sw" ? "Njia:" : "Method:"}</span>
            </span>
            {[
              { id: "all", label: language === "sw" ? "Zote" : "All" },
              { id: "cash", label: "Cash" },
              { id: "mpesa", label: "M-Pesa" },
              { id: "split", label: "Split" },
              { id: "credit", label: language === "sw" ? "Mkopo" : "Credit" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setPaymentFilter(f.id)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all shrink-0",
                  paymentFilter === f.id
                    ? "bg-foreground text-background shadow-2xs"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Sales Transactions Records */}
      {salesLoading ? (
        <PageLoader
          message="Loading sales history..."
          messageSw="Inapakia historia ya mauzo..."
          language={language}
        />
      ) : filteredSales.length === 0 ? (
        /* Empty State */
        <Card className="border border-border bg-card p-10 text-center shadow-xs">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">
            {searchQuery || paymentFilter !== "all"
              ? language === "sw"
                ? "Hakuna mauzo yanayolingana na utafutaji"
                : "No sales match your search or filter"
              : period === "today"
              ? language === "sw"
                ? "Hakuna mauzo yaliyorekodiwa leo"
                : "No sales recorded today yet"
              : language === "sw"
              ? "Hakuna mauzo yaliyorekodiwa kwenye kipindi hiki"
              : "No sales recorded in this period"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {language === "sw"
              ? "Bofya kitufe cha 'Uza Bidhaa' kuanza kurekodi mauzo mapya ya dukani papo hapo."
              : "Click 'Add Sale' to record your first transaction for this period."}
          </p>
          <div className="mt-4">
            <Button
              onClick={onAddSale}
              className="h-9 rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold gap-1.5 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{language === "sw" ? "Uza Bidhaa Sasa" : "Add Sale Now"}</span>
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="border border-border bg-card shadow-xs overflow-hidden">
          <div className="internal-table-scroll overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-xs font-semibold">
                  <TableHead className="w-36">{language === "sw" ? "Tarehe na Saa" : "Date & Time"}</TableHead>
                  <TableHead className="w-28">{language === "sw" ? "Ankara (Invoice)" : "Invoice #"}</TableHead>
                  <TableHead>{language === "sw" ? "Mteja" : "Customer"}</TableHead>
                  <TableHead className="max-w-[240px]">{language === "sw" ? "Bidhaa Zilizouzwa" : "Items Sold"}</TableHead>
                  <TableHead className="w-24 text-center">{language === "sw" ? "Malipo" : "Payment"}</TableHead>
                  <TableHead className="text-right w-28">{language === "sw" ? "Jumla (TSH)" : "Total"}</TableHead>
                  <TableHead className="text-right w-28">{language === "sw" ? "Vitendo" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {filteredSales.map((s: any) => {
                  const itemsList = ((s.sale_items || []) as any[]).map(
                    (it) => `${it.product_name || "Item"} (×${it.quantity})`
                  );
                  const itemsLabel = itemsList.length
                    ? itemsList.length > 2
                      ? `${itemsList.slice(0, 2).join(", ")} +${itemsList.length - 2} ${
                          language === "sw" ? "zaidi" : "more"
                        }`
                      : itemsList.join(", ")
                    : "—";

                  const customerLabel =
                    s.customer_name || s.customers?.name || (language === "sw" ? "Mteja wa Kawaida" : "Walk-in");

                  const paymentBadgeClass =
                    s.payment_method === "Cash"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : s.payment_method === "M-Pesa"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                      : s.payment_method === "Credit"
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                      : "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300";

                  return (
                    <TableRow key={s.id} className="text-xs hover:bg-muted/30 transition-colors">
                      {/* Date & Time */}
                      <TableCell className="py-3 font-medium text-foreground whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{safeFormatDate(s.created_at, "dd MMM yyyy")}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {safeFormatDate(s.created_at, "HH:mm")}
                          </span>
                        </div>
                        {s.is_offline_pending && (
                          <span className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-bold text-amber-600 dark:text-amber-400 border border-amber-300/40">
                            ⚡ {language === "sw" ? "Bila Mtandao" : "Offline"}
                          </span>
                        )}
                      </TableCell>

                      {/* Invoice */}
                      <TableCell className="py-3 font-mono text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
                        {s.invoice_number || `INV-${String(s.id).slice(0, 6).toUpperCase()}`}
                      </TableCell>

                      {/* Customer */}
                      <TableCell className="py-3 font-medium text-foreground">
                        <span className="truncate max-w-[140px] block" title={customerLabel}>
                          {customerLabel}
                        </span>
                      </TableCell>

                      {/* Items sold */}
                      <TableCell
                        className="py-3 text-muted-foreground max-w-[240px] truncate"
                        title={itemsList.join(", ")}
                      >
                        {itemsLabel}
                      </TableCell>

                      {/* Payment Method */}
                      <TableCell className="py-3 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                            paymentBadgeClass
                          )}
                        >
                          {s.payment_method || "Cash"}
                        </span>
                      </TableCell>

                      {/* Total Amount */}
                      <TableCell className="py-3 text-right font-black text-foreground whitespace-nowrap">
                        {formatMoney(s.total)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={language === "sw" ? "Risiti" : "Receipt"}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                            onClick={() => setReceiptSale(s)}
                          >
                            <ReceiptText className="h-3.5 w-3.5" />
                          </Button>

                          {canEdit && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                title={language === "sw" ? "Hariri Mauzo" : "Edit Sale"}
                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  setEditingSale(s);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                title={language === "sw" ? "Futa Mauzo" : "Delete Sale"}
                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeletingSale(s)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Edit Sale Dialog */}
      {editingSale && (
        <EditSaleDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingSale(null);
          }}
          sale={editingSale}
        />
      )}

      {/* Receipt Modal */}
      {receiptSale && receiptData && (
        <Receipt
          data={receiptData}
          onClose={() => setReceiptSale(null)}
        />
      )}

      {/* Delete Sale Confirmation Dialog */}
      <AlertDialog open={!!deletingSale} onOpenChange={(open) => !open && setDeletingSale(null)}>
        <AlertDialogContent className="rounded-2xl border-border bg-card p-5 max-w-md">
          <AlertDialogHeader className="space-y-2">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <AlertDialogTitle className="text-base font-bold">
                {language === "sw" ? "Futa Rekodi ya Mauzo?" : "Delete Sale Record?"}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="text-xs text-muted-foreground leading-relaxed">
                {language === "sw" ? (
                  <>
                    Una uhakika unataka kufuta rekodi hii ya mauzo{" "}
                    <strong className="text-foreground">{deletingSale?.invoice_number}</strong> yenye thamani ya{" "}
                    <strong className="text-foreground">{formatMoney(deletingSale?.total || 0)}</strong>?
                    <br />
                    <br />
                    <span className="text-destructive font-semibold">Matokeo ya hatua hii:</span>
                    <ul className="list-disc pl-4 mt-1 space-y-1 text-foreground">
                      <li>Idadi ya bidhaa zilizouzwa itarejeshwa kiotomatiki kwenye stoo (inventory).</li>
                      <li>Mapato ya mauzo haya yataondolewa kwenye ripoti zote, dashibodi na rekodi za fedha.</li>
                    </ul>
                  </>
                ) : (
                  <>
                    Are you sure you want to permanently delete sale record{" "}
                    <strong className="text-foreground">{deletingSale?.invoice_number}</strong> totaling{" "}
                    <strong className="text-foreground">{formatMoney(deletingSale?.total || 0)}</strong>?
                    <br />
                    <br />
                    <span className="text-destructive font-semibold">What happens next:</span>
                    <ul className="list-disc pl-4 mt-1 space-y-1 text-foreground">
                      <li>Sold item quantities will be automatically restored back to inventory stock.</li>
                      <li>This transaction will be removed from all financial summaries, reports, and dashboard metrics.</li>
                    </ul>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel className="h-9 rounded-xl text-xs">
              {language === "sw" ? "Ghairi" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteSale.isPending}
              onClick={async (e) => {
                e.preventDefault();
                if (!deletingSale?.id) return;
                try {
                  await deleteSale.mutateAsync(deletingSale.id);
                  setDeletingSale(null);
                } catch {}
              }}
              className="h-9 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-bold gap-1.5"
            >
              {deleteSale.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>{language === "sw" ? "Futa Mauzo na Rudisha Stoo" : "Delete Sale & Restore Stock"}</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
