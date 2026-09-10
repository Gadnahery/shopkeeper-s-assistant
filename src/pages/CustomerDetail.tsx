import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CreditCard, Phone, Receipt, UserRound, CheckCircle2, DollarSign, Loader2, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomers, useCustomerPayments, useRecordCustomerPayment } from "@/hooks/useCustomers";
import { useSalesByCustomer } from "@/hooks/useSales";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/PageLoader";
import { PageHeader } from "@/components/common/PageHeader";
import { EditSaleDialog } from "@/components/sales/EditSaleDialog";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { isOwner, role } = useAuth();
  const { data: customers, isLoading } = useCustomers();
  const customer = useMemo(() => (customers || []).find((entry) => entry.id === id), [customers, id]);
  const { data: sales } = useSalesByCustomer(id || null);
  const { data: payments = [] } = useCustomerPayments(id || null);
  const recordPayment = useRecordCustomerPayment();

  const [payAmount, setPayAmount] = useState("");
  const [editingSale, setEditingSale] = useState<any | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const canEdit = isOwner || role === "manager" || role === "owner";

  if (customers === undefined || isLoading) {
    return <PageLoader message="Loading customer..." messageSw="Inapakia mteja..." language={language} />;
  }

  if (!customer) {
    return (
      <div className="min-w-0 space-y-6">
        <PageHeader
          title={language === "sw" ? "Maelezo ya mteja" : "Customer details"}
          subtitle={language === "sw" ? "Mteja huyu hakuweza kupatikana." : "We could not find that customer record."}
          actions={
            <Button variant="outline" className="gap-2" onClick={() => navigate("/customers")}>
              <ArrowLeft className="h-4 w-4" />
              {language === "sw" ? "Rudi" : "Back"}
            </Button>
          }
        />
        <Card className="section-shell">
          <CardContent className="p-6 text-sm text-muted-foreground">
            {language === "sw" ? "Hakuna taarifa za mteja huyu." : "No customer information is available for this record."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const customerSales = sales || [];
  const totalSpent = customerSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const creditBalance = Number(customer.credit_balance || 0);
  const saleCount = customerSales.length;

  const handlePayDebt = async () => {
    const amount = parseFloat(payAmount) || 0;
    if (amount <= 0) return;
    try {
      await recordPayment.mutateAsync({
        customerId: customer.id,
        amount,
        paymentMethod: "Cash",
      });
      toast.success(language === "sw" ? "Malipo ya deni yamehifadhiwa" : "Debt payment recorded");
      setPayAmount("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to record payment");
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title={customer.name}
        subtitle={
          language === "sw"
            ? "Muhtasari wa historia ya manunuzi, mkopo, na taarifa za mawasiliano."
            : "Purchase history, credit balance, and contact details in one place."
        }
        actions={
          <Button variant="outline" className="gap-2" onClick={() => navigate("/customers")}>
            <ArrowLeft className="h-4 w-4" />
            {language === "sw" ? "Rudi kwa wateja" : "Back to customers"}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="section-shell">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === "sw" ? "Mauzo yote" : "Total sales"}</p>
              <p className="text-2xl font-bold">{saleCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="section-shell">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === "sw" ? "Jumla aliyotumia" : "Total spent"}</p>
              <p className="text-2xl font-bold">{totalSpent.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="section-shell">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === "sw" ? "Salio la mkopo" : "Credit balance"}</p>
              <p className="text-2xl font-bold text-amber-600">{creditBalance.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {creditBalance > 0 && (
        <Card className="section-shell border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
            <div>
              <p className="font-bold text-sm text-amber-900 dark:text-amber-200">
                {language === "sw" ? "Lipa Deni la Mteja" : "Record Debt Settlement"}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === "sw" ? `Salio linalodaiwa: TSH ${creditBalance.toLocaleString()}` : `Outstanding: TSH ${creditBalance.toLocaleString()}`}
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                type="number"
                placeholder={String(creditBalance)}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="h-9 w-36 rounded-xl border-border bg-background text-xs font-bold"
              />
              <Button
                onClick={handlePayDebt}
                disabled={recordPayment.isPending || !Number(payAmount)}
                className="h-9 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs"
              >
                {recordPayment.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <DollarSign className="h-3.5 w-3.5 mr-1 text-accent" />}
                <span>{language === "sw" ? "Rekodi Malipo" : "Pay Debt"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <Card className="section-shell">
            <CardHeader>
              <CardTitle>{language === "sw" ? "Taarifa za mteja" : "Customer information"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {language === "sw" ? "Simu" : "Phone"}
                </p>
                <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>{customer.phone || (language === "sw" ? "Haijawekwa" : "Not provided")}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {language === "sw" ? "Aina ya mteja" : "Customer type"}
                </p>
                <p className="mt-2 text-sm font-medium capitalize">{customer.customer_type || "retail"}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {language === "sw" ? "Muhtasari" : "Summary"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {language === "sw"
                    ? "Tumia ukurasa huu kufuatilia uaminifu wa mteja, kiwango cha mkopo, na historia yake ya manunuzi."
                    : "Use this page to track customer value, credit exposure, and recent shopping activity."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment History Log */}
          {payments.length > 0 && (
            <Card className="section-shell">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{language === "sw" ? "Historia ya Malipo ya Madeni" : "Debt Payments Ledger"} ({payments.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 p-3 text-xs">
                    <div>
                      <p className="font-semibold">{format(new Date(p.created_at), "dd MMM yyyy, HH:mm")}</p>
                      <p className="text-muted-foreground">{p.payment_method} {p.reference ? `· ${p.reference}` : ""}</p>
                    </div>
                    <p className="font-bold text-emerald-600 text-sm">+{Number(p.amount).toLocaleString()}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="section-shell">
          <CardHeader>
            <CardTitle>{language === "sw" ? "Mauzo ya hivi karibuni" : "Recent sales"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customerSales.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-background/60 p-6 text-sm text-muted-foreground">
                {language === "sw" ? "Bado hakuna mauzo yaliyohusishwa na mteja huyu." : "No sales have been recorded for this customer yet."}
              </div>
            ) : (
              customerSales.map((sale) => {
                const itemNames = ((sale as any).sale_items || []).map((it: any) => `${it.product_name || "Item"} (x${it.quantity})`).filter(Boolean);
                const itemsLabel = itemNames.length
                  ? itemNames.length > 2
                    ? `${itemNames.slice(0, 2).join(", ")} +${itemNames.length - 2} ${language === "sw" ? "zaidi" : "more"}`
                    : itemNames.join(", ")
                  : sale.invoice_number;

                return (
                  <div
                    key={sale.id}
                    className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-sm text-foreground truncate">{itemsLabel}</p>
                        {(sale as any).is_offline_pending && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-bold text-amber-600 dark:text-amber-400 border border-amber-300/40">
                            ⚡ {language === "sw" ? "Bila Mtandao" : "Offline"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {sale.invoice_number} · {sale.created_at ? new Date(sale.created_at).toLocaleString() : language === "sw" ? "Tarehe haipo" : "No date"} · {sale.payment_method}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 self-start sm:self-center">
                      <div className="text-left sm:text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {language === "sw" ? "Jumla" : "Total"}
                        </p>
                        <p className="text-lg font-semibold">{Number(sale.total || 0).toLocaleString()}</p>
                      </div>
                      {canEdit && !(sale as any).is_offline_pending && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={() => {
                            setEditingSale(sale);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {language === "sw" ? "Hariri" : "Edit"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <EditSaleDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        sale={editingSale}
      />
    </div>
  );
}
