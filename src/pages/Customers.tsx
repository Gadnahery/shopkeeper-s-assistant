import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, CreditCard, Pencil, Trash2, Loader2, Mail, History, Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from "@/hooks/useCustomers";
import { useDraftForm } from "@/hooks/useDraftForm";
import { useSalesByCustomer } from "@/hooks/useSales";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { PageLoader } from "@/components/PageLoader";
import { PageHeader } from "@/components/common/PageHeader";

export default function Customers() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [payDialog, setPayDialog] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");
  const [customerToDeleteId, setCustomerToDeleteId] = useState<string | null>(null);
  const initialNewCustomer = { name: "", phone: "", email: "", customer_type: "Retail", credit_balance: "0" };
  const [newCustomer, setNewCustomer, clearAddCustomerDraft] = useDraftForm("add-customer", initialNewCustomer);
  const [detailCustomer, setDetailCustomer] = useState<(typeof customers)[0] | null>(null);

  const { data: customers, isLoading } = useCustomers();
  const { data: customerSales } = useSalesByCustomer(detailCustomer?.id ?? null);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  if (customers === undefined || isLoading) {
    return <PageLoader message="Loading customers..." messageSw="Inapakia wateja..." language={language} />;
  }

  const filteredCustomers =
    customers?.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm)) ||
        ((c as { email?: string }).email && (c as { email?: string }).email?.toLowerCase().includes(searchTerm.toLowerCase()))
    ) ?? [];

  const formatNumber = (num: number) => num.toLocaleString("en-US");
  const customersWithCredit = filteredCustomers.filter((customer) => customer.credit_balance > 0).length;
  const totalCredit = filteredCustomers.reduce((sum, customer) => sum + Number(customer.credit_balance || 0), 0);

  const handleAddCustomer = async () => {
    await createCustomer.mutateAsync({
      name: newCustomer.name,
      phone: newCustomer.phone || null,
      email: newCustomer.email || undefined,
      customer_type: newCustomer.customer_type,
      credit_balance: parseFloat(newCustomer.credit_balance) || 0,
    } as Parameters<typeof createCustomer.mutateAsync>[0]);
    clearAddCustomerDraft();
    setIsAddOpen(false);
  };

  const handleEditCustomer = async () => {
    if (!editingCustomer) return;
    await updateCustomer.mutateAsync({
      id: editingCustomer.id,
      name: editingCustomer.name,
      phone: editingCustomer.phone || null,
      email: editingCustomer.email ?? undefined,
      customer_type: editingCustomer.customer_type,
      credit_balance: parseFloat(editingCustomer.credit_balance) || 0,
      internal_notes: editingCustomer.internal_notes ?? undefined,
    } as Parameters<typeof updateCustomer.mutateAsync>[0]);
    setEditingCustomer(null);
  };

  const handlePayCredit = async () => {
    if (!payDialog) return;
    const amount = parseFloat(payAmount) || 0;
    const newBalance = Math.max(0, payDialog.credit_balance - amount);
    await updateCustomer.mutateAsync({ id: payDialog.id, credit_balance: newBalance });
    toast.success(language === "sw" ? "Malipo yamefanikiwa" : "Payment recorded");
    setPayDialog(null);
    setPayAmount("");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <PageHeader
        title={language === "sw" ? "Wateja" : "Customers"}
        subtitle={language === "sw" ? "Simamia wateja, deni la mikopo, na historia ya ununuzi kwa mpangilio bora." : "Manage customer records, credit balances, and purchase history with a cleaner workspace."}
        actions={
          <div className="flex w-full min-w-0 flex-wrap gap-2 xl:w-auto xl:justify-end">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/60 dark:text-foreground/70 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
              <Input placeholder={t("customers.searchPlaceholder")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild><Button className="gap-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30"><Plus className="h-4 w-4" />{t("customers.addCustomer")}</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{t("customers.addCustomer")}</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2"><Label>{t("customers.name")}</Label><Input value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{t("customers.phoneNumber")}</Label><Input value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{language === "sw" ? "Barua pepe" : "Email"}</Label><Input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} placeholder="email@example.com" /></div>
                  <div className="space-y-2"><Label>{t("customers.type")}</Label>
                    <Select value={newCustomer.customer_type} onValueChange={(v) => setNewCustomer({ ...newCustomer, customer_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Retail">{t("customers.retail")}</SelectItem>
                        <SelectItem value="Contractor">{t("customers.contractor")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>{t("customers.creditBalance")}</Label><Input type="number" value={newCustomer.credit_balance} onChange={(e) => setNewCustomer({ ...newCustomer, credit_balance: e.target.value })} /></div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => { clearAddCustomerDraft(); setIsAddOpen(false); }}>{t("common.cancel")}</Button>
                    <Button className="gap-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all" onClick={handleAddCustomer} disabled={!newCustomer.name || createCustomer.isPending}>
                      {createCustomer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="section-shell">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{language === "sw" ? "Wateja wote" : "Total customers"}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{filteredCustomers.length}</p>
          </CardContent>
        </Card>
        <Card className="section-shell">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{language === "sw" ? "Wenye deni" : "Customers with credit"}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{customersWithCredit}</p>
          </CardContent>
        </Card>
        <Card className="section-shell">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{language === "sw" ? "Jumla ya deni" : "Outstanding credit"}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">Tsh {formatNumber(totalCredit)}</p>
          </CardContent>
        </Card>
      </section>

      {/* Edit Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={(o) => !o && setEditingCustomer(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("common.edit")} {language === "sw" ? "Mteja" : "Customer"}</DialogTitle></DialogHeader>
          {editingCustomer && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2"><Label>{t("customers.name")}</Label><Input value={editingCustomer.name} onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>{t("customers.phoneNumber")}</Label><Input value={editingCustomer.phone || ""} onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label>{t("customers.type")}</Label>
                <Select value={editingCustomer.customer_type} onValueChange={(v) => setEditingCustomer({ ...editingCustomer, customer_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Retail">{t("customers.retail")}</SelectItem>
                    <SelectItem value="Contractor">{t("customers.contractor")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>{language === "sw" ? "Barua pepe" : "Email"}</Label><Input type="email" value={editingCustomer.email || ""} onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })} placeholder="email@example.com" /></div>
              <div className="space-y-2"><Label>{t("customers.creditBalance")}</Label><Input type="number" value={editingCustomer.credit_balance} onChange={(e) => setEditingCustomer({ ...editingCustomer, credit_balance: e.target.value })} /></div>
              <div className="space-y-2"><Label>{language === "sw" ? "Maandishi ya Ndani" : "Internal Notes"}</Label><Input value={editingCustomer.internal_notes || ""} onChange={(e) => setEditingCustomer({ ...editingCustomer, internal_notes: e.target.value })} placeholder={language === "sw" ? "mf. Anapenda usafirishaji Jumamosi" : "e.g. Prefers delivery on Saturdays"} /></div>
              <Button 
                className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all" 
                onClick={handleEditCustomer} 
                disabled={updateCustomer.isPending}
              >
                {updateCustomer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Customer Detail / Purchase History */}
      <Dialog open={!!detailCustomer} onOpenChange={(o) => !o && setDetailCustomer(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><History className="h-5 w-5" />{detailCustomer?.name} - {language === "sw" ? "Historia ya Ununuzi" : "Purchase History"}</DialogTitle></DialogHeader>
          {detailCustomer && (
            <div className="space-y-4 pt-4">
              <div className="flex flex-wrap gap-2">
                {(detailCustomer as { loyalty_points?: number }).loyalty_points > 0 && (
                  <Badge variant="secondary">{(detailCustomer as { loyalty_points?: number }).loyalty_points} pts</Badge>
                )}
                {(detailCustomer as { email?: string }).email && (
                  <span className="flex items-center gap-1 text-sm text-foreground/70 dark:text-foreground/80">
                    <Mail className="h-4 w-4 dark:drop-shadow-[0_0_3px_rgba(59,130,246,0.2)]" />{(detailCustomer as { email?: string }).email}
                  </span>
                )}
              </div>
              {customerSales && customerSales.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-auto">
                  {customerSales.map((sale) => (
                    <div key={sale.id} className="rounded-lg border p-3">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{sale.invoice_number}</span>
                        <span className="text-foreground/70 dark:text-foreground/80">{new Date(sale.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="mt-1 text-lg font-bold text-foreground dark:text-foreground">Tsh {formatNumber(Number(sale.total))}</p>
                      <p className="text-xs text-foreground/70 dark:text-foreground/80">{sale.payment_method}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-foreground/70 dark:text-foreground/80">{language === "sw" ? "Hakuna historia ya ununuzi." : "No purchase history yet."}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pay Credit Dialog */}
      <Dialog open={!!payDialog} onOpenChange={(o) => !o && setPayDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("customers.pay")} - {payDialog?.name}</DialogTitle></DialogHeader>
          {payDialog && (
            <div className="space-y-4 pt-4">
              <p className="text-sm text-foreground/70 dark:text-foreground/80">{language === "sw" ? "Deni la sasa" : "Current balance"}: <span className="font-bold text-destructive dark:text-destructive">Tsh {formatNumber(payDialog.credit_balance)}</span></p>
              <div className="space-y-2"><Label>{language === "sw" ? "Kiasi cha Kulipa" : "Payment Amount"}</Label><Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0" /></div>
              <Button 
                className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all" 
                onClick={handlePayCredit} 
                disabled={!payAmount || updateCustomer.isPending}
              >
                {updateCustomer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Lipa" : "Record Payment")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card className="section-shell overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <>
            <div className="hidden max-w-full overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("customers.name")}</TableHead>
                  <TableHead>{t("customers.phoneNumber")}</TableHead>
                  <TableHead>{t("customers.type")}</TableHead>
                  <TableHead>{t("customers.creditBalance")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-foreground/70 dark:text-foreground/80">{customers?.length === 0 ? (language === "sw" ? "Hakuna wateja bado." : "No customers yet.") : (language === "sw" ? "Hakuna matokeo." : "No match.")}</TableCell></TableRow>
                ) : filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {customer.name}
                        {(customer as { loyalty_points?: number }).loyalty_points > 0 && (
                          <Badge variant="outline" className="text-xs">{(customer as { loyalty_points?: number }).loyalty_points} pts</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{customer.phone || "-"}</span>
                        {(customer as { email?: string }).email && <span className="text-xs text-foreground/70 dark:text-foreground/80">{(customer as { email?: string }).email}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={customer.customer_type === "Contractor" ? "border-secondary bg-secondary/10 text-secondary" : "border-primary bg-primary/10 text-primary"}>
                        {customer.customer_type === "Contractor" ? t("customers.contractor") : t("customers.retail")}
                      </Badge>
                    </TableCell>
                    <TableCell className={customer.credit_balance > 0 ? "font-medium text-destructive dark:text-destructive" : "text-foreground/70 dark:text-foreground/80"}>
                      {customer.credit_balance > 0 ? formatNumber(customer.credit_balance) : "0"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {customer.credit_balance > 0 && (
                          <Button variant="outline" size="sm" className="gap-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => setPayDialog(customer)}>
                            <CreditCard className="h-3 w-3" />{t("customers.pay")}
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/10 dark:hover:bg-blue-500/20" title={language === "sw" ? "Tazama" : "View"} onClick={() => navigate(`/customers/${customer.id}`)}>
                          <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/10 dark:hover:bg-blue-500/20" title={language === "sw" ? "Historia" : "History"} onClick={() => setDetailCustomer(customer)}>
                          <History className="h-4 w-4 text-blue-600 dark:text-blue-400 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/10 dark:hover:bg-blue-500/20" onClick={() => setEditingCustomer({ ...customer })}>
                          <Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20" onClick={() => setCustomerToDeleteId(customer.id)} disabled={deleteCustomer.isPending}>
                          <Trash2 className="h-4 w-4 dark:drop-shadow-[0_0_4px_rgba(239,68,68,0.3)]" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            <div className="grid gap-3 p-4 md:hidden">
              {filteredCustomers.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">{customers?.length === 0 ? (language === "sw" ? "Hakuna wateja bado." : "No customers yet.") : (language === "sw" ? "Hakuna matokeo." : "No match.")}</div>
              ) : (
                filteredCustomers.map((customer) => (
                  <Card key={customer.id} className="border-border/70 bg-background/60">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.phone || "-"}</p>
                        </div>
                        <Badge variant="outline" className={customer.customer_type === "Contractor" ? "border-secondary bg-secondary/10 text-secondary" : "border-primary bg-primary/10 text-primary"}>
                          {customer.customer_type === "Contractor" ? t("customers.contractor") : t("customers.retail")}
                        </Badge>
                      </div>
                      {(customer as { email?: string }).email && <p className="text-sm text-muted-foreground">{(customer as { email?: string }).email}</p>}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t("customers.creditBalance")}</span>
                        <span className={customer.credit_balance > 0 ? "font-semibold text-destructive" : "font-semibold"}>{formatNumber(customer.credit_balance)}</span>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        {customer.credit_balance > 0 && (
                          <Button variant="outline" size="sm" className="gap-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => setPayDialog(customer)}>
                            <CreditCard className="h-3 w-3" />{t("customers.pay")}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => navigate(`/customers/${customer.id}`)}><Eye className="mr-1 h-4 w-4" />{language === "sw" ? "Tazama" : "View"}</Button>
                        <Button variant="outline" size="sm" onClick={() => setDetailCustomer(customer)}><History className="mr-1 h-4 w-4" />{language === "sw" ? "Historia" : "History"}</Button>
                        <Button variant="outline" size="sm" onClick={() => setEditingCustomer({ ...customer })}><Pencil className="mr-1 h-4 w-4" />{language === "sw" ? "Hariri" : "Edit"}</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!customerToDeleteId} onOpenChange={(open) => !open && setCustomerToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "sw" ? "Futa mteja huyu?" : "Delete this customer?"}</AlertDialogTitle>
            <AlertDialogDescription>{t("common.confirmDeleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => customerToDeleteId && deleteCustomer.mutate(customerToDeleteId, { onSettled: () => setCustomerToDeleteId(null) })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCustomer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
