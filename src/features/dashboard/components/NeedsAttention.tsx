import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  Users,
  ClipboardList,
  ShoppingCart,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AttentionItem {
  id: string;
  type: "out_of_stock" | "low_stock" | "customer_debt" | "pending_orders" | "pending_purchases";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  countOrValue: string | number;
  actionText: string;
  route: string;
}

interface NeedsAttentionProps {
  language: "en" | "sw";
  formatMoney: (val: number) => string;
  outOfStockCount: number;
  lowStockCount: number;
  customerDebtTotal: number;
  debtorsCount: number;
  pendingOrdersCount: number;
  pendingPurchasesCount: number;
  compact?: boolean;
}

export function NeedsAttention({
  language,
  formatMoney,
  outOfStockCount,
  lowStockCount,
  customerDebtTotal,
  debtorsCount,
  pendingOrdersCount,
  pendingPurchasesCount,
  compact = false,
}: NeedsAttentionProps) {
  const navigate = useNavigate();

  // Collect real actionable exceptions
  const items: AttentionItem[] = [];

  if (outOfStockCount > 0) {
    items.push({
      id: "out-of-stock",
      type: "out_of_stock",
      severity: "critical",
      title:
        language === "sw"
          ? `${outOfStockCount} bidhaa zimekwisha stoki`
          : `${outOfStockCount} ${outOfStockCount === 1 ? "product is" : "products are"} out of stock`,
      description:
        language === "sw"
          ? "Wateja hawawezi kununua bidhaa hizi hadi ziongezwe."
          : "Customers cannot purchase these until inventory is replenished.",
      countOrValue: `${outOfStockCount}`,
      actionText: language === "sw" ? "Tazama Stoki" : "View inventory",
      route: "/inventory",
    });
  } else if (lowStockCount > 0) {
    items.push({
      id: "low-stock",
      type: "low_stock",
      severity: "warning",
      title:
        language === "sw"
          ? `${lowStockCount} bidhaa ziko karibu kuisha`
          : `${lowStockCount} ${lowStockCount === 1 ? "product is" : "products are"} low in stock`,
      description:
        language === "sw"
          ? "Ziko chini ya kiwango cha tahadhari ulichoweka."
          : "Inventory is below your alert threshold.",
      countOrValue: `${lowStockCount}`,
      actionText: language === "sw" ? "Tazama Stoki" : "View inventory",
      route: "/inventory",
    });
  }

  if (customerDebtTotal > 0) {
    items.push({
      id: "customer-debt",
      type: "customer_debt",
      severity: "warning",
      title:
        language === "sw"
          ? `${formatMoney(customerDebtTotal)} madeni ya wateja`
          : `${formatMoney(customerDebtTotal)} outstanding from customers`,
      description:
        language === "sw"
          ? `Inadaiwa kutoka kwa wateja ${debtorsCount}.`
          : `Owed by ${debtorsCount} ${debtorsCount === 1 ? "customer" : "customers"}.`,
      countOrValue: formatMoney(customerDebtTotal),
      actionText: language === "sw" ? "Fuatilia Madeni" : "View receivables",
      route: "/customers",
    });
  }

  if (pendingOrdersCount > 0) {
    items.push({
      id: "pending-orders",
      type: "pending_orders",
      severity: "info",
      title:
        language === "sw"
          ? `${pendingOrdersCount} maagizo ya wateja yanasubiri`
          : `${pendingOrdersCount} customer ${pendingOrdersCount === 1 ? "order is" : "orders are"} pending`,
      description:
        language === "sw"
          ? "Inahitaji kuandaliwa na kufungashiwa mteja."
          : "Awaiting fulfillment or confirmation.",
      countOrValue: `${pendingOrdersCount}`,
      actionText: language === "sw" ? "Tazama Maagizo" : "View orders",
      route: "/sales?tab=orders",
    });
  }

  if (pendingPurchasesCount > 0) {
    items.push({
      id: "pending-purchases",
      type: "pending_purchases",
      severity: "info",
      title:
        language === "sw"
          ? `${pendingPurchasesCount} manunuzi yanasubiri kupokelewa`
          : `${pendingPurchasesCount} purchase ${pendingPurchasesCount === 1 ? "order is" : "orders are"} pending`,
      description:
        language === "sw"
          ? "Shehena kutoka kwa wasambazaji haijathibitishwa."
          : "Supplier deliveries awaiting physical receipt.",
      countOrValue: `${pendingPurchasesCount}`,
      actionText: language === "sw" ? "Tazama Manunuzi" : "View purchases",
      route: "/purchases",
    });
  }

  if (compact) {
    if (items.length === 0) {
      return (
        <div className="flex h-full flex-col justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 sm:p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {language === "sw" ? "Uangalizi" : "Attention"}
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <p className="text-xs sm:text-sm font-bold text-foreground">
              {language === "sw" ? "Kila kitu kiko shwari!" : "All systems healthy"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
              {language === "sw" ? "Hakuna tahadhari za stoki au madeni." : "No stock shortages or debts require action."}
            </p>
          </div>
          <div className="mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            ✓ {language === "sw" ? "Hakuna vikwazo" : "0 pending exceptions"}
          </div>
        </div>
      );
    }

    const firstItem = items[0];
    const isCritical = firstItem.severity === "critical";
    const isWarning = firstItem.severity === "warning";

    return (
      <div
        onClick={() => navigate(firstItem.route)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && navigate(firstItem.route)}
        className={cn(
          "group relative flex h-full flex-col justify-between rounded-2xl border p-2.5 sm:p-3 shadow-2xs cursor-pointer select-none transition-all hover:shadow-xs",
          isCritical
            ? "border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50"
            : isWarning
            ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
            : "border-border bg-card hover:border-primary/40"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {language === "sw" ? "Inayohitaji Uangalizi" : "Needs Attention"}
            </span>
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500/20 px-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              {items.length}
            </span>
          </div>
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-lg",
              isCritical
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                : isWarning
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-primary/10 text-primary"
            )}
          >
            {firstItem.type === "out_of_stock" && <AlertCircle className="h-3.5 w-3.5" />}
            {firstItem.type === "low_stock" && <AlertTriangle className="h-3.5 w-3.5" />}
            {firstItem.type === "customer_debt" && <Users className="h-3.5 w-3.5" />}
            {firstItem.type === "pending_orders" && <ClipboardList className="h-3.5 w-3.5" />}
            {firstItem.type === "pending_purchases" && <ShoppingCart className="h-3.5 w-3.5" />}
          </div>
        </div>

        <div className="mt-1 min-w-0">
          <p className="text-xs sm:text-sm font-bold text-foreground truncate">
            {firstItem.title}
          </p>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            {firstItem.description}
          </p>
        </div>

        <div className="mt-1 flex items-center justify-between text-[11px] font-bold text-primary">
          <span>{firstItem.actionText}</span>
          <div className="flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            {items.length > 1 && (
              <span className="text-[10px] text-muted-foreground mr-1 font-normal">
                +{items.length - 1} {language === "sw" ? "nyingine" : "more"}
              </span>
            )}
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {language === "sw" ? "Inayohitaji Uangalizi" : "Needs Attention"}
          </h2>
          {items.length > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500/15 px-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              {items.length}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        /* Positive Empty State */
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 sm:p-3 text-emerald-700 dark:text-emerald-300">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-bold text-foreground">
              {language === "sw" ? "Kila kitu kiko shwari!" : "Everything looks good"}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {language === "sw"
                ? "Hakuna tahadhari za stoki, madeni mapya, au maagizo yanayosubiri sasa."
                : "No urgent stock shortages, outstanding debts, or pending orders require attention."}
            </p>
          </div>
        </div>
      ) : (
        /* Actionable Alert Cards */
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const isCritical = item.severity === "critical";
            const isWarning = item.severity === "warning";

            return (
              <div
                key={item.id}
                onClick={() => navigate(item.route)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate(item.route)}
                className={cn(
                  "group relative flex items-center justify-between rounded-2xl border p-2.5 sm:p-3 transition-all hover:shadow-xs cursor-pointer select-none",
                  isCritical
                    ? "border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50"
                    : isWarning
                    ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1 pr-2">
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                      isCritical
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        : isWarning
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {item.type === "out_of_stock" && <AlertCircle className="h-3.5 w-3.5" />}
                    {item.type === "low_stock" && <AlertTriangle className="h-3.5 w-3.5" />}
                    {item.type === "customer_debt" && <Users className="h-3.5 w-3.5" />}
                    {item.type === "pending_orders" && <ClipboardList className="h-3.5 w-3.5" />}
                    {item.type === "pending_purchases" && <ShoppingCart className="h-3.5 w-3.5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                  <span className="hidden sm:inline text-[11px]">{item.actionText}</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
