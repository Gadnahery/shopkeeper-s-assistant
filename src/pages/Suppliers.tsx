import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { Search, Plus, Truck, Clock, Calendar, CreditCard, Pencil, Trash2, Loader2, Eye, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from "@/hooks/useSuppliers";
import { useDraftForm } from "@/hooks/useDraftForm";
import { toast } from "sonner";
import { PageLoader } from "@/components/PageLoader";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";

export default function Suppliers() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [payDialog, setPayDialog] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");
  const [supplierToDeleteId, setSupplierToDeleteId] = useState<string | null>(null);
  const [mobilePage, setMobilePage] = useState(1);
  const MOBILE_PAGE_SIZE = 4;
  const initialNewSupplier = { name: "", phone: "", email: "", contact_person: "", address: "" };
  const [newSupplier, setNewSupplier, clearAddSupplierDraft] = useDraftForm("add-supplier", initialNewSupplier);

  const { data: suppliers, isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  if (suppliers === undefined || isLoading) {
    return <PageLoader message="Loading suppliers..." messageSw="Inapakia wasambazaji..." language={language} />;
  }

  const filteredSuppliers = suppliers?.filter(
    (s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.phone && s.phone.includes(searchTerm))
  ) || [];

  const totalMobilePages = Math.max(1, Math.ceil(filteredSuppliers.length / MOBILE_PAGE_SIZE));
  const currentMobileSuppliers = filteredSuppliers.slice((mobilePage - 1) * MOBILE_PAGE_SIZE, mobilePage * MOBILE_PAGE_SIZE);

  const formatNumber = (num: number) => num.toLocaleString("en-US");
  const totalPending = suppliers?.reduce((sum, s) => sum + Number((s as any).pending_payment || 0), 0) || 0;

  const handleAddSupplier = async () => {
    await createSupplier.mutateAsync({ name: newSupplier.name, phone: newSupplier.phone || null, email: newSupplier.email || null, contact_person: newSupplier.contact_person || null, address: newSupplier.address || null });
    clearAddSupplierDraft();
    setIsAddOpen(false);
  };

  const handleEditSupplier = async () => {
    if (!editingSupplier) return;
    await updateSupplier.mutateAsync({ id: editingSupplier.id, name: editingSupplier.name, phone: editingSupplier.phone || null, email: editingSupplier.email || null, contact_person: editingSupplier.contact_person || null, address: editingSupplier.address || null });
    setEditingSupplier(null);
  };

  const handlePaySupplier = async () => {
    if (!payDialog) return;
    const amount = parseFloat(payAmount) || 0;
    const newBalance = Math.max(0, Number((payDialog as any).pending_payment || 0) - amount);
    await updateSupplier.mutateAsync({ id: payDialog.id, pending_payment: newBalance } as any);
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <PageHeader
        title={language === "sw" ? "Wasambazaji" : "Suppliers"}
        subtitle={language === "sw" ? "Fuatilia wasambazaji, malipo yanayosubiri, na mawasiliano ya biashara." : "Track suppliers, outstanding payments, and key business contacts in one place."}
        actions={
          <div className="flex w-full min-w-0 flex-wrap gap-2 xl:w-auto xl:justify-end">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/60 dark:text-foreground/70 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
              <Input placeholder={t("suppliers.searchPlaceholder")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Button onClick={() => setIsAddOpen(true)} className="gap-2 rounded-xl bg-neutral-950 text-xs font-bold text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950">
              <Plus className="h-4 w-4 text-accent" />
              {t("suppliers.addSupplier")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{stat.label}</span>
              <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg ${stat.iconBg} ${stat.iconColor} flex-shrink-0`}>
                <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <p className={`text-base sm:text-2xl font-bold tracking-tight text-foreground truncate ${stat.valueColor || ""}`}>{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Inventory-style Mobile Bottom Sheets */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-4 border-t border-border bg-card">
          <SheetHeader className="pb-3 border-b border-border">
            <SheetTitle className="text-sm font-bold">{t("suppliers.addSupplier")}</SheetTitle>
          </SheetHeader>
          <div className="space-y-3.5 pt-3 text-xs">
            <div className="space-y-1"><Label className="text-xs font-semibold">{t("suppliers.supplierName")}</Label><Input value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} className="h-9 rounded-xl text-xs" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs font-semibold">Phone</Label><Input value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} className="h-9 rounded-xl text-xs" /></div>
              <div className="space-y-1"><Label className="text-xs font-semibold">Email</Label><Input value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} className="h-9 rounded-xl text-xs" /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs font-semibold">Contact Person</Label><Input value={newSupplier.contact_person} onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })} className="h-9 rounded-xl text-xs" /></div>
            <div className="space-y-1"><Label className="text-xs font-semibold">Address</Label><Input value={newSupplier.address} onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })} className="h-9 rounded-xl text-xs" /></div>
            <div className="flex flex-col gap-2 pt-2">
              <Button className="w-full h-10 rounded-xl bg-neutral-950 font-medium text-white hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 text-xs shadow-xs" onClick={handleAddSupplier} disabled={!newSupplier.name || createSupplier.isPending}>
                {createSupplier.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {t("common.save")}
              </Button>
              <Button type="button" variant="outline" onClick={() => { clearAddSupplierDraft(); setIsAddOpen(false); }} className="w-full h-9 rounded-xl text-xs">{t("common.cancel")}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!editingSupplier} onOpenChange={(o) => !o && setEditingSupplier(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-4 border-t border-border bg-card">
          <SheetHeader className="pb-3 border-b border-border">
            <SheetTitle className="text-sm font-bold">{t("common.edit")} {language === "sw" ? "Msambazaji" : "Supplier"}</SheetTitle>
          </SheetHeader>
          {editingSupplier && (
            <div className="space-y-3.5 pt-3 text-xs">
              <div className="space-y-1"><Label className="text-xs font-semibold">{t("suppliers.supplierName")}</Label><Input value={editingSupplier.name} onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })} className="h-9 rounded-xl text-xs" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs font-semibold">Phone</Label><Input value={editingSupplier.phone || ""} onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })} className="h-9 rounded-xl text-xs" /></div>
                <div className="space-y-1"><Label className="text-xs font-semibold">Email</Label><Input value={editingSupplier.email || ""} onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })} className="h-9 rounded-xl text-xs" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs font-semibold">Contact Person</Label><Input value={editingSupplier.contact_person || ""} onChange={(e) => setEditingSupplier({ ...editingSupplier, contact_person: e.target.value })} className="h-9 rounded-xl text-xs" /></div>
              <div className="space-y-1"><Label className="text-xs font-semibold">{t("suppliers.pendingPayment")}</Label><Input type="number" value={editingSupplier.pending_payment} onChange={(e) => setEditingSupplier({ ...editingSupplier, pending_payment: e.target.value })} className="h-9 rounded-xl text-xs" /></div>
              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  className="w-full h-10 rounded-xl bg-neutral-950 font-medium text-white hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 text-xs shadow-xs" 
                  onClick={handleEditSupplier} 
                  disabled={updateSupplier.isPending}
                >
                  {updateSupplier.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  {t("common.save")}
                </Button>
                <Button variant="outline" onClick={() => setEditingSupplier(null)} className="w-full h-9 rounded-xl text-xs">{t("common.cancel")}</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!payDialog} onOpenChange={(o) => !o && setPayDialog(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-4 border-t border-border bg-card">
          <SheetHeader className="pb-3 border-b border-border">
            <SheetTitle className="text-sm font-bold">{t("customers.pay")} - {payDialog?.name}</SheetTitle>
          </SheetHeader>
          {payDialog && (
            <div className="space-y-3.5 pt-3 text-xs">
              <p className="text-xs text-muted-foreground">{language === "sw" ? "Deni la sasa" : "Pending"}: <span className="font-bold text-destructive">Tsh {formatNumber(payDialog.pending_payment)}</span></p>
              <div className="space-y-1"><Label className="text-xs font-semibold">{language === "sw" ? "Kiasi (TZS)" : "Amount (TZS)"}</Label><Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="h-9 rounded-xl text-xs" /></div>
              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  className="w-full h-10 rounded-xl bg-neutral-950 font-medium text-white hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 text-xs shadow-xs" 
                  onClick={handlePaySupplier} 
                  disabled={!payAmount || updateSupplier.isPending}
                >
                  {updateSupplier.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  {language === "sw" ? "Lipa Deni" : "Record Payment"}
                </Button>
                <Button variant="outline" onClick={() => setPayDialog(null)} className="w-full h-9 rounded-xl text-xs">{t("common.cancel")}</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Card className="section-shell overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <>
            <div className="internal-table-scroll hidden max-w-full md:block">
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
                    <TableCell>{Number((supplier as any).pending_payment || 0) > 0 ? <span className="badge-danger">Tsh {formatNumber(Number((supplier as any).pending_payment || 0))}</span> : <span className="badge-success">{t("suppliers.paid")}</span>}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {Number((supplier as any).pending_payment || 0) > 0 && (
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
            </div>

            {/* Mobile View: 4-Item Paginated List */}
            <div className="md:hidden">
              <div className="divide-y divide-border/60">
                {currentMobileSuppliers.length === 0 ? (
                  <p className="py-12 text-center text-xs text-muted-foreground">{suppliers?.length === 0 ? (language === "sw" ? "Hakuna wasambazaji." : "No suppliers yet.") : "No match."}</p>
                ) : (
                  currentMobileSuppliers.map((supplier) => (
                    <div key={supplier.id} className="p-3.5 flex items-center justify-between active:bg-muted/60 transition-colors">
                      <div className="min-w-0 flex-1 pr-3" onClick={() => navigate(`/suppliers/${supplier.id}`)}>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-xs text-foreground truncate">{supplier.name}</p>
                          <span className="badge-neutral text-[10px] px-1.5 py-0">{language === "sw" ? "Msambazaji" : "Supplier"}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {supplier.contact_person || supplier.phone || "-"}
                        </p>
                        <div className="mt-1">
                          {Number((supplier as any).pending_payment || 0) > 0 ? (
                            <span className="badge-danger text-[10px]">Deni: Tsh {formatNumber(Number((supplier as any).pending_payment || 0))}</span>
                          ) : (
                            <span className="badge-success text-[10px]">{t("suppliers.paid")}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {Number((supplier as any).pending_payment || 0) > 0 && (
                          <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] border-destructive text-destructive" onClick={() => setPayDialog(supplier)}>
                            <CreditCard className="h-3 w-3 mr-1" />{t("customers.pay")}
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setEditingSupplier({ ...supplier })}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground cursor-pointer" onClick={() => navigate(`/suppliers/${supplier.id}`)} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {totalMobilePages > 1 && (
                <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-border/60 bg-muted/20 text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={mobilePage <= 1}
                    onClick={() => setMobilePage((p) => Math.max(1, p - 1))}
                    className="h-7 px-2.5 text-[11px]"
                  >
                    {language === "sw" ? "Iliyopita" : "Previous"}
                  </Button>
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    {mobilePage} / {totalMobilePages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={mobilePage >= totalMobilePages}
                    onClick={() => setMobilePage((p) => Math.min(totalMobilePages, p + 1))}
                    className="h-7 px-2.5 text-[11px]"
                  >
                    {language === "sw" ? "Inayofuata" : "Next"}
                  </Button>
                </div>
              )}
            </div>
            </>
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
