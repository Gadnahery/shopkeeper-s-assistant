import { useMemo } from "react";
import {
  TrendingUp,
  WalletCards,
  CheckCircle2,
  Calendar,
  Smartphone,
  CreditCard,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAllPayments } from "@/hooks/usePlatformAdmin";
import { cn } from "@/lib/utils";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function PlatformAdminRevenue() {
  const { data: payments = [], isLoading, refetch, isRefetching } = useAllPayments();

  const approvedPayments = useMemo(() => {
    return payments.filter((p) => p.status === "success");
  }, [payments]);

  // Financial aggregates
  const totalLifetimeRevenue = useMemo(() => {
    return approvedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [approvedPayments]);

  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const thisMonthRevenue = useMemo(() => {
    return approvedPayments
      .filter((p) => p.created_at.startsWith(currentMonthPrefix))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [approvedPayments, currentMonthPrefix]);

  const channelStats = useMemo(() => {
    let mpesaTotal = 0;
    let mpesaCount = 0;
    let halopesaTotal = 0;
    let halopesaCount = 0;

    for (const p of approvedPayments) {
      const amt = Number(p.amount || 0);
      if (p.payment_channel.toLowerCase().includes("mpesa")) {
        mpesaTotal += amt;
        mpesaCount++;
      } else {
        halopesaTotal += amt;
        halopesaCount++;
      }
    }

    return { mpesaTotal, mpesaCount, halopesaTotal, halopesaCount };
  }, [approvedPayments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Revenue & Collections
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Breakdown of verified subscription payments received across mobile money networks.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="gap-1.5 h-9"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Revenue KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card className="border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Collections</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(totalLifetimeRevenue)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {approvedPayments.length} successful transactions
            </p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">This Month</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(thisMonthRevenue)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Current calendar month
            </p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">M-Pesa Volume</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Smartphone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(channelStats.mpesaTotal)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {channelStats.mpesaCount} payments received
            </p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">HaloPesa Volume</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(channelStats.halopesaTotal)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {channelStats.halopesaCount} payments received
            </p>
          </div>
        </Card>
      </div>

      {/* Verified Transactions Table */}
      <Card className="border border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>Verified Transactions History</span>
          </CardTitle>
          <CardDescription>
            All approved payments contributing to WiseCash subscription revenue.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex min-h-[250px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : approvedPayments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <WalletCards className="mx-auto h-8 w-8 opacity-40 mb-2" />
              <p className="font-semibold text-foreground text-sm">No verified revenue yet</p>
              <p className="text-xs mt-1">Payments will appear here once approved by platform admin.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4">Shop Name</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Sender Phone</th>
                    <th className="py-3 px-4">SMS Receipt Code</th>
                    <th className="py-3 px-4">Verified At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {approvedPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {payment.shops?.name ?? "Shop"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {formatCurrency(Number(payment.amount))}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">
                          {payment.payment_channel}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {payment.phone_number}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-foreground">
                        {payment.transaction_reference ?? "-"}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {payment.verified_at
                          ? new Date(payment.verified_at).toLocaleString("en-GB")
                          : new Date(payment.created_at).toLocaleString("en-GB")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
