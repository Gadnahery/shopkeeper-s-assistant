import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShoppingBag, CheckCircle2, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface RecentSalesListProps {
  sales: any[];
  language: "en" | "sw";
  formatMoney: (val: number) => string;
}

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "";
  }
}

export function RecentSalesList({ sales, language, formatMoney }: RecentSalesListProps) {
  const navigate = useNavigate();

  // Take top 5 recent sales
  const recentSales = useMemo(() => {
    return (sales || [])
      .filter((s) => s.status === "completed")
      .slice(0, 5);
  }, [sales]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <h2 className="text-sm font-bold text-foreground">
            {language === "sw" ? "Mauzo ya Karibuni" : "Recent Sales"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {language === "sw"
              ? "Miamala ya mwisho iliyorekodiwa"
              : "Latest transactions recorded"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/sales")}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <span>{language === "sw" ? "Tazama yote" : "View all"}</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* Content */}
      {recentSales.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground space-y-2">
          <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-xs sm:text-sm font-medium">
            {language === "sw"
              ? "Hakuna mauzo yaliyorekodiwa kwa kipindi hiki."
              : "No sales recorded for this period."}
          </p>
          <p className="text-[11px] text-muted-foreground/70">
            {language === "sw"
              ? "Mauzo yatakapokamilishwa kupitia POS, miamala itaonekana hapa."
              : "Completed checkout transactions will appear here automatically."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {recentSales.map((sale) => {
            const invoice =
              sale.invoice_number ||
              `#${String(sale.id || "").slice(0, 6).toUpperCase()}`;

            const customerName =
              sale.customer_name ||
              sale.customers?.name ||
              (language === "sw" ? "Mteja wa kawaida" : "Walk-in");

            const timeRelative = formatRelativeTime(sale.created_at);
            const timeFormatted = sale.created_at
              ? format(new Date(sale.created_at), "HH:mm")
              : "";

            const paymentMethod = String(sale.payment_method || "Cash").toLowerCase();
            const isCredit = paymentMethod === "credit";
            const isMpesa = paymentMethod === "m-pesa" || paymentMethod === "mpesa" || paymentMethod === "mobile";

            return (
              <div
                key={sale.id}
                onClick={() => navigate("/sales")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate("/sales")}
                className="flex items-center justify-between py-3 sm:py-3.5 hover:bg-muted/30 px-2 rounded-xl transition-colors cursor-pointer select-none"
              >
                {/* Left: Invoice & Customer */}
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
                      isCredit
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    <ShoppingBag className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {invoice}
                      </span>
                      <span className="text-border">·</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {customerName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{timeRelative || timeFormatted}</span>
                      {timeFormatted && timeRelative && (
                        <span className="text-muted-foreground/60">({timeFormatted})</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Payment Status Badge & Amount */}
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={cn(
                      "hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                      isCredit
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    )}
                  >
                    {!isCredit && <CheckCircle2 className="h-2.5 w-2.5" />}
                    {isCredit
                      ? language === "sw"
                        ? "Mkopo"
                        : "Credit"
                      : isMpesa
                      ? "Paid · M-Pesa"
                      : "Paid · Cash"}
                  </span>

                  <span className="text-xs sm:text-sm font-bold text-foreground">
                    +{formatMoney(Number(sale.total || 0))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
