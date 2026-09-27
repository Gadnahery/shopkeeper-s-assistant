import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, TrendingUp, Banknote, ArrowUp, ArrowDown, HelpCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { DashboardPeriod } from "./DashboardGreeting";

interface DashboardKpisProps {
  period: DashboardPeriod;
  language: "en" | "sw";
  formatMoney: (val: number) => string;
  totalSales: number;
  orderCount: number;
  netProfit: number;
  grossProfit: number;
  cogs: number;
  revenue: number;
  totalExpenses: number;
  cashReceived: number;
  hasPhysicalItemsSoldWithoutCost?: boolean;
  salesGrowthPercent?: number | null;
  isLoading?: boolean;
}

export function DashboardKpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-2.5 sm:p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-2.5 w-24" />
        </div>
      ))}
    </div>
  );
}

export function DashboardKpis({
  period,
  language,
  formatMoney,
  totalSales,
  orderCount,
  netProfit,
  grossProfit,
  cogs,
  revenue,
  totalExpenses,
  cashReceived,
  hasPhysicalItemsSoldWithoutCost = false,
  salesGrowthPercent,
  isLoading,
}: DashboardKpisProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return <DashboardKpiSkeleton />;
  }

  // Dynamic titles based on period
  const getSalesTitle = () => {
    switch (period) {
      case "today":
        return language === "sw" ? "Mauzo ya Leo" : "Sales Today";
      case "week":
        return language === "sw" ? "Mauzo ya Wiki Hii" : "Sales This Week";
      case "month":
        return language === "sw" ? "Mauzo ya Mwezi Huu" : "Sales This Month";
      case "year":
        return language === "sw" ? "Mauzo ya Mwaka Huu" : "Sales This Year";
      default:
        return language === "sw" ? "Jumla ya Mauzo" : "Total Sales";
    }
  };

  const getProfitTitle = () => {
    switch (period) {
      case "today":
        return language === "sw" ? "Faida ya Leo" : "Profit Today";
      case "week":
        return language === "sw" ? "Faida ya Wiki Hii" : "Profit This Week";
      case "month":
        return language === "sw" ? "Faida ya Mwezi Huu" : "Profit This Month";
      case "year":
        return language === "sw" ? "Faida ya Mwaka Huu" : "Profit This Year";
      default:
        return language === "sw" ? "Faida Halisi" : "Net Profit";
    }
  };

  const getCashTitle = () => {
    switch (period) {
      case "today":
        return language === "sw" ? "Pesa Taslimu ya Leo" : "Cash Received Today";
      default:
        return language === "sw" ? "Pesa Zilizopokelewa" : "Cash Received";
    }
  };

  // Card 1 supporting text
  const ordersLabel =
    orderCount === 1
      ? language === "sw"
        ? "muamala 1"
        : "1 order"
      : language === "sw"
      ? `miamala ${orderCount}`
      : `${orderCount} orders`;

  // Profit state check:
  // If physical items were sold, but COGS is 0 because cost was not filled in on products
  const isCostDataMissing = hasPhysicalItemsSoldWithoutCost && cogs === 0 && totalSales > 0;
  const netMarginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  // Card 3 supporting text
  const creditOutstanding = Math.max(0, totalSales - cashReceived);
  const isFullyCollected = totalSales > 0 && creditOutstanding <= 0;

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 h-full">
      {/* CARD 1: SALES */}
      <div
        onClick={() => navigate("/sales")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && navigate("/sales")}
        className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-2.5 sm:p-3 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all cursor-pointer select-none"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {getSalesTitle()}
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
            <ShoppingBag className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="mt-1">
          <p className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">
            {formatMoney(totalSales)}
          </p>
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
          <span className="font-medium text-foreground">{ordersLabel}</span>
          {salesGrowthPercent !== null && salesGrowthPercent !== undefined && (
            <>
              <span className="text-border">·</span>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-semibold",
                  salesGrowthPercent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}
              >
                {salesGrowthPercent >= 0 ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                {Math.abs(salesGrowthPercent)}% vs prev
              </span>
            </>
          )}
        </div>
      </div>

      {/* CARD 2: PROFIT */}
      <div
        onClick={() => navigate("/reports")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && navigate("/reports")}
        className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-2.5 sm:p-3 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all cursor-pointer select-none"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {getProfitTitle()}
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="mt-1">
          {isCostDataMissing ? (
            <div className="space-y-0.5">
              <p className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">
                {formatMoney(netProfit)}
              </p>
              <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                <HelpCircle className="h-2.5 w-2.5" />
                <span>{language === "sw" ? "Gharama haijajazwa" : "Estimated (Cost data missing)"}</span>
              </div>
            </div>
          ) : (
            <p
              className={cn(
                "text-xl sm:text-2xl font-black tracking-tight truncate",
                netProfit >= 0 ? "text-foreground" : "text-rose-600 dark:text-rose-400"
              )}
            >
              {netProfit < 0 ? `-${formatMoney(Math.abs(netProfit))}` : formatMoney(netProfit)}
            </p>
          )}
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
          {totalSales > 0 ? (
            <>
              <span className={cn("font-semibold", netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                {netMarginPercent.toFixed(1)}% {language === "sw" ? "uwiano wa faida" : "margin"}
              </span>
              <span className="text-border">·</span>
              <span>{language === "sw" ? "Baada ya gharama" : "After expenses"}</span>
            </>
          ) : (
            <span>{language === "sw" ? "Hakuna mauzo bado" : "No sales yet"}</span>
          )}
        </div>
      </div>

      {/* CARD 3: CASH RECEIVED */}
      <div
        onClick={() => navigate("/sales")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && navigate("/sales")}
        className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-2.5 sm:p-3 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all cursor-pointer select-none"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {getCashTitle()}
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
            <Banknote className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="mt-1">
          <p className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">
            {formatMoney(cashReceived)}
          </p>
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-[11px] truncate">
          {totalSales > 0 ? (
            isFullyCollected ? (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                ✓ {language === "sw" ? "Imelipwa yote kikamilifu" : "Fully collected"}
              </span>
            ) : (
              <span className="font-semibold text-amber-600 dark:text-amber-400 truncate">
                {formatMoney(creditOutstanding)} {language === "sw" ? "madeni / haijalipwa" : "outstanding on credit"}
              </span>
            )
          ) : (
            <span className="text-muted-foreground">
              {language === "sw" ? "Hakuna makusanyo bado" : "No collections yet"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
