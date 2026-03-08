import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomers } from "@/hooks/useCustomers";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageLoader } from "@/components/PageLoader";

export default function Loyalty() {
  const { language } = useLanguage();
  const { data: customers, isLoading } = useCustomers();
  if (customers === undefined || isLoading) {
    return <PageLoader message="Loading loyalty..." messageSw="Inapakia uanachama..." language={language} />;
  }
  const members = (customers || []).filter((c) => Number((c as any).loyalty_points || 0) > 0);
  const totalPoints = members.reduce((sum, c) => sum + Number((c as any).loyalty_points || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Active members</p><p className="text-2xl font-bold">{members.length}</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Points issued</p><p className="text-2xl font-bold">{totalPoints.toLocaleString()}</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Redemptions</p><p className="text-2xl font-bold">0</p></CardContent></Card>
      </div>
      <Card className="glass-card">
        <CardHeader><CardTitle>Loyalty Members</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No loyalty members yet.</p>
          ) : (
            members.map((c) => (
              <div key={c.id} className="rounded-lg border p-3 flex items-center justify-between">
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
