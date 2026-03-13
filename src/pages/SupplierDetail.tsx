import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Mail, MapPin, Phone, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageLoader } from "@/components/PageLoader";
import { PageHeader } from "@/components/common/PageHeader";

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { data: suppliers, isLoading } = useSuppliers();
  const supplier = useMemo(() => (suppliers || []).find((entry) => entry.id === id), [suppliers, id]);

  if (suppliers === undefined || isLoading) {
    return <PageLoader message="Loading supplier..." messageSw="Inapakia msambazaji..." language={language} />;
  }

  if (!supplier) {
    return (
      <div className="min-w-0 space-y-6">
        <PageHeader
          title={language === "sw" ? "Maelezo ya msambazaji" : "Supplier details"}
          subtitle={language === "sw" ? "Msambazaji huyu hakuweza kupatikana." : "We could not find that supplier record."}
          actions={
            <Button variant="outline" className="gap-2" onClick={() => navigate("/suppliers")}>
              <ArrowLeft className="h-4 w-4" />
              {language === "sw" ? "Rudi" : "Back"}
            </Button>
          }
        />
        <Card className="section-shell">
          <CardContent className="p-6 text-sm text-muted-foreground">
            {language === "sw" ? "Hakuna taarifa za msambazaji huyu." : "No supplier information is available for this record."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingPayment = Number(supplier.pending_payment || 0);

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title={supplier.name}
        subtitle={
          language === "sw"
            ? "Angalia mawasiliano, anwani, na malipo yanayosubiri kwa msambazaji huyu."
            : "Review contact info, address, and pending payables for this supplier."
        }
        actions={
          <Button variant="outline" className="gap-2" onClick={() => navigate("/suppliers")}>
            <ArrowLeft className="h-4 w-4" />
            {language === "sw" ? "Rudi kwa wasambazaji" : "Back to suppliers"}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="section-shell">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === "sw" ? "Jina la biashara" : "Business name"}</p>
              <p className="text-xl font-bold">{supplier.name}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="section-shell">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-600">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === "sw" ? "Simu" : "Phone"}</p>
              <p className="text-xl font-bold">{supplier.phone || (language === "sw" ? "Haijawekwa" : "Not set")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="section-shell">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === "sw" ? "Malipo yanayosubiri" : "Pending payment"}</p>
              <p className="text-2xl font-bold">{pendingPayment.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="section-shell">
          <CardHeader>
            <CardTitle>{language === "sw" ? "Taarifa za mawasiliano" : "Contact information"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {language === "sw" ? "Mhusika mkuu" : "Contact person"}
              </p>
              <p className="mt-2 text-sm font-medium">{supplier.contact_person || (language === "sw" ? "Haijawekwa" : "Not provided")}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {language === "sw" ? "Barua pepe" : "Email"}
                </p>
                <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="break-all">{supplier.email || (language === "sw" ? "Haijawekwa" : "Not provided")}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {language === "sw" ? "Simu" : "Phone"}
                </p>
                <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>{supplier.phone || (language === "sw" ? "Haijawekwa" : "Not provided")}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="section-shell">
          <CardHeader>
            <CardTitle>{language === "sw" ? "Maelezo ya ziada" : "Additional details"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {language === "sw" ? "Anwani" : "Address"}
              </p>
              <div className="mt-2 flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <span>{supplier.address || (language === "sw" ? "Haijawekwa" : "Not provided")}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-border/80 bg-background/60 p-4 text-sm text-muted-foreground">
              {language === "sw"
                ? "Tumia ukurasa huu kufuatilia deni la msambazaji na kuhakikisha taarifa za mawasiliano ziko sahihi kabla ya kuagiza au kupokea bidhaa."
                : "Use this page to track payables and keep supplier contact details accurate before reordering or receiving stock."}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
