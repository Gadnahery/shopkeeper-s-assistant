import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomers } from "@/hooks/useCustomers";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageLoader } from "@/components/PageLoader";
import { PageHeader } from "@/components/common/PageHeader";

export default function Loyalty() {
  const { language } = useLanguage();
  const { data: customers, isLoading } = useCustomers();
  if (customers === undefined || isLoading) {
    return <PageLoader message="Loading loyalty..." messageSw="Inapakia uanachama..." language={language} />;
  }
  const members = (customers || []).filter((c) => Number((c as any).loyalty_points || 0) > 0);
  const totalPoints = members.reduce((sum, c) => sum + Number((c as any).loyalty_points || 0), 0);

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title={language === "sw" ? "Uaminifu wa Wateja" : "Customer Loyalty"}
        subtitle={language === "sw" ? "Angalia wanachama, pointi zilizotolewa, na maendeleo ya programu ya uaminifu." : "Review active members, issued points, and the health of your loyalty program."}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="section-shell"><CardContent className="p-5"><p className="text-sm text-muted-foreground">{language === "sw" ? "Wanachama hai" : "Active members"}</p><p className="text-2xl font-bold">{members.length}</p></CardContent></Card>
        <Card className="section-shell"><CardContent className="p-5"><p className="text-sm text-muted-foreground">{language === "sw" ? "Pointi zilizotolewa" : "Points issued"}</p><p className="text-2xl font-bold">{totalPoints.toLocaleString()}</p></CardContent></Card>
        <Card className="section-shell"><CardContent className="p-5"><p className="text-sm text-muted-foreground">{language === "sw" ? "Zilizotumika" : "Redemptions"}</p><p className="text-2xl font-bold">0</p></CardContent></Card>
      </div>
      <Card className="section-shell">
        <CardHeader><CardTitle>{language === "sw" ? "Wanachama wa Uaminifu" : "Loyalty Members"}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">{language === "sw" ? "Hakuna wanachama wa uaminifu bado." : "No loyalty members yet."}</p>
          ) : (
            members.map((c) => (
              <div key={c.id} className="rounded-xl border border-border/70 bg-background/50 p-3 flex items-center justify-between">
                <span>{c.name}</span>
                <span className="font-semibold">{Number((c as any).loyalty_points || 0).toLocaleString()} pts</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
