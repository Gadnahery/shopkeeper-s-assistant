import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CreditCard, Phone, Receipt, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCustomers } from "@/hooks/useCustomers";
import { useSalesByCustomer } from "@/hooks/useSales";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageLoader } from "@/components/PageLoader";
import { PageHeader } from "@/components/common/PageHeader";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { data: customers, isLoading } = useCustomers();
  const customer = useMemo(() => (customers || []).find((entry) => entry.id === id), [customers, id]);
  const { data: sales } = useSalesByCustomer(id || null);

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
              <p className="text-2xl font-bold">{creditBalance.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
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
              customerSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{sale.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {sale.created_at ? new Date(sale.created_at).toLocaleString() : language === "sw" ? "Tarehe haipo" : "No date"}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {language === "sw" ? "Jumla" : "Total"}
                    </p>
                    <p className="text-lg font-semibold">{Number(sale.total || 0).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
