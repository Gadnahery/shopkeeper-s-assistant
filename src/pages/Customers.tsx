import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  CreditCard,
  DollarSign,
  Eye,
  History,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Search,
  Trash2,
  TrendingDown,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer, useRecordCustomerPayment, useCustomerPayments } from "@/hooks/useCustomers";
import { useSalesByCustomer } from "@/hooks/useSales";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { PageLoader } from "@/components/PageLoader";
import { cn } from "@/lib/utils";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";

export default function Customers() {
  const { t, language } = useLanguage();
  const { formatMoney, formatNumber } = useShopFormatting();
  const { isMobile } = useAdaptiveLayout();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [mobileCustomerPage, setMobileCustomerPage] = useState(1);

  // Inline Master-Detail Panel State (NO POPUPS)
  const [isAddingCustomer, setIsAddingCustomer] = useState(searchParams.get("new") === "true");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [customerToDeleteId, setCustomerToDeleteId] = useState<string | null>(null);

  // Forms
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    customer_type: "Retail",
    credit_balance: "0",
  });
  const [editForm, setEditForm] = useState<any>(null);

  const { data: customers, isLoading } = useCustomers();
  const { data: customerSales } = useSalesByCustomer(selectedCustomer?.id ?? null);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const recordPayment = useRecordCustomerPayment();
  const { data: customerPayments } = useCustomerPayments(selectedCustomer?.id ?? null);

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsAddingCustomer(true);
      setSelectedCustomer(null);
    }
  }, [searchParams]);

  // Auto-select first customer
  useEffect(() => {
    if (customers && customers.length > 0 && !selectedCustomer && !isAddingCustomer) {
      const first = customers[0];
      setSelectedCustomer(first);
      setEditForm({ ...first });
    }
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm)) ||
        ((c as any).email && (c as any).email.toLowerCase().includes(searchTerm.toLowerCase())),
    );
  }, [customers, searchTerm]);

  const MOBILE_CUSTOMER_PAGE_SIZE = 4;
  const totalMobileCustomerPages = Math.ceil(filteredCustomers.length / MOBILE_CUSTOMER_PAGE_SIZE) || 1;
  const currentMobileCustomers = useMemo(() => {
    const start = (mobileCustomerPage - 1) * MOBILE_CUSTOMER_PAGE_SIZE;
    return filteredCustomers.slice(start, start + MOBILE_CUSTOMER_PAGE_SIZE);
  }, [filteredCustomers, mobileCustomerPage]);

  useEffect(() => {
    setMobileCustomerPage(1);
  }, [searchTerm]);

  const totalCredit = filteredCustomers.reduce((sum, c) => sum + Number(c.credit_balance || 0), 0);
  const creditCount = filteredCustomers.filter((c) => Number(c.credit_balance) > 0).length;

  if (customers === undefined || isLoading) {
    return <PageLoader message="Loading customers..." messageSw="Inapakia wateja..." language={language} />;
  }

  const handleSelectCustomer = (c: any) => {
    setSelectedCustomer(c);
    setIsAddingCustomer(false);
    setIsEditing(false);
    setEditForm(c);
    if (isMobile) setMobileDrawerOpen(true);
  };

  const handleStartAddCustomer = () => {
    setIsAddingCustomer(true);
    setSelectedCustomer(null);
    setIsEditing(false);
    if (isMobile) setMobileDrawerOpen(true);
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) return;
    try {
      const created = await createCustomer.mutateAsync({
        name: newCustomer.name.trim(),
        phone: newCustomer.phone?.trim() || null,
        email: newCustomer.email?.trim() || undefined,
        customer_type: newCustomer.customer_type,
        credit_balance: parseFloat(newCustomer.credit_balance) || 0,
      } as any);

      toast.success(language === "sw" ? "Mteja ameongezwa" : "Customer added");
      setIsAddingCustomer(false);
      setMobileDrawerOpen(false);
      setNewCustomer({ name: "", phone: "", email: "", customer_type: "Retail", credit_balance: "0" });
      if (created) handleSelectCustomer(created);
    } catch (err: any) {
      toast.error(err?.message || "Failed to add customer");
    }
  };

  const handleUpdateCustomer = async () => {
    if (!editForm) return;
    try {
      await updateCustomer.mutateAsync({
        id: editForm.id,
        name: editForm.name.trim(),
        phone: editForm.phone?.trim() || null,
        email: editForm.email?.trim() || undefined,
        customer_type: editForm.customer_type,
        credit_balance: parseFloat(editForm.credit_balance) || 0,
      } as any);

      toast.success(language === "sw" ? "Mteja amesasishwa" : "Customer updated");
      setIsEditing(false);
      setSelectedCustomer({ ...editForm });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update customer");
    }
  };

  const handlePayDebt = async () => {
    if (!selectedCustomer) return;
    const amount = parseFloat(payAmount) || 0;
    if (amount <= 0) return;

    try {
      const res = await recordPayment.mutateAsync({
        customerId: selectedCustomer.id,
        amount,
        paymentMethod: "Cash",
      });
      toast.success(language === "sw" ? "Malipo ya deni yamehifadhiwa" : "Debt payment recorded");
      setSelectedCustomer({ ...selectedCustomer, credit_balance: res.new_balance });
      setPayAmount("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to record payment");
    }
  };

  const renderAddCustomerForm = () => (
    <Card className="border border-border bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
        <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-accent" />
          <span>{t("customers.addCustomer")}</span>
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsAddingCustomer(false);
            setMobileDrawerOpen(false);
          }}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">{t("customers.name")} *</Label>
          <Input
            value={newCustomer.name}
            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
            placeholder="e.g. Amani Mwita"
            className="h-9 rounded-xl border-border bg-background text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">{t("customers.phone")}</Label>
            <Input
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              placeholder="0712345678"
              className="h-9 rounded-xl border-border bg-background text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">{language === "sw" ? "Aina" : "Type"}</Label>
            <Select
              value={newCustomer.customer_type}
              onValueChange={(v) => setNewCustomer({ ...newCustomer, customer_type: v })}
            >
              <SelectTrigger className="h-9 rounded-xl border-border bg-background text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-popover text-xs">
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Wholesale">Wholesale</SelectItem>
                <SelectItem value="Corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">{language === "sw" ? "Barua Pepe" : "Email"}</Label>
          <Input
            type="email"
            value={newCustomer.email}
            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
            placeholder="customer@example.com"
            className="h-9 rounded-xl border-border bg-background text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">{language === "sw" ? "Deni la Awali (TSH)" : "Initial Credit Balance"}</Label>
          <Input
            type="number"
            value={newCustomer.credit_balance}
            onChange={(e) => setNewCustomer({ ...newCustomer, credit_balance: e.target.value })}
            onFocus={(e) => e.target.select()}
            placeholder="0"
            className="h-9 rounded-xl border-border bg-background text-xs"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsAddingCustomer(false);
              setMobileDrawerOpen(false);
            }}
            className="h-9 rounded-xl text-xs flex-1"
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleAddCustomer}
            disabled={createCustomer.isPending || !newCustomer.name.trim()}
            className="h-9 rounded-xl bg-neutral-950 text-xs font-medium text-white hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 flex-[2] shadow-xs"
          >
            {createCustomer.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            <span>{t("common.save")}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderCustomerDetail = () => {
    if (!selectedCustomer) return null;
    return (
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
          <div>
            <CardTitle className="text-sm font-bold text-foreground">
              {selectedCustomer.name}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">{selectedCustomer.phone || "No phone"} · {selectedCustomer.customer_type || "Retail"}</p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="h-7 text-xs rounded-lg gap-1"
            >
              <Pencil className="h-3 w-3" />
              <span>{isEditing ? (language === "sw" ? "Funga" : "Close") : (language === "sw" ? "Hariri" : "Edit")}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCustomerToDeleteId(selectedCustomer.id)}
              className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedCustomer(null);
                setMobileDrawerOpen(false);
              }}
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Mode A: Edit Form */}
          {isEditing ? (
            <div className="space-y-3 rounded-xl bg-muted/30 p-3 border border-border">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">{t("customers.name")}</Label>
                <Input
                  value={editForm?.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="h-9 rounded-xl border-border bg-background text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">{t("customers.phone")}</Label>
                  <Input
                    value={editForm?.phone || ""}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="h-9 rounded-xl border-border bg-background text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">{language === "sw" ? "Deni (TSH)" : "Debt"}</Label>
                  <Input
                    type="number"
                    value={editForm?.credit_balance || 0}
                    onChange={(e) => setEditForm({ ...editForm, credit_balance: e.target.value })}
                    onFocus={(e) => e.target.select()}
                    className="h-9 rounded-xl border-border bg-background text-xs font-bold"
                  />
                </div>
              </div>
              <Button onClick={handleUpdateCustomer} className="h-8 w-full rounded-xl bg-neutral-950 text-xs font-medium text-white hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 shadow-xs">
                {t("common.save")}
              </Button>
            </div>
          ) : null}

          {/* Outstanding Debt & Payment */}
          <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">{t("customers.totalDebt")}</span>
              <span className={cn("text-base font-bold", Number(selectedCustomer.credit_balance) > 0 ? "text-[var(--danger-text)]" : "text-foreground")}>
                {formatMoney(selectedCustomer.credit_balance || 0)}
              </span>
            </div>

            {Number(selectedCustomer.credit_balance) > 0 && (
              <div className="space-y-2 pt-1 border-t border-border/60">
                <Label className="text-[11px] font-semibold text-muted-foreground">{t("customers.amountToPay")} (TSH)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder={String(selectedCustomer.credit_balance)}
                    className="h-9 flex-1 rounded-xl border-border bg-background text-xs font-bold"
                  />
                  <Button
                    onClick={handlePayDebt}
                    disabled={updateCustomer.isPending || !Number(payAmount)}
                    className="h-9 rounded-xl bg-neutral-950 text-xs font-medium text-white hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 shadow-xs"
                  >
                    {updateCustomer.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DollarSign className="h-3.5 w-3.5 text-accent mr-1" />}
                    <span>{t("customers.payDebt")}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Payment History / Auditable Debt Settlements */}
          {customerPayments && customerPayments.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>{language === "sw" ? "Historia ya Malipo ya Deni" : "Debt Repayment History"} ({customerPayments.length})</span>
              </span>

              <div className="max-h-36 overflow-y-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-xs">
                      <TableHead>{language === "sw" ? "Tarehe" : "Date"}</TableHead>
                      <TableHead>{language === "sw" ? "Njia" : "Method"}</TableHead>
                      <TableHead className="text-right">{language === "sw" ? "Kiasi" : "Amount"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerPayments.map((p) => (
                      <TableRow key={p.id} className="text-xs">
                        <TableCell className="font-medium text-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-muted-foreground">{p.payment_method}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">+{formatMoney(p.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Purchase History */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-accent" />
              <span>{t("customers.purchaseHistory")} ({customerSales?.length || 0})</span>
            </span>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-xs">
                    <TableHead>{t("sales.date")}</TableHead>
                    <TableHead>{language === "sw" ? "Bidhaa" : "Items"}</TableHead>
                    <TableHead>{t("sales.paymentMethod")}</TableHead>
                    <TableHead className="text-right">{t("sales.total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!customerSales || customerSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-xs text-muted-foreground">
                        {language === "sw" ? "Hakuna historia bado." : "No sales history yet."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    customerSales.slice(0, 10).map((s: any) => {
                      const itemNames = (s.sale_items || []).map((it: any) => it.product_name).filter(Boolean);
                      const itemsText = itemNames.length
                        ? itemNames.length > 2
                          ? `${itemNames.slice(0, 2).join(", ")} +${itemNames.length - 2}`
                          : itemNames.join(", ")
                        : (s.invoice_number || "Sale");

                      return (
                        <TableRow key={s.id} className="text-xs">
                          <TableCell className="font-medium text-foreground whitespace-nowrap">{format(new Date(s.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell className="text-foreground font-medium max-w-[160px] truncate" title={itemNames.join(", ")}>{itemsText}</TableCell>
                          <TableCell className="capitalize text-muted-foreground">{s.payment_method}</TableCell>
                          <TableCell className="text-right font-bold text-foreground">{formatMoney(s.total)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 4 Compact Olly KPI Cards (2x2 on Mobile, 4 cols on Desktop) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{t("customers.totalCustomers")}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground">{customers?.length || 0}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Wateja waliosajiliwa" : "Registered accounts"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{t("customers.totalOutstandingDebt")}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{formatMoney(totalCredit)}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{creditCount} {language === "sw" ? "wenye madeni" : "with balance"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Wateja wa Madeni" : "Debt Accounts"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground">{creditCount}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Akaunti za deni" : "Active credit"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Wateja wa Jumla" : "Wholesale"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground">
              {customers?.filter((c) => c.customer_type === "Wholesale").length || 0}
            </p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Akaunti za jumla" : "Wholesale clients"}</p>
          </div>
        </Card>
      </div>

      {/* 2-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Master Customers List / Table */}
        <div className="space-y-4 lg:col-span-7">
          <Card className="border border-border bg-card shadow-xs">
            <div className="flex flex-col gap-3 border-b border-border p-3.5 sm:p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={language === "sw" ? "Tafuta mteja..." : "Search customer..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 rounded-xl border-border bg-background pl-9 text-xs"
                />
              </div>

              <Button
                onClick={handleStartAddCustomer}
                className="h-9 gap-1.5 rounded-xl bg-neutral-950 text-xs font-medium text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950"
              >
                <Plus className="h-3.5 w-3.5 text-accent" />
                <span>{t("customers.addCustomer")}</span>
              </Button>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Users className="h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {language === "sw" ? "Hakuna wateja waliopatikana" : "No customers found"}
                </p>
                <Button
                  onClick={handleStartAddCustomer}
                  className="mt-3 h-8 rounded-xl text-xs bg-primary text-primary-foreground"
                >
                  <Plus className="mr-1 h-3.5 w-3.5 text-accent" />
                  {t("customers.addCustomer")}
                </Button>
              </div>
            ) : (
              <>
                {/* Mobile View: 4 Compact Cards per page */}
                <div className="md:hidden">
                  <div className="divide-y divide-border/60">
                    {currentMobileCustomers.map((c) => {
                      const isSelected = selectedCustomer?.id === c.id && !isAddingCustomer;
                      const hasDebt = Number(c.credit_balance) > 0;

                      return (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className={cn(
                            "flex items-center justify-between p-3.5 transition-colors active:bg-muted/60 cursor-pointer",
                            isSelected ? "bg-accent/10" : ""
                          )}
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <p className="font-semibold text-xs text-foreground truncate">{c.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                              <span>{c.phone || (language === "sw" ? "Bila simu" : "No phone")}</span>
                              <span>•</span>
                              <span className="badge-neutral text-[10px] px-1.5 py-0">{c.customer_type || "Retail"}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {hasDebt ? (
                              <span className="badge-danger font-bold text-[11px] px-2 py-0.5">
                                {formatMoney(c.credit_balance)}
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">{formatMoney(0)}</span>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalMobileCustomerPages > 1 && (
                    <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-border/60 bg-muted/20 text-xs">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={mobileCustomerPage <= 1}
                        onClick={() => setMobileCustomerPage((p) => Math.max(1, p - 1))}
                        className="h-7 px-2.5 text-[11px]"
                      >
                        {language === "sw" ? "Iliyopita" : "Previous"}
                      </Button>
                      <span className="text-[11px] text-muted-foreground font-semibold">
                        {mobileCustomerPage} / {totalMobileCustomerPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={mobileCustomerPage >= totalMobileCustomerPages}
                        onClick={() => setMobileCustomerPage((p) => Math.min(totalMobileCustomerPages, p + 1))}
                        className="h-7 px-2.5 text-[11px]"
                      >
                        {language === "sw" ? "Inayofuata" : "Next"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Desktop View: Full Master Table */}
                <div className="internal-table-scroll hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{t("customers.name")}</TableHead>
                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{t("customers.phone")}</TableHead>
                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{language === "sw" ? "Aina" : "Type"}</TableHead>
                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{t("customers.debt")}</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase text-muted-foreground"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((c) => {
                        const isSelected = selectedCustomer?.id === c.id && !isAddingCustomer;
                        const hasDebt = Number(c.credit_balance) > 0;

                        return (
                          <TableRow
                            key={c.id}
                            onClick={() => handleSelectCustomer(c)}
                            className={cn(
                              "cursor-pointer border-b border-border/60 transition-colors",
                              isSelected ? "bg-accent/10 hover:bg-accent/15" : "hover:bg-muted/40",
                            )}
                          >
                            <TableCell className="text-xs font-semibold text-foreground">
                              {c.name}
                            </TableCell>
                            <TableCell className="text-xs text-foreground">{c.phone || "-"}</TableCell>
                            <TableCell>
                              <span className="badge-neutral">
                                {c.customer_type || "Retail"}
                              </span>
                            </TableCell>
                            <TableCell>
                              {hasDebt ? (
                                <span className="badge-danger font-bold">
                                  {formatMoney(c.credit_balance)}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">{formatMoney(0)}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <ChevronRight className={cn("h-4 w-4 transition-transform", isSelected ? "text-accent translate-x-1" : "text-muted-foreground")} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Desktop Right Column: Inline Action / Detail Panel */}
        <div className="hidden lg:block lg:col-span-5 space-y-4">
          {isAddingCustomer && renderAddCustomerForm()}
          {!isAddingCustomer && selectedCustomer && renderCustomerDetail()}
        </div>
      </div>

      {/* Mobile Bottom Sheet for Adding / Viewing / Paying Customer */}
      <Sheet open={Boolean(isMobile && mobileDrawerOpen)} onOpenChange={setMobileDrawerOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-0 border-t border-border bg-card lg:hidden">
          <div className="p-1">
            {isAddingCustomer && renderAddCustomerForm()}
            {!isAddingCustomer && selectedCustomer && renderCustomerDetail()}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Customer Confirm */}
      <AlertDialog open={!!customerToDeleteId} onOpenChange={(o) => !o && setCustomerToDeleteId(null)}>
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
              {deleteCustomer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Futa" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
