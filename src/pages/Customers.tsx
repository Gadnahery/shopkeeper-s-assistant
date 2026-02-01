import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, CreditCard, History, Pencil, Trash2, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomers, useCreateCustomer, useDeleteCustomer } from "@/hooks/useCustomers";

export default function Customers() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    customer_type: "Retail",
  });

  const { data: customers, isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const filteredCustomers = customers?.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm))
  ) || [];

  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US");
  };

  const handleAddCustomer = async () => {
    await createCustomer.mutateAsync({
      name: newCustomer.name,
      phone: newCustomer.phone || null,
      customer_type: newCustomer.customer_type,
      credit_balance: 0,
    });
    setNewCustomer({ name: "", phone: "", customer_type: "Retail" });
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("customers.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t("customers.addCustomer")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("customers.addCustomer")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t("customers.name")}</Label>
                <Input
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("customers.phoneNumber")}</Label>
                <Input
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="06xxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("customers.type")}</Label>
                <Select
                  value={newCustomer.customer_type}
                  onValueChange={(v) => setNewCustomer({ ...newCustomer, customer_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Retail">{t("customers.retail")}</SelectItem>
                    <SelectItem value="Contractor">{t("customers.contractor")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="w-full" 
                onClick={handleAddCustomer}
                disabled={!newCustomer.name || createCustomer.isPending}
              >
                {createCustomer.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("common.save")
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
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
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {customers?.length === 0 ? "No customers yet. Add your first customer!" : "No customers match your search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.phone || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            customer.customer_type === "Contractor"
                              ? "border-secondary bg-secondary/10 text-secondary"
                              : "border-primary bg-primary/10 text-primary"
                          }
                        >
                          {customer.customer_type === "Contractor" ? t("customers.contractor") : t("customers.retail")}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={
                          customer.credit_balance > 0
                            ? "font-medium text-destructive"
                            : "text-muted-foreground"
                        }
                      >
                        {customer.credit_balance > 0
                          ? formatNumber(customer.credit_balance)
                          : "0"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {customer.credit_balance > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <CreditCard className="h-3 w-3" />
                              {t("customers.pay")}
                            </Button>
                          )}
                          {customer.credit_balance === 0 && (
                            <Button variant="ghost" size="sm" className="gap-1" disabled>
                              <CreditCard className="h-3 w-3" />
                              {t("customers.pay")}
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="gap-1">
                            <History className="h-3 w-3" />
                            {t("customers.history")}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteCustomer.mutate(customer.id)}
                            disabled={deleteCustomer.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
