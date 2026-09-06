import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
  FileText,
  DollarSign,
  Package,
  Layers,
  Edit2,
  ChevronRight,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useOrders,
  useOrder,
  useCreateOrder,
  useUpdateOrderStatus,
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
    badgeClass: "bg-[#ffeace] text-[#9a3412] font-semibold",
  },
  processing: {
    labelEn: "Processing",
    labelSw: "Inachakatwa",
    badgeClass: "bg-blue-50 text-blue-700 font-semibold dark:bg-blue-900/40 dark:text-blue-300",
  },
  completed: {
    labelEn: "Completed",
    labelSw: "Imekamilika",
    badgeClass: "bg-[#daf1df] text-[#166534] font-bold",
  },
  cancelled: {
    labelEn: "Cancelled",
    labelSw: "Imefutwa",
    badgeClass: "bg-muted text-muted-foreground font-semibold",
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileOrderPage, setMobileOrderPage] = useState(1);
  const MOBILE_ORDER_PAGE_SIZE = 4;
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [addQuantity, setAddQuantity] = useState("1");

  const initialOrderDraft = {
    form: {
      customer_name: "",
      customer_phone: "",
      status: "pending",
      priority: "medium",
      due_date: "",
      notes: "",
    },
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

  const totalMobileOrderPages = Math.max(1, Math.ceil(filteredOrders.length / MOBILE_ORDER_PAGE_SIZE));
  const currentMobileOrders = useMemo(() => {
    const start = (mobileOrderPage - 1) * MOBILE_ORDER_PAGE_SIZE;
    return filteredOrders.slice(start, start + MOBILE_ORDER_PAGE_SIZE);
  }, [filteredOrders, mobileOrderPage]);

  useEffect(() => {
    setMobileOrderPage(1);
  }, [search, statusFilter, priorityFilter, dateRange]);



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
      toast.error(language === "sw" ? "Ongeza angalau bidhaa moja kwenye agizo" : "Add at least one item to order");
      return;
    }
    try {
      await createOrder.mutateAsync({
        customer_name: addForm.customer_name || undefined,
        customer_phone: addForm.customer_phone || undefined,
        status: addForm.status || "pending",
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
  const addQtyNum = parseInt(addQuantity, 10) || 1;

  const handleAddProductToCart = () => {
    if (!selectedProduct || addQtyNum < 1) return;
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

  const renderOrderPanel = () => (
    <>

          {/* Case 1: Inline "Add Employee / New Order" Form */}
          {isCreatingOrder && (
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">
                  {language === "sw" ? "Ongeza Agizo Jipya" : "Add Customer Order"}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setIsCreatingOrder(false); setMobileDrawerOpen(false); }}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Full Name */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Jina la Mteja" : "Customer Full Name"}</Label>
                  <Input
                    placeholder={language === "sw" ? "mf. Baraka Shayo" : "e.g. Baraka Shayo"}
                    value={addForm.customer_name}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, customer_name: e.target.value }))}
                    className="h-10 rounded-xl border-border bg-background text-xs"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Namba ya Simu" : "Phone Number"}</Label>
                  <Input
                    placeholder="0712 999 111"
                    value={addForm.customer_phone}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, customer_phone: e.target.value }))}
                    className="h-10 rounded-xl border-border bg-background text-xs"
                  />
                </div>

                {/* Status & Priority Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Hali ya Agizo (Status)" : "Order Status"}</Label>
                    <Select
                      value={addForm.status}
                      onValueChange={(val) => setAddForm((prev) => ({ ...prev, status: val }))}
                    >
                      <SelectTrigger className="h-10 rounded-xl border-border bg-background text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border bg-popover text-xs">
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {language === "sw" ? v.labelSw : v.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Kipaumbele (Priority)" : "Priority"}</Label>
                    <Select
                      value={addForm.priority}
                      onValueChange={(val) => setAddForm((prev) => ({ ...prev, priority: val }))}
                    >
                      <SelectTrigger className="h-10 rounded-xl border-border bg-background text-xs">
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
                </div>

                {/* Due Date */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Tarehe ya Kukamilisha (Due Date)" : "Due Date"}</Label>
                  <Input
                    type="date"
                    value={addForm.due_date}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, due_date: e.target.value }))}
                    className="h-10 rounded-xl border-border bg-background text-xs"
                  />
                </div>

                {/* Add Product Items */}
                <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 space-y-2.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {language === "sw" ? "Ongeza Bidhaa kwenye Agizo" : "Add Products to Order"}
                  </Label>
                  <div className="flex gap-2">
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger className="h-10 flex-1 rounded-xl border-border bg-background text-xs">
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
                      className="h-10 w-16 rounded-xl border-border bg-background text-xs text-center font-bold"
                    />
                    <Button
                      type="button"
                      onClick={handleAddProductToCart}
                      disabled={!selectedProduct || addQtyNum < 1}
                      className="h-10 px-3.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4 text-accent" />
                    </Button>
                  </div>

                  {/* Cart Items */}
                  {addItems.length > 0 && (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pt-1">
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
                  )}
                </div>

                {/* Total & Bottom Black Action Button */}
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">{language === "sw" ? "Jumla" : "Total"}</p>
                    <p className="text-base font-bold text-foreground">
                      {formatMoney(addItems.reduce((s, it) => s + it.quantity * it.unit_price, 0))}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingOrder(false)}
                    className="h-11 rounded-xl flex-1 text-xs"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    onClick={handleCreateOrder}
                    disabled={createOrder.isPending || addItems.length === 0}
                    className="h-11 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 flex-[2]"
                  >
                    {createOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5 text-accent" />}
                    <span>{language === "sw" ? "Hifadhi Agizo" : "Save Order"}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Case 2: Selected Order Details (Olly Style Avatar Card) */}
          {!isCreatingOrder && selectedOrder && currentOrder && (
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">
                  {language === "sw" ? "Maelezo ya Agizo" : "Order Details"}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedOrder(null);
                    setIsConfirmingDelete(false);
                  }}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Delete Banner if triggered */}
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
                      className="h-8 rounded-lg text-xs flex-1"
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleDeleteCurrentOrder}
                      disabled={deleteOrder.isPending}
                      className="h-8 rounded-lg bg-destructive text-xs font-bold text-destructive-foreground hover:bg-destructive/90 flex-1"
                    >
                      {deleteOrder.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                      <span>{language === "sw" ? "Futa" : "Delete"}</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Avatar + Name + Status */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-lg font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  {(((currentOrder as any).customer_name || "M").charAt(0)).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">
                    {(currentOrder as any).customer_name || (language === "sw" ? "Mteja wa Kawaida" : "Walk-in Customer")}
                  </h4>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase font-bold",
                        STATUS_CONFIG[currentOrder.status]?.badgeClass || "bg-muted text-muted-foreground",
                      )}
                    >
                      {language === "sw"
                        ? STATUS_CONFIG[currentOrder.status]?.labelSw || currentOrder.status
                        : STATUS_CONFIG[currentOrder.status]?.labelEn || currentOrder.status}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{currentOrder.order_number}</span>
                  </div>
                </div>
              </div>

              {/* Detail Info List */}
              <div className="space-y-3 text-xs divide-y divide-border/60">
                <div className="flex items-center gap-3 pt-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">{language === "sw" ? "Simu" : "Phone"}</p>
                    <p className="font-semibold text-foreground">{(currentOrder as any).customer_phone || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">{language === "sw" ? "Tarehe ya Kuagiza" : "Order Date"}</p>
                    <p className="font-semibold text-foreground">
                      {format(new Date(currentOrder.created_at), "dd MMMM yyyy, HH:mm")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">{language === "sw" ? "Jumla ya Agizo" : "Order Total"}</p>
                    <p className="text-base font-bold text-foreground">{formatMoney(currentOrder.total || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Status Switcher */}
              <div className="space-y-2 pt-2 border-t border-border">
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
                        "rounded-xl px-2 py-2 text-[11px] font-bold transition-all border text-center",
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

              {/* Order Items List */}
              <div className="space-y-2 pt-2 border-t border-border">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {language === "sw" ? "Bidhaa Zilizomo" : "Items in Order"}
                </Label>
                <div className="rounded-xl border border-border divide-y divide-border">
                  {((currentOrder as any).items || (currentOrder as any).order_items || []).map((it: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2.5 text-xs">
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

              {/* Full Width Bottom Action Buttons */}
              <div className="pt-3 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="h-11 rounded-xl text-xs text-destructive hover:bg-destructive/10 flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  <span>{language === "sw" ? "Futa Agizo" : "Delete Order"}</span>
                </Button>

                <Button
                  onClick={() => {
                    const nextStatus = currentOrder.status === "pending" ? "processing" : currentOrder.status === "processing" ? "completed" : "completed";
                    updateStatus.mutate({ id: currentOrder.id, status: nextStatus });
                  }}
                  disabled={currentOrder.status === "completed"}
                  className="h-11 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 flex-[2]"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5 text-accent" />
                  <span>{currentOrder.status === "pending" ? (language === "sw" ? "Anza Kuchakata" : "Process Order") : (language === "sw" ? "Kamilisha Agizo" : "Complete Order")}</span>
                </Button>
              </div>
            </div>
          )}
    </>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6 pb-12">
      {/* 4 Compact Olly KPI Cards (2x2 on Mobile, 4 cols on Desktop) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Jumla ya Maagizo" : "Total Orders"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300 flex-shrink-0">
              <ClipboardList className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{stats.total}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Maagizo yote" : "Registered orders"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Inasubiri" : "Pending Orders"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300 flex-shrink-0">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-[#9a3412] truncate">{stats.pending}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Kazi inayongoja" : "Awaiting action"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Inachakatwa" : "In Progress"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 flex-shrink-0">
              <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-blue-700 dark:text-blue-400 truncate">{stats.processing}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Inatayarishwa" : "Being prepared"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Thamani ya Maagizo" : "Orders Value"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 flex-shrink-0">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{formatMoney(stats.totalValue)}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{stats.completed} {language === "sw" ? "imekamilika" : "completed"}</p>
          </div>
        </Card>
      </div>

      {/* Main 2-Column Master-Detail Layout (NO POPUPS) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (Master Orders Table) */}
        <div className={cn("space-y-4 transition-all duration-200", isPanelOpen ? "lg:col-span-7" : "lg:col-span-12")}>
          <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
            {/* Header / Toolbar */}
            <div className="p-5 border-b border-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {language === "sw" ? "Orodha ya Maagizo" : "Orders Directory"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {language === "sw" ? "Usimamizi wa maagizo yote ya wateja" : "Manage and fulfill customer orders"}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setIsCreatingOrder(true);
                    setSelectedOrder(null);
                    setIsConfirmingDelete(false);
                    setMobileDrawerOpen(true);
                  }}
                  className="h-10 gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 text-accent" />
                  <span>{language === "sw" ? "+ Ongeza Agizo" : "+ Add Order"}</span>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={language === "sw" ? "Tafuta kwa nambari, mteja, au simu..." : "Search by name, role or ID..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 rounded-xl border-border bg-background pl-9 text-xs"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 w-36 rounded-xl border-border bg-background text-xs">
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
                  <SelectTrigger className="h-10 w-32 rounded-xl border-border bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover text-xs">
                    <SelectItem value="all">{language === "sw" ? "Muda Wote" : "All Time"}</SelectItem>
                    <SelectItem value="today">{language === "sw" ? "Leo" : "Today"}</SelectItem>
                    <SelectItem value="week">{language === "sw" ? "Wiki Hii" : "This Week"}</SelectItem>
                    <SelectItem value="month">{language === "sw" ? "Mwezi Huu" : "This Month"}</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCsv}
                  disabled={filteredOrders.length === 0}
                  className="h-10 rounded-xl border-border text-xs gap-1"
                >
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>CSV</span>
                </Button>
              </div>
            </div>

            {/* Orders Table */}
            {/* Mobile View: 4 Compact Cards with Prev/Next Pagination */}
            <div className="md:hidden">
              <div className="divide-y divide-border/60">
                {currentMobileOrders.length > 0 ? (
                  currentMobileOrders.map((order) => {
                    const isSelected = selectedOrder?.id === order.id && !isCreatingOrder;
                    const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                    const priorityConf = PRIORITY_CONFIG[(order as any).priority] || PRIORITY_CONFIG.medium;
                    return (
                      <div
                        key={order.id}
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsCreatingOrder(false);
                          setIsConfirmingDelete(false);
                          setMobileDrawerOpen(true);
                        }}
                        className={cn(
                          "p-3.5 flex items-center justify-between cursor-pointer active:bg-muted/60 transition-colors",
                          isSelected ? "bg-accent/10" : ""
                        )}
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-foreground">{order.order_number}</span>
                            <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold", statusConf.badgeClass)}>
                              {language === "sw" ? statusConf.labelSw : statusConf.labelEn}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-foreground/90 mt-0.5 truncate">
                            {(order as any).customer_name || (language === "sw" ? "Mteja wa Kawaida" : "Walk-in Customer")}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {format(new Date(order.created_at), "dd MMM yyyy")}
                          </p>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">{formatMoney(order.total || 0)}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    {language === "sw" ? "Hakuna maagizo yaliyopatikana." : "No customer orders found."}
                  </div>
                )}
              </div>

              {totalMobileOrderPages > 1 && (
                <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-border/60 bg-muted/20 text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={mobileOrderPage <= 1}
                    onClick={() => setMobileOrderPage((p) => Math.max(1, p - 1))}
                    className="h-7 px-2.5 text-[11px]"
                  >
                    {language === "sw" ? "Iliyopita" : "Previous"}
                  </Button>
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    {mobileOrderPage} / {totalMobileOrderPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={mobileOrderPage >= totalMobileOrderPages}
                    onClick={() => setMobileOrderPage((p) => Math.min(totalMobileOrderPages, p + 1))}
                    className="h-7 px-2.5 text-[11px]"
                  >
                    {language === "sw" ? "Inayofuata" : "Next"}
                  </Button>
                </div>
              )}
            </div>

            {/* Desktop Orders Table */}
            <div className="hidden md:block internal-table-scroll w-full">
              <Table className="min-w-[650px] w-full">
                <TableHeader>
                  <TableRow className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <TableHead className="font-semibold">{language === "sw" ? "AGIZO" : "ORDER ID"}</TableHead>
                    <TableHead className="font-semibold">{language === "sw" ? "MTEJA" : "CUSTOMER"}</TableHead>
                    <TableHead className="text-right font-semibold">{language === "sw" ? "JUMLA" : "TOTAL"}</TableHead>
                    <TableHead className="text-center font-semibold">{language === "sw" ? "HALI" : "STATUS"}</TableHead>
                    <TableHead className="text-center font-semibold">{language === "sw" ? "KIPAUMBELE" : "PRIORITY"}</TableHead>
                    <TableHead className="text-center font-semibold">{language === "sw" ? "VITENDO" : "ACTIONS"}</TableHead>
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
                            setMobileDrawerOpen(true);
                          }}
                          className={cn(
                            "cursor-pointer transition-colors text-xs border-b border-border/60",
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
                            <div className="font-bold text-foreground">
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
                                "inline-flex items-center rounded-md px-2.5 py-1 text-[10px] uppercase",
                                statusConf.badgeClass,
                              )}
                            >
                              {language === "sw" ? statusConf.labelSw : statusConf.labelEn}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-semibold",
                                priorityConf.badgeClass,
                              )}
                            >
                              {language === "sw" ? priorityConf.labelSw : priorityConf.labelEn}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsCreatingOrder(false);
                                }}
                                className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsConfirmingDelete(true);
                                }}
                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                        {language === "sw" ? "Hakuna maagizo yaliyopatikana." : "No customer orders found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Right Column (Inline Detail / Create Panel - Exactly like Olly HR Panel) */}
        <div className="hidden lg:block lg:col-span-5 space-y-4">
          {renderOrderPanel()}
        </div>
      </div>

      {/* Mobile Bottom Sheet for Adding / Viewing Orders (lg:hidden) */}
      <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-0 border-t border-border bg-card lg:hidden">
          <div className="p-1 space-y-4">
            {renderOrderPanel()}
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
