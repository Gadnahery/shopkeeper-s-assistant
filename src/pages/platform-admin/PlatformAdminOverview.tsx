import { Link } from "react-router-dom";
import {
  Clock3,
  Users,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  usePendingPayments,
  useAllSubscriptions,
  useAllPayments,
} from "@/hooks/usePlatformAdmin";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function PlatformAdminOverview() {
  const { data: pendingPayments = [], isLoading: loadingPending } = usePendingPayments();
  const { data: subscriptions = [], isLoading: loadingSubs } = useAllSubscriptions();
  const { data: allPayments = [], isLoading: loadingPayments } = useAllPayments();

  const activeSubscribers = subscriptions.filter((s) => s.status === "active").length;
  const pendingSubscribers = subscriptions.filter((s) => s.status === "pending").length;
  const expiredSubscribers = subscriptions.filter((s) => s.status === "expired").length;

  // Calculate expiring soon (within 7 days)
  const now = new Date().getTime();
  const expiringSoonCount = subscriptions.filter((s) => {
    if (s.status !== "active") return false;
    const expiry = s.current_period_ends_at;
    if (!expiry) return false;
    const diffDays = Math.ceil((new Date(expiry).getTime() - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  // Total collected revenue from approved payments
  const totalRevenue = allPayments
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // This month's revenue
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const thisMonthRevenue = allPayments
    .filter((p) => p.status === "success" && p.created_at.startsWith(currentMonthPrefix))
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Platform Administration Overview
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor subscriptions, verify manual customer payments, and track platform revenue across all shops.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {/* Pending Card */}
        <Card className="border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pending Review</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock3 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {pendingPayments.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {pendingPayments.length > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  Requires your verification
                </span>
              ) : (
                "Queue is clear"
              )}
            </p>
          </div>
        </Card>

        {/* Active Subscribers */}
        <Card className="border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Paid Shops</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {activeSubscribers}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              +{pendingSubscribers} pending activation
            </p>
          </div>
        </Card>

        {/* Expiring Soon */}
        <Card className="border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Expiring in ≤7 Days</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {expiringSoonCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Receiving daily renewal alerts
            </p>
          </div>
        </Card>

        {/* This Month Revenue */}
        <Card className="border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">This Month Revenue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(thisMonthRevenue)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Total lifetime: {formatCurrency(totalRevenue)}
            </p>
          </div>
        </Card>
      </div>

      {/* Pending Queue Section */}
      <Card className="border border-border/80 bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-amber-500" />
              <span>Pending Payment Submissions</span>
              {pendingPayments.length > 0 && (
                <Badge className="bg-amber-500 text-white font-bold ml-1.5">
                  {pendingPayments.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Shopkeepers waiting for manual payment verification and Pro activation.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="text-xs gap-1.5">
            <Link to="/platform-admin/payments">
              <span>View All Payments</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {pendingPayments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <Check className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">All payments are verified</p>
              <p className="text-xs">No pending manual payment submissions at this time.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {pendingPayments.slice(0, 5).map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {payment.shops?.name ?? "Shop"}
                      </span>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">
                        {payment.payment_channel}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                      <span>Phone: {payment.phone_number}</span>
                      <span>•</span>
                      <span>Ref: {payment.transaction_reference ?? "N/A"}</span>
                      <span>•</span>
                      <span>
                        Date: {new Date(payment.created_at).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-bold text-sm text-foreground">
                        {formatCurrency(Number(payment.amount))}
                      </span>
                    </div>
                    <Button asChild size="sm" className="h-8 text-xs font-semibold gap-1">
                      <Link to={`/platform-admin/payments?selected=${payment.id}`}>
                        <span>Review</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
