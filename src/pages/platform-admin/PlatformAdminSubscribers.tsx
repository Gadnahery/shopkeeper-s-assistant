import { useState, useMemo } from "react";
import {
  Users,
  Search,
  ShieldCheck,
  Clock3,
  AlertTriangle,
  Calendar,
  Phone,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAllSubscriptions, type SubscriptionWithShop } from "@/hooks/usePlatformAdmin";
import { cn } from "@/lib/utils";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function getDaysRemaining(subscription: SubscriptionWithShop) {
  const targetDate = subscription.current_period_ends_at || subscription.trial_ends_at;

  if (!targetDate) return null;
  const diff = new Date(targetDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function PlatformAdminSubscribers() {
  const { data: subscriptions = [], isLoading, refetch, isRefetching } = useAllSubscriptions();
  const [filter, setFilter] = useState<"all" | "active" | "pending" | "expiring" | "expired">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const days = getDaysRemaining(sub);
      const isExpiring =
        sub.status === "active" &&
        days !== null &&
        days >= 0 &&
        days <= 7;

      if (filter === "active" && sub.status !== "active") return false;
      if (filter === "pending" && sub.status !== "pending") return false;
      if (filter === "expired" && sub.status !== "expired") return false;
      if (filter === "expiring" && !isExpiring) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const shopName = sub.shops?.name?.toLowerCase() ?? "";
      const phone = sub.shops?.phone?.toLowerCase() ?? "";
      return shopName.includes(q) || phone.includes(q);
    });
  }, [subscriptions, filter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Shop Subscribers & Status
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor billing status, pending activations, and access expiry across all registered shops.
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/80 w-full sm:w-auto overflow-x-auto">
          {(["all", "active", "pending", "expiring", "expired"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all whitespace-nowrap",
                filter === status
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {status === "expiring" ? "Expiring ≤7d" : status === "pending" ? "Pending Activation" : status}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by shop name or phone..."
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Subscribers Table Card */}
      <Card className="border border-border bg-card shadow-xs overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              All Shops ({filteredSubscriptions.length})
            </span>
          </CardTitle>
          <CardDescription className="text-xs">
            Showing registered shops with their current subscription status and end date.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No subscribers found matching filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground">
                    <th className="py-3 px-4 font-semibold">Shop Name & Contact</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Days Remaining</th>
                    <th className="py-3 px-4 font-semibold">Expiry Date</th>
                    <th className="py-3 px-4 font-semibold">Price/Month</th>
                    <th className="py-3 px-4 font-semibold">Provider</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredSubscriptions.map((sub) => {
                    const days = getDaysRemaining(sub);
                    const isActive = sub.status === "active";
                    const isPending = sub.status === "pending";
                    const isExp = sub.status === "expired";
                    const expiryDate = sub.current_period_ends_at;

                    return (
                      <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          <div>
                            <span>{sub.shops?.name ?? "Shop"}</span>
                            {sub.shops?.phone && (
                              <span className="block text-[11px] text-muted-foreground font-mono font-normal mt-0.5">
                                {sub.shops.phone}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge
                            variant={isActive ? "default" : isPending ? "outline" : "destructive"}
                            className={cn(
                              "text-[10px] font-bold uppercase",
                              isActive && "bg-emerald-600 text-white",
                              isPending && "border-amber-500 text-amber-600 dark:text-amber-400"
                            )}
                          >
                            {isPending ? "Pending" : sub.status}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 font-medium">
                          {days !== null ? (
                            <span
                              className={cn(
                                days <= 3 && "text-rose-600 dark:text-rose-400 font-bold",
                                days > 3 && days <= 7 && "text-amber-600 dark:text-amber-400 font-semibold",
                                days > 7 && "text-foreground"
                              )}
                            >
                              {days <= 0 ? "Expired" : `${days} days`}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-muted-foreground">
                          {expiryDate
                            ? new Date(expiryDate).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          {formatCurrency(Number(sub.monthly_price || 25000))}
                        </td>

                        <td className="py-3.5 px-4 text-muted-foreground uppercase font-mono">
                          {sub.provider || "manual"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
