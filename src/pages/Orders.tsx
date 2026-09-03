import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Plus,
  Loader2,
  Download,
  Calendar,
  ClipboardList,
  User,
  Phone,
  Clock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Printer,
  ChevronRight,
  FileText,
  DollarSign,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useOrders,
  useOrder,
  useCreateOrder,
  useUpdateOrderStatus,
  useUpdateOrder,
  useAddOrderNote,
  useDeleteOrder,
} from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { useDraftForm } from "@/hooks/useDraftForm";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PageLoader } from "@/components/PageLoader";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { labelEn: string; labelSw: string; badgeClass: string }> = {
  pending: {
    labelEn: "Pending",
    labelSw: "Inasubiri",
    badgeClass: "bg-[#ffeace] text-[#9a3412] border-0",
  },
  processing: {
    labelEn: "Processing",
    labelSw: "Inachakatwa",
    badgeClass: "bg-blue-50 text-blue-700 border-0 dark:bg-blue-900/40 dark:text-blue-300",
  },
  completed: {
    labelEn: "Completed",
    labelSw: "Imekamilika",
    badgeClass: "bg-[#daf1df] text-[#166534] border-0",
  },
  cancelled: {
    labelEn: "Cancelled",
    labelSw: "Imefutwa",
    badgeClass: "bg-muted text-muted-foreground border-0",
  },
};

const PRIORITY_CONFIG: Record<string, { labelEn: string; labelSw: string; badgeClass: string }> = {
  low: { labelEn: "Low", labelSw: "Chini", badgeClass: "bg-muted text-muted-foreground" },
  medium: { labelEn: "Medium", labelSw: "Wastani", badgeClass: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
  high: { labelEn: "High", labelSw: "Juu", badgeClass: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
  urgent: { labelEn: "Urgent", labelSw: "Dharura", badgeClass: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
};

export default function Orders() {
  const { t, language } = useLanguage();
  const { formatMoney } = useShopFormatting();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all");

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [addQuantity, setAddQuantity] = useState("1");

  const initialOrderDraft = {
    form: { customer_name: "", customer_phone: "", notes: "", priority: "medium", due_date: "" },
    items: [] as { product_id: string; product_name: string; quantity: number; unit_price: number }[],
  };
  const [orderDraft, setOrderDraft, clearOrderDraft] = useDraftForm("add-order", initialOrderDraft);
  const addForm = { ...initialOrderDraft.form, ...orderDraft.form };
  const setAddForm = (updater: React.SetStateAction<typeof initialOrderDraft.form>) =>
    setOrderDraft((prev) => ({
      ...prev,
      form: typeof updater === "function" ? updater({ ...initialOrderDraft.form, ...prev.form }) : updater,
    }));
  const addItems = orderDraft.items ?? [];
  const setAddItems = (updater: React.SetStateAction<typeof initialOrderDraft.items>) =>
    setOrderDraft((prev) => ({
      ...prev,
      items: typeof updater === "function" ? updater(prev.items ?? []) : updater,
    }));

  const { data: orders, isLoading } = useOrders();
  const { data: orderDetail } = useOrder(selectedOrder?.id ?? null);
  const { data: products } = useProducts();

  const currentOrder = orderDetail ?? selectedOrder;
  const createOrder = useCreateOrder();
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();

  const dateRangeFilter = useMemo(() => {
    if (dateRange === "all") return { from: null, to: null };
    const now = new Date();
    if (dateRange === "today") return { from: startOfDay(now), to: endOfDay(now) };
    if (dateRange === "week") return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
    return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
  }, [dateRange]);

  const filteredOrders = useMemo(() => {
    let list = orders ?? [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.order_number?.toLowerCase().includes(q) ||
          (o as any).customer_name?.toLowerCase().includes(q) ||
          (o as any).customer_phone?.toLowerCase?.()?.includes(q),
      );
    }
    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);
    if (dateRangeFilter.from)
      list = list.filter(
        (o) => new Date(o.created_at) >= dateRangeFilter.from! && new Date(o.created_at) <= dateRangeFilter.to!,
      );
    if (priorityFilter !== "all") list = list.filter((o) => ((o as any).priority ?? "medium") === priorityFilter);
    return list;
  }, [orders, search, statusFilter, dateRangeFilter, priorityFilter]);

  const stats = useMemo(() => {
    const list = filteredOrders;
    const pending = list.filter((o) => o.status === "pending").length;
    const processing = list.filter((o) => o.status === "processing").length;
    const completed = list.filter((o) => o.status === "completed").length;
    const totalValue = list.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total || 0), 0);
    return { total: list.length, pending, processing, completed, totalValue };
  }, [filteredOrders]);

  if (orders === undefined || isLoading) {
    return <PageLoader message="Loading orders..." messageSw="Inapakia maagizo..." language={language} />;
  }

  const handleCreateOrder = async () => {
    if (addItems.length === 0) {
      toast.error(language === "sw" ? "Ongeza angalau bidhaa moja" : "Add at least one item");
      return;
    }
    try {
      await createOrder.mutateAsync({
        customer_name: addForm.customer_name || undefined,
        customer_phone: addForm.customer_phone || undefined,
        priority: addForm.priority || undefined,
        due_date: addForm.due_date || undefined,
        items: addItems.map((i) => ({
          product_id: i.product_id,
          product_name: i.product_name,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        notes: addForm.notes || undefined,
      });
      clearOrderDraft();
      setIsCreatingOrder(false);
      toast.success(language === "sw" ? "Agizo limetengenezwa kwa mafanikio" : "Order created successfully");
    } catch (e: any) {
      toast.error(e?.message || "Failed to create order");
    }
  };

  const selectedProduct = selectedProductId ? products?.find((p) => p.id === selectedProductId) : null;
  const quantityInCartForSelected = selectedProductId
    ? addItems.filter((i) => i.product_id === selectedProductId).reduce((sum, i) => sum + i.quantity, 0)
    : 0;
  const availableStock = selectedProduct != null ? Math.max(0, Number(selectedProduct.stock ?? 0) - quantityInCartForSelected) : 0;
  const addQtyNum = parseInt(addQuantity, 10) || 0;
  const quantityExceedsStock = selectedProduct != null && addQtyNum > availableStock;

  const handleAddProductToCart = () => {
    if (!selectedProduct || addQtyNum < 1 || quantityExceedsStock) return;
    const name = selectedProduct.name;
    const existing = addItems.find((i) => i.product_id === selectedProduct.id);
    if (existing) {
      setAddItems((prev) =>
        prev.map((i) => (i.product_id === selectedProduct.id ? { ...i, quantity: i.quantity + addQtyNum } : i)),
      );
    } else {
      setAddItems((prev) => [
        ...prev,
        {
          product_id: selectedProduct.id,
          product_name: name,
          quantity: addQtyNum,
          unit_price: selectedProduct.selling_price,
        },
      ]);
    }
    setSelectedProductId("");
    setAddQuantity("1");
  };

  const exportCsv = () => {
    const headers = [
      language === "sw" ? "Nambari" : "Order #",
      language === "sw" ? "Mteja" : "Customer",
      language === "sw" ? "Simu" : "Phone",
      language === "sw" ? "Hali" : "Status",
      language === "sw" ? "Kipaumbele" : "Priority",
      language === "sw" ? "Tarehe" : "Date",
      language === "sw" ? "Jumla" : "Total",
    ];
    const rows = filteredOrders.map((o) => [
      o.order_number,
      (o as any).customer_name || (language === "sw" ? "Mteja wa Kawaida" : "Walk-in"),
      (o as any).customer_phone || "-",
      o.status,
      (o as any).priority || "medium",
      format(new Date(o.created_at), "yyyy-MM-dd"),
      o.total,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement("a");
    a.href = encodedUri;
    a.download = `orders-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success(language === "sw" ? "Imepakuliwa" : "Exported");
  };

  const handleDeleteCurrentOrder = async () => {
    if (!currentOrder) return;
    try {
      await deleteOrder.mutateAsync(currentOrder.id);
      setSelectedOrder(null);
      setIsConfirmingDelete(false);
      toast.success(language === "sw" ? "Agizo limefutwa" : "Order deleted");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete order");
    }
  };

  const isPanelOpen = isCreatingOrder || !!selectedOrder;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6 pb-12">
      {/* 4 Olly KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border border-border bg-card p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {language === "sw" ? "Jumla ya Maagizo" : "Total Orders"}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{stats.total}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {language === "sw" ? "Maagizo yaliyosajiliwa" : "All registered orders"}
          </p>
        </Card>

        <Card className="border border-border bg-card p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#9a3412]">
            {language === "sw" ? "Inasubiri" : "Pending Orders"}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#9a3412]">{stats.pending}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {language === "sw" ? "Tayari kwa kuchakatwa" : "Awaiting fulfillment"}
          </p>
        </Card>

        <Card className="border border-border bg-card p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            {language === "sw" ? "Inachakatwa" : "Processing"}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-blue-700 dark:text-blue-400">{stats.processing}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {language === "sw" ? "Inatayarishwa sasa" : "Currently in progress"}
          </p>
        </Card>

        <Card className="border border-border bg-card p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">
            {language === "sw" ? "Thamani ya Maagizo" : "Orders Value"}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{formatMoney(stats.totalValue)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {stats.completed} {language === "sw" ? "yamekamilika" : "completed"}
          </p>
        </Card>
      </div>

      {/* Main 2-Column Master-Detail Layout (NO POPUPS) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (Master Orders Table - Expands to 12 cols when unselected) */}
        <div className={cn("space-y-4 transition-all duration-200", isPanelOpen ? "lg:col-span-7" : "lg:col-span-12")}>
          <Card className="border border-border bg-card shadow-xs">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between flex-wrap">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={language === "sw" ? "Tafuta agizo, simu..." : "Search orders..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 rounded-xl border-border bg-background pl-9 text-xs"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-32 rounded-xl border-border bg-background text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover text-xs">
                    <SelectItem value="all">{language === "sw" ? "Hali Zote" : "All Statuses"}</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {language === "sw" ? v.labelSw : v.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
                  <SelectTrigger className="h-9 w-28 rounded-xl border-border bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover text-xs">
                    <SelectItem value="all">{language === "sw" ? "Muda Wote" : "All Time"}</SelectItem>
                    <SelectItem value="today">{language === "sw" ? "Leo" : "Today"}</SelectItem>
                    <SelectItem value="week">{language === "sw" ? "Wiki Hii" : "This Week"}</SelectItem>
                    <SelectItem value="month">{language === "sw" ? "Mwezi Huu" : "This Month"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCsv}
                  disabled={filteredOrders.length === 0}
                  className="h-9 rounded-xl border-border text-xs gap-1"
                >
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>CSV</span>
                </Button>

                <Button
                  onClick={() => {
                    setIsCreatingOrder(true);
                    setSelectedOrder(null);
                    setIsConfirmingDelete(false);
                  }}
                  className="h-9 gap-1.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
                >
                  <Plus className="h-3.5 w-3.5 text-accent" />
                  <span>{language === "sw" ? "Agizo Jipya" : "New Order"}</span>
                </Button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto w-full">
              <Table className="min-w-[650px] w-full">
                <TableHeader>
                  <TableRow className="bg-[#f9fafb] text-[11px] uppercase">
                    <TableHead className="font-semibold">{language === "sw" ? "Agizo / Tarehe" : "Order / Date"}</TableHead>
                    <TableHead className="font-semibold">{language === "sw" ? "Mteja" : "Customer"}</TableHead>
                    <TableHead className="text-right font-semibold">{language === "sw" ? "Jumla" : "Total"}</TableHead>
                    <TableHead className="text-center font-semibold">{language === "sw" ? "Hali" : "Status"}</TableHead>
                    <TableHead className="text-center font-semibold">{language === "sw" ? "Kipaumbele" : "Priority"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => {
                      const isSelected = selectedOrder?.id === order.id && !isCreatingOrder;
                      const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                      const priorityConf = PRIORITY_CONFIG[(order as any).priority] || PRIORITY_CONFIG.medium;

                      return (
                        <TableRow
                          key={order.id}
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsCreatingOrder(false);
                            setIsConfirmingDelete(false);
                          }}
                          className={cn(
                            "cursor-pointer transition-colors text-xs",
                            isSelected ? "bg-muted/80 font-medium" : "hover:bg-muted/40",
                          )}
                        >
                          <TableCell className="font-bold text-foreground">
                            <div>{order.order_number}</div>
                            <div className="text-[10px] font-normal text-muted-foreground">
                              {format(new Date(order.created_at), "dd MMM yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-foreground">
                              {(order as any).customer_name || (language === "sw" ? "Mteja wa Kawaida" : "Walk-in")}
                            </div>
                            {(order as any).customer_phone && (
                              <div className="text-[10px] text-muted-foreground">{(order as any).customer_phone}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            {formatMoney(order.total || 0)}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold",
                                statusConf.badgeClass,
                              )}
                            >
                              {language === "sw" ? statusConf.labelSw : statusConf.labelEn}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold",
                                priorityConf.badgeClass,
                              )}
                            >
                              {language === "sw" ? priorityConf.labelSw : priorityConf.labelEn}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                        {language === "sw" ? "Hakuna maagizo yaliyopatikana." : "No customer orders found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Right Column (Inline Detail / Create Panel - 5 Cols, NO POPUPS) */}
        <div className="space-y-4 lg:col-span-5">
          {/* Case 1: Inline "New Order" Form */}
          {isCreatingOrder && (
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-accent" />
                  <span>{language === "sw" ? "Tengeneza Agizo Jipya" : "Create New Order"}</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCreatingOrder(false)}
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                  title={language === "sw" ? "Funga" : "Close"}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>

              <CardContent className="p-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">{language === "sw" ? "Jina la Mteja" : "Customer Name"}</Label>
                    <Input
                      placeholder={language === "sw" ? "mf. Sarah Juma" : "e.g. John Doe"}
                      value={addForm.customer_name}
                      onChange={(e) => setAddForm((prev) => ({ ...prev, customer_name: e.target.value }))}
                      className="h-9 rounded-xl border-border bg-background text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">{language === "sw" ? "Namba ya Simu" : "Phone Number"}</Label>
                    <Input
                      placeholder="0712 345 678"
                      value={addForm.customer_phone}
                      onChange={(e) => setAddForm((prev) => ({ ...prev, customer_phone: e.target.value }))}
                      className="h-9 rounded-xl border-border bg-background text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">{language === "sw" ? "Kipaumbele" : "Priority"}</Label>
                    <Select
                      value={addForm.priority}
                      onValueChange={(val) => setAddForm((prev) => ({ ...prev, priority: val }))}
                    >
                      <SelectTrigger className="h-9 rounded-xl border-border bg-background text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border bg-popover text-xs">
                        <SelectItem value="low">{language === "sw" ? "Chini" : "Low"}</SelectItem>
                        <SelectItem value="medium">{language === "sw" ? "Wastani" : "Medium"}</SelectItem>
                        <SelectItem value="high">{language === "sw" ? "Juu" : "High"}</SelectItem>
                        <SelectItem value="urgent">{language === "sw" ? "Dharura" : "Urgent"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">{language === "sw" ? "Tarehe ya Makabidhiano" : "Due Date"}</Label>
                    <Input
                      type="date"
                      value={addForm.due_date}
                      onChange={(e) => setAddForm((prev) => ({ ...prev, due_date: e.target.value }))}
                      className="h-9 rounded-xl border-border bg-background text-xs"
                    />
                  </div>
                </div>

                {/* Add Item Row */}
                <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {language === "sw" ? "Ongeza Bidhaa kwenye Agizo" : "Add Items to Order"}
                  </Label>
                  <div className="flex gap-2">
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger className="h-9 flex-1 rounded-xl border-border bg-background text-xs">
                        <SelectValue placeholder={language === "sw" ? "Chagua bidhaa..." : "Select product..."} />
                      </SelectTrigger>
                      <SelectContent className="max-h-56 rounded-xl border-border bg-popover text-xs">
                        {(products || []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({formatMoney(p.selling_price)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      value={addQuantity}
                      onChange={(e) => setAddQuantity(e.target.value)}
                      className="h-9 w-16 rounded-xl border-border bg-background text-xs text-center font-bold"
                    />
                    <Button
                      type="button"
                      onClick={handleAddProductToCart}
                      disabled={!selectedProduct || addQtyNum < 1}
                      className="h-9 px-3 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="h-3.5 w-3.5 text-accent" />
                    </Button>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {addItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-border bg-card p-2.5"
                    >
                      <div>
                        <p className="font-bold text-foreground">{item.product_name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.quantity} x {formatMoney(item.unit_price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{formatMoney(item.quantity * item.unit_price)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setAddItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="h-6 w-6 rounded-lg text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total & Submit */}
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">{language === "sw" ? "Jumla ya Gharama" : "Total Amount"}</p>
                    <p className="text-base font-bold text-foreground">
                      {formatMoney(addItems.reduce((s, it) => s + it.quantity * it.unit_price, 0))}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreatingOrder(false)}
                      className="h-9 rounded-xl text-xs"
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      onClick={handleCreateOrder}
                      disabled={createOrder.isPending || addItems.length === 0}
                      className="h-9 gap-1.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
                    >
                      {createOrder.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 text-accent" />}
                      <span>{language === "sw" ? "Kamilisha Agizo" : "Save Order"}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Case 2: Inline Selected Order Details */}
          {!isCreatingOrder && selectedOrder && currentOrder && (
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-accent" />
                    <span>{currentOrder.order_number}</span>
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(currentOrder.created_at), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold",
                      STATUS_CONFIG[currentOrder.status]?.badgeClass || "bg-muted text-muted-foreground",
                    )}
                  >
                    {language === "sw"
                      ? STATUS_CONFIG[currentOrder.status]?.labelSw || currentOrder.status
                      : STATUS_CONFIG[currentOrder.status]?.labelEn || currentOrder.status}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedOrder(null);
                      setIsConfirmingDelete(false);
                    }}
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                    title={language === "sw" ? "Funga" : "Close"}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4 text-xs">
                {/* Delete Confirmation Banner */}
                {isConfirmingDelete && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-destructive font-bold text-xs">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{language === "sw" ? "Thibitisha kufuta agizo hili?" : "Confirm deleting this order?"}</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsConfirmingDelete(false)}
                        className="h-7 rounded-lg text-xs flex-1"
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleDeleteCurrentOrder}
                        disabled={deleteOrder.isPending}
                        className="h-7 rounded-lg bg-destructive text-xs font-bold text-destructive-foreground hover:bg-destructive/90 flex-1"
                      >
                        {deleteOrder.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                        <span>{language === "sw" ? "Futa" : "Delete"}</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Customer Information */}
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/30 p-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">{language === "sw" ? "Mteja" : "Customer"}</p>
                    <p className="font-bold text-foreground">
                      {(currentOrder as any).customer_name || (language === "sw" ? "Mteja wa Kawaida" : "Walk-in Customer")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">{language === "sw" ? "Simu" : "Phone"}</p>
                    <p className="font-bold text-foreground">{(currentOrder as any).customer_phone || "-"}</p>
                  </div>
                </div>

                {/* Status Switcher Buttons */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {language === "sw" ? "Badilisha Hali ya Agizo" : "Update Status"}
                  </Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => updateStatus.mutate({ id: currentOrder.id, status: k })}
                        className={cn(
                          "rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all border text-center",
                          currentOrder.status === k
                            ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                            : "border-border bg-background text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {language === "sw" ? v.labelSw : v.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Order Items Table */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {language === "sw" ? "Bidhaa za Agizo" : "Order Items"}
                  </Label>
                  <div className="rounded-xl border border-border divide-y divide-border">
                    {((currentOrder as any).items || (currentOrder as any).order_items || []).map((it: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2.5">
                        <div>
                          <p className="font-semibold text-foreground">{it.product_name || "Product"}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {it.quantity} x {formatMoney(it.unit_price || 0)}
                          </p>
                        </div>
                        <p className="font-bold text-foreground">
                          {formatMoney((it.quantity || 1) * (it.unit_price || 0))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total & Action Buttons */}
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">{language === "sw" ? "Jumla Kuu" : "Total"}</p>
                    <p className="text-base font-bold text-foreground">{formatMoney(currentOrder.total || 0)}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="h-8 rounded-xl text-xs text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      <span>{language === "sw" ? "Futa" : "Delete"}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}
