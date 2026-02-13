import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Pencil, Trash2, Loader2, MessageSquare, Package } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOrders, useCreateOrder, useUpdateOrderStatus, useAddOrderNote, useDeleteOrder } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

export default function Orders() {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<any>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [addForm, setAddForm] = useState({ customer_name: "", customer_phone: "", notes: "" });
  const [addItems, setAddItems] = useState<{ product_id: string; product_name: string; quantity: number; unit_price: number }[]>([]);

  const { data: orders, isLoading } = useOrders();
  const { data: products } = useProducts();
  const createOrder = useCreateOrder();
  const updateStatus = useUpdateOrderStatus();
  const addNote = useAddOrderNote();
  const deleteOrder = useDeleteOrder();

  const filteredOrders = orders?.filter((o) => {
    const matchSearch = !search || (o.order_number?.toLowerCase().includes(search.toLowerCase()) || o.customer_name?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  }) || [];

  const formatNumber = (n: number) => n.toLocaleString("en-US");

  const handleCreateOrder = async () => {
    if (addItems.length === 0) {
      toast.error(language === "sw" ? "Ongeza angalau bidhaa moja" : "Add at least one item");
      return;
    }
    await createOrder.mutateAsync({
      customer_name: addForm.customer_name || undefined,
      customer_phone: addForm.customer_phone || undefined,
      items: addItems.map((i) => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, unit_price: i.unit_price })),
      notes: addForm.notes || undefined,
    });
    setAddOpen(false);
    setAddForm({ customer_name: "", customer_phone: "", notes: "" });
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">{language === "sw" ? "Maagizo" : "Orders"}</h1>
        <div className="flex gap-2">
          <div className="relative w-48 md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={language === "sw" ? "Tafuta..." : "Search..."} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "sw" ? "Zote" : "All"}</SelectItem>
              <SelectItem value="pending">{language === "sw" ? "Inasubiri" : "Pending"}</SelectItem>
              <SelectItem value="processing">{language === "sw" ? "Inachakatwa" : "Processing"}</SelectItem>
              <SelectItem value="completed">{language === "sw" ? "Imekamilika" : "Completed"}</SelectItem>
              <SelectItem value="cancelled">{language === "sw" ? "Imefutwa" : "Cancelled"}</SelectItem>
            </SelectContent>
          </Select>
          <Button className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />{language === "sw" ? "Ongeza" : "Add"}
          </Button>
        </div>
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
            <div className="space-y-2"><Label>{language === "sw" ? "Bidhaa" : "Products"}</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                {products?.slice(0, 20).map((p) => (
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
                    <li key={idx} className="flex justify-between">
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
          <DialogHeader><DialogTitle>{editing?.order_number}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">{editing.customer_name || (language === "sw" ? "Mteja wa Kawaida" : "Walk-in")} • {format(new Date(editing.created_at), "dd MMM yyyy")}</p>
              <div className="space-y-2">
                <Label>{language === "sw" ? "Hali" : "Status"}</Label>
                <Select value={editing.status} onValueChange={(v) => { updateStatus.mutate({ id: editing.id, status: v }); setEditing({ ...editing, status: v }); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{language === "sw" ? "Inasubiri" : "Pending"}</SelectItem>
                    <SelectItem value="processing">{language === "sw" ? "Inachakatwa" : "Processing"}</SelectItem>
                    <SelectItem value="completed">{language === "sw" ? "Imekamilika" : "Completed"}</SelectItem>
                    <SelectItem value="cancelled">{language === "sw" ? "Imefutwa" : "Cancelled"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder={language === "sw" ? "Ongeza kidokezo" : "Add note"} />
                <Button size="sm" onClick={() => { addNote.mutate({ order_id: editing.id, note: noteText }); setNoteText(""); }} disabled={!noteText.trim()}>+</Button>
              </div>
              <div className="space-y-2">
                {editing.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.product_name} x{item.quantity}</span>
                    <span>{formatNumber(Number(item.total))}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-2 font-bold">{language === "sw" ? "Jumla" : "Total"}: {formatNumber(Number(editing.total))}</div>
              <Button variant="destructive" className="w-full" onClick={() => { deleteOrder.mutate(editing.id); setEditing(null); }}>Delete</Button>
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{language === "sw" ? "Hakuna maagizo" : "No orders"}</TableCell></TableRow>
                ) : (
                  filteredOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.order_number}</TableCell>
                      <TableCell>{o.customer_name || (language === "sw" ? "Mteja wa Kawaida" : "Walk-in")}</TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(o.created_at), "dd MMM yyyy")}</TableCell>
                      <TableCell>{formatNumber(Number(o.total))}</TableCell>
                      <TableCell><Badge className={statusColors[o.status] || ""}>{o.status}</Badge></TableCell>
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
