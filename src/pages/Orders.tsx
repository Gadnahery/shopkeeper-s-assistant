import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Pencil, Trash2, Loader2, Download, Calendar, Package } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOrders, useOrder, useCreateOrder, useUpdateOrderStatus, useUpdateOrder, useAddOrderNote, useDeleteOrder } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  cancelled: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30",
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  medium: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  high: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  urgent: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const STATUS_LEGEND = [
  { key: "pending", en: "Pending", sw: "Inasubiri" },
  { key: "processing", en: "Processing", sw: "Inachakatwa" },
  { key: "completed", en: "Completed", sw: "Imekamilika" },
  { key: "cancelled", en: "Cancelled", sw: "Imefutwa" },
];

const PRIORITY_OPTIONS = [
  { value: "low", en: "Low", sw: "Chini" },
  { value: "medium", en: "Medium", sw: "Wastani" },
  { value: "high", en: "High", sw: "Juu" },
  { value: "urgent", en: "Urgent", sw: "Dharura" },
];

export default function Orders() {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all");
  const [editing, setEditing] = useState<any>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [noteText, setNoteText] = useState("");
  const [addForm, setAddForm] = useState({ customer_name: "", customer_phone: "", notes: "", priority: "medium", due_date: "" });
  const [addItems, setAddItems] = useState<{ product_id: string; product_name: string; quantity: number; unit_price: number }[]>([]);

  const { data: orders, isLoading } = useOrders();
  const { data: orderDetail } = useOrder(editing?.id ?? null);
  const { data: products } = useProducts();
  const editingOrder = orderDetail ?? editing;
  const createOrder = useCreateOrder();
  const updateStatus = useUpdateOrderStatus();
  const updateOrder = useUpdateOrder();
  const addNote = useAddOrderNote();
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
          o.customer_name?.toLowerCase().includes(q) ||
          (o as any).customer_phone?.toLowerCase?.()?.includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);
    if (dateRangeFilter.from) list = list.filter((o) => new Date(o.created_at) >= dateRangeFilter.from! && new Date(o.created_at) <= dateRangeFilter.to!);
    return list;
  }, [orders, search, statusFilter, dateRangeFilter]);

  const stats = useMemo(() => {
    const list = filteredOrders;
    const pending = list.filter((o) => o.status === "pending").length;
    const processing = list.filter((o) => o.status === "processing").length;
    const completed = list.filter((o) => o.status === "completed").length;
    const totalValue = list.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total || 0), 0);
    return { total: list.length, pending, processing, completed, totalValue };
  }, [filteredOrders]);

  const formatNumber = (n: number) => n.toLocaleString("en-US");

  const handleCreateOrder = async () => {
    if (addItems.length === 0) {
      toast.error(language === "sw" ? "Ongeza angalau bidhaa moja" : "Add at least one item");
      return;
    }
    await createOrder.mutateAsync({
      customer_name: addForm.customer_name || undefined,
      customer_phone: addForm.customer_phone || undefined,
      priority: addForm.priority || undefined,
      due_date: addForm.due_date || undefined,
      items: addItems.map((i) => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, unit_price: i.unit_price })),
      notes: addForm.notes || undefined,
    });
    setAddOpen(false);
    setAddForm({ customer_name: "", customer_phone: "", notes: "", priority: "medium", due_date: "" });
    setAddItems([]);
  };

  const addProductToOrder = (p: NonNullable<typeof products>[0]) => {
    const name = language === "sw" && p.name_sw ? p.name_sw : p.name;
    const existing = addItems.find((i) => i.product_id === p.id);
    if (existing) {
      setAddItems((prev) => prev.map((i) => (i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setAddItems((prev) => [...prev, { product_id: p.id, product_name: name, quantity: 1, unit_price: p.selling_price }]);
    }
  };

  const productListFiltered = useMemo(() => {
    if (!products) return [];
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => (p.name?.toLowerCase().includes(q) || (p.name_sw?.toLowerCase().includes(q))));
  }, [products, productSearch]);

  const exportCsv = () => {
    const headers = [language === "sw" ? "Nambari" : "Order #", language === "sw" ? "Mteja" : "Customer", language === "sw" ? "Simu" : "Phone", language === "sw" ? "Hali" : "Status", language === "sw" ? "Kipaumbele" : "Priority", language === "sw" ? "Tarehe" : "Date", language === "sw" ? "Jumla" : "Total"];
    const rows = filteredOrders.map((o) => [
      o.order_number,
      o.customer_name || (language === "sw" ? "Mteja wa Kawaida" : "Walk-in"),
      (o as any).customer_phone ?? "",
      o.status,
      (o as any).priority ?? "medium",
      format(new Date(o.created_at), "yyyy-MM-dd"),
      String(Number(o.total)),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(language === "sw" ? "Imepakuliwa" : "Exported");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">{language === "sw" ? "Maagizo" : "Orders"}</h1>
        <div className="flex flex-wrap gap-2">
          <div className="relative w-48 md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={language === "sw" ? "Tafuta (nambari, mteja, simu)..." : "Search (order #, customer, phone)..."} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={dateRange} onValueChange={(v: "all" | "today" | "week" | "month") => setDateRange(v)}>
            <SelectTrigger className="w-36 gap-1"><Calendar className="h-4 w-4" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "sw" ? "Zote" : "All"}</SelectItem>
              <SelectItem value="today">{language === "sw" ? "Leo" : "Today"}</SelectItem>
              <SelectItem value="week">{language === "sw" ? "Wiki 1" : "Last 7 days"}</SelectItem>
              <SelectItem value="month">{language === "sw" ? "Mwezi 1" : "Last 30 days"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "sw" ? "Zote" : "All"}</SelectItem>
              {STATUS_LEGEND.map((s) => (
                <SelectItem key={s.key} value={s.key}>{language === "sw" ? s.sw : s.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1" onClick={exportCsv} disabled={filteredOrders.length === 0}>
            <Download className="h-4 w-4" />{language === "sw" ? "Pakua CSV" : "Export CSV"}
          </Button>
          <Button className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />{language === "sw" ? "Ongeza" : "Add"}
          </Button>
        </div>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
        <span className="font-medium">{language === "sw" ? "Maana ya rangi:" : "Status colors:"}</span>
        {STATUS_LEGEND.map((s) => (
          <Badge key={s.key} variant="outline" className={statusColors[s.key]}>{language === "sw" ? s.sw : s.en}</Badge>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{language === "sw" ? "Jumla ya maagizo" : "Total orders"}</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{language === "sw" ? "Inasubiri" : "Pending"}</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{language === "sw" ? "Inachakatwa" : "Processing"}</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.processing}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{language === "sw" ? "Imekamilika" : "Completed"}</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{language === "sw" ? "Thamani (zisizofutwa)" : "Value (excl. cancelled)"}</p>
            <p className="text-2xl font-bold">{formatNumber(stats.totalValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Order Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{language === "sw" ? "Ongeza Agizo" : "Create Order"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>{language === "sw" ? "Jina la Mteja" : "Customer Name"}</Label><Input value={addForm.customer_name} onChange={(e) => setAddForm({ ...addForm, customer_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>{language === "sw" ? "Simu" : "Phone"}</Label><Input value={addForm.customer_phone} onChange={(e) => setAddForm({ ...addForm, customer_phone: e.target.value })} /></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{language === "sw" ? "Kipaumbele" : "Priority"}</Label>
                <Select value={addForm.priority} onValueChange={(v) => setAddForm({ ...addForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{language === "sw" ? p.sw : p.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === "sw" ? "Tarehe ya kukamilika" : "Due date"}</Label>
                <Input type="date" value={addForm.due_date} onChange={(e) => setAddForm({ ...addForm, due_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{language === "sw" ? "Bidhaa" : "Products"}</Label>
              <Input placeholder={language === "sw" ? "Tafuta bidhaa..." : "Search products..."} value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="mb-2" />
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                {productListFiltered.slice(0, 30).map((p) => (
                  <Button key={p.id} type="button" variant="outline" size="sm" onClick={() => addProductToOrder(p)}>
                    {language === "sw" && p.name_sw ? p.name_sw : p.name} - {formatNumber(p.selling_price)}
                  </Button>
                ))}
              </div>
            </div>
            {addItems.length > 0 && (
              <div className="space-y-2">
                <Label>{language === "sw" ? "Kikapu" : "Cart"}</Label>
                <ul className="space-y-1 text-sm">
                  {addItems.map((i, idx) => (
                    <li key={idx} className="flex justify-between items-center">
                      <span>{i.product_name} x{i.quantity}</span>
                      <span>{formatNumber(i.quantity * i.unit_price)}</span>
                      <Button variant="ghost" size="sm" onClick={() => setAddItems((prev) => prev.filter((_, i) => i !== idx))}>×</Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="space-y-2"><Label>{language === "sw" ? "Vidokezo" : "Notes"}</Label><Input value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })} /></div>
            <Button className="w-full" onClick={handleCreateOrder} disabled={addItems.length === 0 || createOrder.isPending}>
              {createOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Hifadhi" : "Save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View/Edit Order Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingOrder?.order_number}</DialogTitle></DialogHeader>
          {editing && editingOrder && (
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">{editingOrder.customer_name || (language === "sw" ? "Mteja wa Kawaida" : "Walk-in")}{(editingOrder as any).customer_phone ? ` • ${(editingOrder as any).customer_phone} • ` : " • "}{format(new Date(editingOrder.created_at), "dd MMM yyyy")}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "sw" ? "Hali" : "Status"}</Label>
                  <Select value={editingOrder.status} onValueChange={(v) => { updateStatus.mutate({ id: editing.id, status: v }); setEditing({ ...editingOrder, status: v }); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_LEGEND.map((s) => (
                        <SelectItem key={s.key} value={s.key}>{language === "sw" ? s.sw : s.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === "sw" ? "Kipaumbele" : "Priority"}</Label>
                  <Select value={(editingOrder as any).priority ?? "medium"} onValueChange={(v) => { updateOrder.mutate({ id: editing.id, priority: v }); setEditing({ ...editingOrder, priority: v }); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{language === "sw" ? p.sw : p.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(editingOrder as any).due_date && (
                <p className="text-sm text-muted-foreground">{language === "sw" ? "Tarehe ya kukamilika:" : "Due date:"} {format(new Date((editingOrder as any).due_date), "dd MMM yyyy")}</p>
              )}
              <div className="flex gap-2">
                <Input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder={language === "sw" ? "Ongeza kidokezo" : "Add note"} />
                <Button size="sm" onClick={() => { addNote.mutate({ order_id: editing.id, note: noteText }); setNoteText(""); }} disabled={!noteText.trim()}>+</Button>
              </div>
              {editingOrder.order_notes?.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">{language === "sw" ? "Vidokezo" : "Notes"}</Label>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {(editingOrder as any).order_notes.map((n: any) => (
                      <li key={n.id}>{n.note} — {format(new Date(n.created_at), "dd MMM HH:mm")}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="space-y-2">
                {editingOrder.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.product_name} x{item.quantity}</span>
                    <span>{formatNumber(Number(item.total))}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-2 font-bold">{language === "sw" ? "Jumla" : "Total"}: {formatNumber(Number(editingOrder.total))}</div>
              <Button variant="destructive" className="w-full" onClick={() => { deleteOrder.mutate(editing.id); setEditing(null); }}>{language === "sw" ? "Futa" : "Delete"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>{language === "sw" ? "Nambari" : "Order #"}</TableHead>
                <TableHead>{language === "sw" ? "Mteja" : "Customer"}</TableHead>
                <TableHead>{language === "sw" ? "Tarehe" : "Date"}</TableHead>
                <TableHead>{language === "sw" ? "Jumla" : "Total"}</TableHead>
                <TableHead>{language === "sw" ? "Hali" : "Status"}</TableHead>
                <TableHead>{language === "sw" ? "Kipaumbele" : "Priority"}</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{language === "sw" ? "Hakuna maagizo" : "No orders"}</TableCell></TableRow>
                ) : (
                  filteredOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.order_number}</TableCell>
                      <TableCell>{o.customer_name || (language === "sw" ? "Mteja wa Kawaida" : "Walk-in")}</TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(o.created_at), "dd MMM yyyy")}</TableCell>
                      <TableCell>{formatNumber(Number(o.total))}</TableCell>
                      <TableCell><Badge variant="outline" className={statusColors[o.status] || ""}>{language === "sw" ? STATUS_LEGEND.find((s) => s.key === o.status)?.sw ?? o.status : o.status}</Badge></TableCell>
                      <TableCell><Badge className={priorityColors[(o as any).priority ?? "medium"] || ""}>{(o as any).priority ?? "medium"}</Badge></TableCell>
                      <TableCell>{(o as any).due_date ? format(new Date((o as any).due_date), "dd MMM") : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(o)}><Pencil className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
