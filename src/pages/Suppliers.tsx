import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Search, Plus, Truck, Clock, Calendar, CreditCard, Pencil, Trash2, Loader2, Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from "@/hooks/useSuppliers";
import { useDraftForm } from "@/hooks/useDraftForm";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Suppliers() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [payDialog, setPayDialog] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");
  const [supplierToDeleteId, setSupplierToDeleteId] = useState<string | null>(null);
  const initialNewSupplier = { name: "", phone: "", email: "", contact_person: "", address: "" };
  const [newSupplier, setNewSupplier, clearAddSupplierDraft] = useDraftForm("add-supplier", initialNewSupplier);

  const { data: suppliers, isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const filteredSuppliers = suppliers?.filter(
    (s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.phone && s.phone.includes(searchTerm))
  ) || [];

  const formatNumber = (num: number) => num.toLocaleString("en-US");
  const totalPending = suppliers?.reduce((sum, s) => sum + Number(s.pending_payment), 0) || 0;

  const handleAddSupplier = async () => {
    await createSupplier.mutateAsync({ name: newSupplier.name, phone: newSupplier.phone || null, email: newSupplier.email || null, contact_person: newSupplier.contact_person || null, address: newSupplier.address || null, pending_payment: 0 });
    clearAddSupplierDraft();
    setIsAddOpen(false);
  };

  const handleEditSupplier = async () => {
    if (!editingSupplier) return;
    await updateSupplier.mutateAsync({ id: editingSupplier.id, name: editingSupplier.name, phone: editingSupplier.phone || null, email: editingSupplier.email || null, contact_person: editingSupplier.contact_person || null, address: editingSupplier.address || null, pending_payment: parseFloat(editingSupplier.pending_payment) || 0 });
    setEditingSupplier(null);
  };

  const handlePaySupplier = async () => {
    if (!payDialog) return;
    const amount = parseFloat(payAmount) || 0;
    const newBalance = Math.max(0, payDialog.pending_payment - amount);
    await updateSupplier.mutateAsync({ id: payDialog.id, pending_payment: newBalance });
    toast.success(language === "sw" ? "Malipo yamefanikiwa" : "Payment recorded");
    setPayDialog(null);
    setPayAmount("");
  };

  const stats = [
    { label: t("suppliers.totalSuppliers"), value: suppliers?.length.toString() || "0", icon: Truck, iconBg: "bg-primary/10", iconColor: "text-primary" },
    { label: t("suppliers.pendingPayments"), value: `Tsh ${formatNumber(totalPending)}`, icon: Clock, iconBg: "bg-secondary/10", iconColor: "text-secondary", valueColor: totalPending > 0 ? "text-destructive" : "" },
    { label: t("suppliers.lastPurchase"), value: `--`, icon: Calendar, iconBg: "bg-muted", iconColor: "text-muted-foreground" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-xl p-3 ${stat.iconBg}`}><stat.icon className={`h-6 w-6 ${stat.iconColor}`} /></div>
              <div><p className="text-sm text-muted-foreground">{stat.label}</p><p className={`text-xl font-bold ${stat.valueColor || ""}`}>{stat.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/60 dark:text-foreground/70 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
          <Input placeholder={t("suppliers.searchPlaceholder")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button className="gap-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30"><Plus className="h-4 w-4" />{t("suppliers.addSupplier")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("suppliers.addSupplier")}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2"><Label>{t("suppliers.supplierName")}</Label><Input value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Phone</Label><Input value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Contact Person</Label><Input value={newSupplier.contact_person} onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })} /></div>
              <div className="space-y-2"><Label>Address</Label><Input value={newSupplier.address} onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })} /></div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { clearAddSupplierDraft(); setIsAddOpen(false); }}>{t("common.cancel")}</Button>
                <Button 
                  className="gap-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all" 
                  onClick={handleAddSupplier} 
                  disabled={!newSupplier.name || createSupplier.isPending}
                >
                  {createSupplier.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingSupplier} onOpenChange={(o) => !o && setEditingSupplier(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("common.edit")} {language === "sw" ? "Msambazaji" : "Supplier"}</DialogTitle></DialogHeader>
          {editingSupplier && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2"><Label>{t("suppliers.supplierName")}</Label><Input value={editingSupplier.name} onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Phone</Label><Input value={editingSupplier.phone || ""} onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={editingSupplier.email || ""} onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Contact Person</Label><Input value={editingSupplier.contact_person || ""} onChange={(e) => setEditingSupplier({ ...editingSupplier, contact_person: e.target.value })} /></div>
              <div className="space-y-2"><Label>{t("suppliers.pendingPayment")}</Label><Input type="number" value={editingSupplier.pending_payment} onChange={(e) => setEditingSupplier({ ...editingSupplier, pending_payment: e.target.value })} /></div>
              <Button 
                className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all" 
                onClick={handleEditSupplier} 
                disabled={updateSupplier.isPending}
              >
                {updateSupplier.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pay Dialog */}
      <Dialog open={!!payDialog} onOpenChange={(o) => !o && setPayDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("customers.pay")} - {payDialog?.name}</DialogTitle></DialogHeader>
          {payDialog && (
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">{language === "sw" ? "Deni la sasa" : "Pending"}: <span className="font-bold text-destructive">Tsh {formatNumber(payDialog.pending_payment)}</span></p>
              <div className="space-y-2"><Label>{language === "sw" ? "Kiasi" : "Amount"}</Label><Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} /></div>
              <Button 
                className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all" 
                onClick={handlePaySupplier} 
                disabled={!payAmount || updateSupplier.isPending}
              >
                {updateSupplier.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Lipa" : "Record Payment")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("suppliers.supplierName")}</TableHead>
                  <TableHead>{t("suppliers.contact")}</TableHead>
                  <TableHead>{t("suppliers.pendingPayment")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{suppliers?.length === 0 ? (language === "sw" ? "Hakuna wasambazaji." : "No suppliers yet.") : "No match."}</TableCell></TableRow>
                ) : filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell><div><p className="font-medium">{supplier.name}</p>{supplier.contact_person && <p className="text-sm text-muted-foreground">{supplier.contact_person}</p>}</div></TableCell>
                    <TableCell><div><p>{supplier.phone || "-"}</p>{supplier.email && <p className="text-sm text-muted-foreground">{supplier.email}</p>}</div></TableCell>
                    <TableCell>{supplier.pending_payment > 0 ? <span className="font-medium text-destructive">{formatNumber(supplier.pending_payment)}</span> : <span className="text-success font-medium">{t("suppliers.paid")}</span>}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {supplier.pending_payment > 0 && (
                          <Button variant="outline" size="sm" className="gap-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => setPayDialog(supplier)}>
                            <CreditCard className="h-3 w-3" />{t("customers.pay")}
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/suppliers/${supplier.id}`)} title={language === "sw" ? "Tazama" : "View"}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingSupplier({ ...supplier })}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setSupplierToDeleteId(supplier.id)} disabled={deleteSupplier.isPending}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!supplierToDeleteId} onOpenChange={(open) => !open && setSupplierToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "sw" ? "Futa msaidizi huyu?" : "Delete this supplier?"}</AlertDialogTitle>
            <AlertDialogDescription>{t("common.confirmDeleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => supplierToDeleteId && deleteSupplier.mutate(supplierToDeleteId, { onSettled: () => setSupplierToDeleteId(null) })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSupplier.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
