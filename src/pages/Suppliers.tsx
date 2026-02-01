import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
  Plus,
  Truck,
  Clock,
  Calendar,
  CreditCard,
  History,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSuppliers, useCreateSupplier, useDeleteSupplier } from "@/hooks/useSuppliers";

export default function Suppliers() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    phone: "",
    email: "",
    contact_person: "",
    address: "",
  });

  const { data: suppliers, isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const filteredSuppliers = suppliers?.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.phone && supplier.phone.includes(searchTerm)) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US");
  };

  const totalPending = suppliers?.reduce((sum, s) => sum + Number(s.pending_payment), 0) || 0;

  const handleAddSupplier = async () => {
    await createSupplier.mutateAsync({
      name: newSupplier.name,
      phone: newSupplier.phone || null,
      email: newSupplier.email || null,
      contact_person: newSupplier.contact_person || null,
      address: newSupplier.address || null,
      pending_payment: 0,
    });
    setNewSupplier({ name: "", phone: "", email: "", contact_person: "", address: "" });
    setIsAddOpen(false);
  };

  const stats = [
    {
      label: t("suppliers.totalSuppliers"),
      value: suppliers?.length.toString() || "0",
      icon: Truck,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: t("suppliers.pendingPayments"),
      value: `Tsh ${formatNumber(totalPending)}`,
      icon: Clock,
      iconBg: "bg-secondary/10",
      iconColor: "text-secondary",
      valueColor: totalPending > 0 ? "text-destructive" : "",
    },
    {
      label: t("suppliers.lastPurchase"),
      value: `2 ${t("suppliers.daysAgo")}`,
      icon: Calendar,
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg p-3 ${stat.iconBg}`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.valueColor || ""}`}>
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("suppliers.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t("suppliers.addSupplier")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("suppliers.addSupplier")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t("suppliers.supplierName")}</Label>
                <Input
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  placeholder="Enter supplier name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    placeholder="0755 xxx xxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input
                  value={newSupplier.contact_person}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
                  placeholder="Enter contact person name"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  placeholder="Enter address"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleAddSupplier}
                disabled={!newSupplier.name || createSupplier.isPending}
              >
                {createSupplier.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("common.save")
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Suppliers Table */}
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
                  <TableHead>{t("suppliers.supplierName")}</TableHead>
                  <TableHead>{t("suppliers.contact")}</TableHead>
                  <TableHead>{t("suppliers.lastPurchase")}</TableHead>
                  <TableHead>{t("suppliers.pendingPayment")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {suppliers?.length === 0 ? "No suppliers yet. Add your first supplier!" : "No suppliers match your search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          {supplier.contact_person && (
                            <p className="text-sm text-muted-foreground">{supplier.contact_person}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{supplier.phone || "-"}</p>
                          {supplier.email && (
                            <p className="text-sm text-muted-foreground">{supplier.email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        {supplier.pending_payment > 0 ? (
                          <span className="font-medium text-destructive">
                            {formatNumber(supplier.pending_payment)}
                          </span>
                        ) : (
                          <span className="font-medium text-success">{t("suppliers.paid")}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {supplier.pending_payment > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <CreditCard className="h-3 w-3" />
                              {t("customers.pay")}
                            </Button>
                          )}
                          {supplier.pending_payment === 0 && (
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
                            onClick={() => deleteSupplier.mutate(supplier.id)}
                            disabled={deleteSupplier.isPending}
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
