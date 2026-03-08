import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCustomers } from "@/hooks/useCustomers";
import { useSalesByCustomer } from "@/hooks/useSales";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageLoader } from "@/components/PageLoader";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { data: customers, isLoading } = useCustomers();
  const customer = useMemo(() => (customers || []).find((c) => c.id === id), [customers, id]);
  const { data: sales } = useSalesByCustomer(id || null);

  if (customers === undefined || isLoading) {
    return <PageLoader message="Loading customer..." messageSw="Inapakia mteja..." language={language} />;
  }

  if (!customer) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">Customer not found.</CardContent>
      </Card>
    );
  }

  const totalSpent = (sales || []).reduce((sum, s) => sum + Number(s.total || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/customers")}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
      </div>
      <Card className="glass-card">
        <CardHeader><CardTitle>{customer.name}</CardTitle></CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          <p><span className="font-medium">Phone:</span> {customer.phone || "—"}</p>
          <p><span className="font-medium">Type:</span> {customer.customer_type || "retail"}</p>
          <p><span className="font-medium">Credit balance:</span> {Number(customer.credit_balance || 0).toLocaleString()}</p>
          <p><span className="font-medium">Total spent:</span> {totalSpent.toLocaleString()}</p>
        </CardContent>
      </Card>
      <Card className="glass-card">
        <CardHeader><CardTitle>Recent Sales</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(sales || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            (sales || []).map((s) => (
              <div key={s.id} className="rounded-lg border p-3 flex items-center justify-between">
                <span>{s.invoice_number}</span>
                <span className="font-semibold">{Number(s.total || 0).toLocaleString()}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
