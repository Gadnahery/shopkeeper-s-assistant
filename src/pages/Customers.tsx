import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, CreditCard, Pencil, Trash2, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from "@/hooks/useCustomers";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Customers() {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [payDialog, setPayDialog] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", customer_type: "Retail", credit_balance: "0" });

  const { data: customers, isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const filteredCustomers = customers?.filter(
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.phone && c.phone.includes(searchTerm))
  ) || [];

  const formatNumber = (num: number) => num.toLocaleString("en-US");

  const handleAddCustomer = async () => {
    await createCustomer.mutateAsync({
      name: newCustomer.name, phone: newCustomer.phone || null,
      customer_type: newCustomer.customer_type, credit_balance: parseFloat(newCustomer.credit_balance) || 0,
    });
    setNewCustomer({ name: "", phone: "", customer_type: "Retail", credit_balance: "0" });
    setIsAddOpen(false);
  };

  const handleEditCustomer = async () => {
    if (!editingCustomer) return;
    await updateCustomer.mutateAsync({
      id: editingCustomer.id, name: editingCustomer.name,
      phone: editingCustomer.phone || null, customer_type: editingCustomer.customer_type,
      credit_balance: parseFloat(editingCustomer.credit_balance) || 0,
    });
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t("customers.searchPlaceholder")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />{t("customers.addCustomer")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("customers.addCustomer")}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2"><Label>{t("customers.name")}</Label><Input value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>{t("customers.phoneNumber")}</Label><Input value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} /></div>
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
              <Button className="w-full" onClick={handleAddCustomer} disabled={!newCustomer.name || createCustomer.isPending}>
                {createCustomer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
              <div className="space-y-2"><Label>{t("customers.creditBalance")}</Label><Input type="number" value={editingCustomer.credit_balance} onChange={(e) => setEditingCustomer({ ...editingCustomer, credit_balance: e.target.value })} /></div>
              <Button className="w-full" onClick={handleEditCustomer} disabled={updateCustomer.isPending}>
                {updateCustomer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
              </Button>
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
              <p className="text-sm text-muted-foreground">{language === "sw" ? "Deni la sasa" : "Current balance"}: <span className="font-bold text-destructive">Tsh {formatNumber(payDialog.credit_balance)}</span></p>
              <div className="space-y-2"><Label>{language === "sw" ? "Kiasi cha Kulipa" : "Payment Amount"}</Label><Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0" /></div>
              <Button className="w-full" onClick={handlePayCredit} disabled={!payAmount || updateCustomer.isPending}>
                {updateCustomer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Lipa" : "Record Payment")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
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
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{customers?.length === 0 ? (language === "sw" ? "Hakuna wateja bado." : "No customers yet.") : (language === "sw" ? "Hakuna matokeo." : "No match.")}</TableCell></TableRow>
                ) : filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={customer.customer_type === "Contractor" ? "border-secondary bg-secondary/10 text-secondary" : "border-primary bg-primary/10 text-primary"}>
                        {customer.customer_type === "Contractor" ? t("customers.contractor") : t("customers.retail")}
                      </Badge>
                    </TableCell>
                    <TableCell className={customer.credit_balance > 0 ? "font-medium text-destructive" : "text-muted-foreground"}>
                      {customer.credit_balance > 0 ? formatNumber(customer.credit_balance) : "0"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {customer.credit_balance > 0 && (
                          <Button variant="outline" size="sm" className="gap-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => setPayDialog(customer)}>
                            <CreditCard className="h-3 w-3" />{t("customers.pay")}
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingCustomer({ ...customer })}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCustomer.mutate(customer.id)} disabled={deleteCustomer.isPending}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
